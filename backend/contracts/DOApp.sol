// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {IDataStorage} from "./IDataStorage.sol";

import "hardhat/console.sol";

contract DOApp is Ownable {
    using SafeERC20 for IERC20;


    struct ProcessingVars {
        uint roundedTokenPrice;
        IDataStorage.SegmentDCAEntry[][2] waitingSegmentEntries;
        IERC20 aTokenA;
        IERC20 aTokenB;
        uint16 cptBuy;
        uint16 cptSell;
        bool isBuy;
    }

    // boolean to check if production mode
    // we use it to verify som uniswap settings (min output token swap and swap price estimation)
    bool isProductionMode = false;

    //Contract to manage Data logic
    IDataStorage private dataStorage;

    uint8 constant BALANCE_INDEX_DECIMAL_NUMBER = 20;
    uint24 constant UNISWAP_FEE_TIERS = 3000;
    //deposit lock penalty  time
    //uint constant public lockTime = 10 days;
    uint8 constant MAX_DCA_JOB_PER_DCA_EXECUTION_CALL = 2;



    event TokenDeposit(
        address _sender,
        uint indexed _pairId,
        address token,
        uint _amount,
        uint _timestamp
    );

    event TokenWithdrawal(
        address _sender,
        uint indexed _pairId,
        address token,
        uint _amount,
        uint _timestamp
    );

    event DCAExecution(
        address _account,
        uint indexed _pairId,
        address _tokenInput,
        uint _tokenInputPrice,
        IERC20 _tokenOutput,
        uint _amount,
        uint _timeStamp
    );

     constructor(
        bool _isProductionMode,
        IDataStorage _dataStorage
    ) payable Ownable() {
        isProductionMode = _isProductionMode;
        dataStorage = _dataStorage;
    }
    /*
    receive() external payable {}

    fallback() external payable {}
    */

    /**
     * @notice  Deposit a token A amount in a DOApp token Pair
     * @param   _pairId  the pair ID used to deposit token A
     * @param   _amount  the token amount to deposit
     * @dev     _pairID must be an existing token Pair
     * @dev     amount must be >0
     */
    function depositTokenA(uint _pairId, uint _amount) external {
        require(_amount > 0, "Deposit amount should be > 0");
        IDataStorage.TokenPair memory lPair = dataStorage.getTokenPair(_pairId);

        //deposit token to current contract
        IERC20(lPair.tokenA).safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );

        //supply token to AAVE
        supplyTokenAsLending(
            IPoolAddressesProvider(lPair.aavePoolAddressesProvider),
            lPair.tokenA,
            _amount
        );

        IDataStorage.TokenPairUserBalance memory userBalance = dataStorage
            .getTokenPairUserBalances(_pairId, msg.sender);
        // refresh index balance
        userBalance.indexA = computeBalanceIndex();
        userBalance.balanceA += _amount;
        dataStorage.setTokenPairUserBalances(_pairId, msg.sender, userBalance);

        emit TokenDeposit(
            msg.sender,
            _pairId,
            lPair.tokenA, 
            _amount,
            block.timestamp
        );
    }

    /**
     * @notice  Withdraw a token A amount from a DOApp token pair
     * @param   _pairId  the pair ID used to deposit token A
     * @param   _amount  the token amount to deposit
     * @dev     _pairID must be an existing token Pair
     * @dev     amount must be >0
     */
    function withdrawTokenA(uint _pairId, uint _amount) external {
        require(_amount > 0, "Withdraw amount should be > 0");
        require(
            _amount <=
                dataStorage
                    .getTokenPairUserBalances(_pairId, msg.sender)
                    .balanceA,
            "Amount to withdraw should be < your account balance"
        );
        IDataStorage.TokenPair memory lPair = dataStorage.getTokenPair(_pairId);

        IDataStorage.TokenPairUserBalance memory userBalance = dataStorage
            .getTokenPairUserBalances(_pairId, msg.sender);
        // refresh index balance
        userBalance.indexA = computeBalanceIndex();
        userBalance.balanceA -= _amount;
        dataStorage.setTokenPairUserBalances(_pairId, msg.sender, userBalance);

        // withdraw token from Lending popl
        withdrawTokenFromLending(
            IPoolAddressesProvider(lPair.aavePoolAddressesProvider),
            lPair.tokenA,
            _amount
        );

        //withdraw token to user
        IERC20(lPair.tokenA).safeTransfer(msg.sender, _amount);

        emit TokenWithdrawal(
            msg.sender,
            _pairId,
            lPair.tokenA,
            _amount,
            block.timestamp
        );
    }

    /**
     * @notice  Deposit a token B amount in a DOapp token Pair
     * @param   _pairId  the pair ID used to deposit token B
     * @param   _amount  the token amount to deposit
     * @dev     _pairID must be an existing token Pair
     * @dev     amount must be >0
     */
    function depositTokenB(uint _pairId, uint _amount) external {
        require(_amount > 0, "Deposit amount should be > 0");
        IDataStorage.TokenPair memory lPair = dataStorage.getTokenPair(_pairId);

        //deposit token to curretn contract
        IERC20(lPair.tokenB).safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );

        //supply token to AAVE
        supplyTokenAsLending(
            IPoolAddressesProvider(lPair.aavePoolAddressesProvider),
            lPair.tokenB,
            _amount
        );

        IDataStorage.TokenPairUserBalance memory userBalance = dataStorage
            .getTokenPairUserBalances(_pairId, msg.sender);

        // refresh index balance
        userBalance.indexB = computeBalanceIndex();
        userBalance.balanceB += _amount;
        dataStorage.setTokenPairUserBalances(_pairId, msg.sender, userBalance);

        emit TokenDeposit(
            msg.sender,
            _pairId,
            lPair.tokenB,
            _amount,
            block.timestamp
        );
    }

    /**
     * @notice  Withdraw a token B amount from a DOApp token pair
     * @param   _pairId  the pair ID used to deposit token B
     * @param   _amount  the token amount to deposit
     * @dev     _pairID must be an existing token Pair
     * @dev     amount must be >0
     */
    function withdrawTokenB(uint _pairId, uint _amount) external {
        require(_amount > 0, "Withdraw amount should be > 0");
        require(
            _amount <=
                dataStorage
                    .getTokenPairUserBalances(_pairId, msg.sender)
                    .balanceB,
            "Amount to withdraw should be < your account balance"
        );
        IDataStorage.TokenPair memory lPair = dataStorage.getTokenPair(_pairId);

        IDataStorage.TokenPairUserBalance memory userBalance = dataStorage
            .getTokenPairUserBalances(_pairId, msg.sender);
        // refresh index balance
        userBalance.indexB = computeBalanceIndex();
        userBalance.balanceB -= _amount;
        dataStorage.setTokenPairUserBalances(_pairId, msg.sender, userBalance);

        // withdraw token from Lending popl
        withdrawTokenFromLending(
            IPoolAddressesProvider(lPair.aavePoolAddressesProvider),
            lPair.tokenB,
            _amount
        );

        //withdraw token to user
        IERC20(lPair.tokenB).safeTransfer(msg.sender, _amount);

        emit TokenWithdrawal(
            msg.sender,
            _pairId,
            lPair.tokenB,
            _amount,
            block.timestamp
        );
    }

    function executeDCA(uint _pairId) external returns (bool hasRemainingJobs) {
        uint16 cptTotalBuy;
        uint16 cptTotalSell;

        IDataStorage.TokenPair memory lPair = dataStorage.getTokenPair(_pairId);

        IDataStorage.SegmentDCAToProcess memory segmentDCAToProcess;
        segmentDCAToProcess.segmentBuyEntries = new IDataStorage.SegmentDCAEntry[](MAX_DCA_JOB_PER_DCA_EXECUTION_CALL);
        segmentDCAToProcess.segmentSellEntries = new IDataStorage.SegmentDCAEntry[](MAX_DCA_JOB_PER_DCA_EXECUTION_CALL);

        console.log("-----------executeDCA Hourly -----------");
        (segmentDCAToProcess, cptTotalBuy, cptTotalSell) = getDCAEntriesToProcess(
            lPair,
            IDataStorage.DCADelayEnum.Hourly,
            segmentDCAToProcess, 
            0, 
            0
        );

        console.log("segmentDCAToProcess.segmentBuyEntries.length %s", segmentDCAToProcess.segmentBuyEntries.length);
        console.log("segmentDCAToProcess.segmentSellEntries.length %s", segmentDCAToProcess.segmentSellEntries.length);
        if (
            (cptTotalBuy+ cptTotalSell) <
            MAX_DCA_JOB_PER_DCA_EXECUTION_CALL
        ) {
            console.log("-----------executeDCA Daily -----------");
            (segmentDCAToProcess, cptTotalBuy, cptTotalSell) = getDCAEntriesToProcess(
                lPair,
                IDataStorage.DCADelayEnum.Daily,
                segmentDCAToProcess, 
                cptTotalBuy, 
                cptTotalSell
            );
        }

        console.log("segmentDCAToProcess.segmentBuyEntries.length %s", segmentDCAToProcess.segmentBuyEntries.length);
        console.log("segmentDCAToProcess.segmentSellEntries.length %s", segmentDCAToProcess.segmentSellEntries.length);
        if (
            (cptTotalBuy+ cptTotalSell) <
            MAX_DCA_JOB_PER_DCA_EXECUTION_CALL
        ) {
            console.log("-----------executeDCA Weekly -----------");
            (segmentDCAToProcess, cptTotalBuy, cptTotalSell) = getDCAEntriesToProcess(
                lPair,
                IDataStorage.DCADelayEnum.Weekly,
                segmentDCAToProcess, 
                cptTotalBuy, 
                cptTotalSell
            );
        }

        computeDCA();
        OTCTransaction();

        hasRemainingJobs = false;
        return hasRemainingJobs;

        //emit DCAExecution(account,pairId, tokenInput, tokenInputPrice, tokenOutput, amount, block.timestamp);
    }


    function getRoundedOraclePrice(IDataStorage.TokenPair memory _pair) internal view returns(uint){
        // get Token price
        (, int256 oracleTokenAPrice, , , ) = AggregatorV3Interface(
            _pair.chainlinkPriceFetcher
        ).latestRoundData();
        return (uint(oracleTokenAPrice) - (uint(oracleTokenAPrice) % _pair.tokenPairSegmentSize));
    }


    function getDCAEntriesToProcess(
        IDataStorage.TokenPair memory _pair,
        IDataStorage.DCADelayEnum _delay,
        IDataStorage.SegmentDCAToProcess memory segmentDCAToProcess,
        uint16 cptTotalBuy, 
        uint16 cptTotalSell
    ) internal returns (IDataStorage.SegmentDCAToProcess memory, uint16 outCptTotalBuy, uint16 outCptTotalSell) {

        console.log("GetDCAJobs from par %s delay %s %s tokens",_pair.pairID, uint(_delay));

        // structure to avoir stack toot deep
        ProcessingVars memory procVars;

        procVars.roundedTokenPrice = getRoundedOraclePrice(_pair);
        procVars.waitingSegmentEntries = dataStorage.getDCASegment(_pair.pairID, procVars.roundedTokenPrice, _delay);
        procVars.aTokenA = IERC20(_pair.aTokenA);
        procVars.aTokenB = IERC20(_pair.aTokenB);
        procVars.isBuy = true;


        {
            console.log("Init segment entries BUY %s SELL %s", procVars.waitingSegmentEntries[0].length, procVars.waitingSegmentEntries[1].length);
            if ((procVars.waitingSegmentEntries[0].length != 0) || procVars.waitingSegmentEntries[1].length != 0) {

                IERC20 aTokenA = IERC20(_pair.aTokenA);
                IERC20 aTokenB = IERC20(_pair.aTokenB);
            
                console.log("MAX_DCA_JOB_PER_DCA_EXECUTION_CALL %s ", MAX_DCA_JOB_PER_DCA_EXECUTION_CALL );
                console.log("cptBuy %s cptSell %s ", procVars.cptBuy, procVars.cptSell);
                console.log("cptTotalBuy %s cptTotalSell %s ", cptTotalBuy, cptTotalSell);
                while 
                    (
                    ((cptTotalBuy + cptTotalSell + procVars.cptBuy + procVars.cptSell <  MAX_DCA_JOB_PER_DCA_EXECUTION_CALL) 
                    && ((procVars.waitingSegmentEntries[0].length != procVars.cptBuy) 
                        ||  
                        (procVars.waitingSegmentEntries[1].length != procVars.cptSell))) 

                    ){

                    console.log("Start while - cptBuy %s cptSell %s ", procVars.cptBuy, procVars.cptSell);
                    console.log("Start while - cptTotalBuy %s cptTotalSell %s ", cptTotalBuy, cptTotalSell);
                    if (procVars.isBuy) {
                        console.log("Start isBuy");
                        //edge case where nobody as supply tokenB 's Pair
                        if (address(aTokenA) != address(0)) {
                            console.log("aToken A : %s",address(aTokenA));
                            if (procVars.waitingSegmentEntries[0].length > 0) {
                                // search for a buy entry
                                (
                                    IDataStorage.SegmentDCAEntry memory segEntry,
                                    uint16 nextCptBuy
                                ) = getNextSegmentEntry(
                                        procVars.waitingSegmentEntries[0],
                                        _delay,
                                        procVars.cptBuy,
                                        block.timestamp,
                                        aTokenA
                                    );

                                procVars.cptBuy = nextCptBuy;

                                // if a segment is found
                                console.log("segEntry.amount %s ",segEntry.amount);
                                console.log("segEntry.owner %s ",segEntry.owner);
                                console.log("segEntry.dcaConfigId %s ",segEntry.dcaConfigId);
                                if (segEntry.amount != 0) {
                                    segmentDCAToProcess.segmentBuyEntries[cptTotalBuy+procVars.cptBuy] = segEntry;
                                    segmentDCAToProcess.amountBuy += segEntry.amount;
                                }
                                // if amount to buy > amount to sell, search for a sell entry at next loop
                                console.log("Buy : amountBuy %s amountSell %s ",segmentDCAToProcess.amountBuy, segmentDCAToProcess.amountSell);
                            }
                        }
                        console.log("End Buy  - segmentEntries[0].length == cptBuy %s ", procVars.waitingSegmentEntries[0].length == procVars.cptBuy);
                        if (
                            (segmentDCAToProcess.amountBuy >
                                segmentDCAToProcess.amountSell) ||
                            (procVars.waitingSegmentEntries[0].length == procVars.cptBuy)
                        ) {
                            procVars.isBuy = false;
                        }
                    } else {
                        console.log("Start !isBuy");
                        //edge case where nobody as supply tokenB 's Pair
                        if (address(aTokenB) != address(0)) {
                            console.log("aToken B : %s",address(aTokenB));
                            if (procVars.waitingSegmentEntries[1].length > 0) {
                                // Search for a sell entry
                                (
                                    IDataStorage.SegmentDCAEntry memory segEntry,
                                    uint16 nextCptSell
                                ) = getNextSegmentEntry(
                                        procVars.waitingSegmentEntries[1],
                                        _delay,
                                        procVars.cptSell,
                                        block.timestamp,
                                        aTokenB
                                    );

                                procVars.cptSell = nextCptSell;

                                // if a segment is found
                                if (segEntry.amount != 0) {
                                    segmentDCAToProcess.segmentSellEntries[cptTotalSell+procVars.cptSell]=segEntry;
                                    segmentDCAToProcess.amountSell += segEntry.amount;
                                }

                                // if amount to sell >= amount to buy, search for a buy entry at next loop
                                console.log("Sell : amountSell %s amountBuy %s ",segmentDCAToProcess.amountBuy, segmentDCAToProcess.amountSell);
                            }
                        }

                        console.log("End !Buy  - segmentEntries[1].length == cptSell %s ", procVars.waitingSegmentEntries[1].length == procVars.cptSell);
                        if (
                            (segmentDCAToProcess.amountSell >=
                                segmentDCAToProcess.amountBuy) ||
                            (procVars.waitingSegmentEntries[1].length == procVars.cptSell)
                        ) {
                            procVars.isBuy = true;
                        }
                    }

                    console.log("End while - cptBuy %s cptSell %s ", procVars.cptBuy, procVars.cptSell);
                }
            }
        }

        cptTotalBuy += procVars.cptBuy;
        cptTotalSell += procVars.cptSell;

        console.log("End GetDCAJobs - cptTotalBuy %s cptTotalSell %s ", cptTotalBuy, cptTotalSell);
        return (segmentDCAToProcess, cptTotalBuy, cptTotalSell);
    }

    function getDelayInSecond(IDataStorage.DCADelayEnum _delay) internal pure returns (uint delayInSecond) {
        if (_delay == IDataStorage.DCADelayEnum.Hourly ) {
            return 3600;
        }
        else if (_delay == IDataStorage.DCADelayEnum.Hourly ) {
            return 3600*24;
        }
        else if (_delay == IDataStorage.DCADelayEnum.Hourly ) {
            return 3600*24*7;
        }

    }

    function getNextSegmentEntry(
        IDataStorage.SegmentDCAEntry[] memory segmentEntries,
        IDataStorage.DCADelayEnum _delay,
        uint16 cpt,
        uint timeStamp,
        IERC20 _aToken
    )
        internal
        returns (
            IDataStorage.SegmentDCAEntry memory foundSegEntry,
            uint16 nextCptBuy
        )
    {
        console.log("Start getNextSegmentEntry - cpt : %s ", cpt);
        console.log("Start getNextSegmentEntry - segmentEntries.length : %s ", segmentEntries.length);

        do {
            //DO the stuff
            // si on est bien ds les temps (last DCA + delay > timestamp)
            console.log("In While delay - cpt : %s, timeStamp %s lastSwapTime %s ",cpt,timeStamp,dataStorage.getDCAConfig(segmentEntries[cpt].dcaConfigId).lastSwapTime);
            console.log("In While delay - segment entry amount %s, balance atoken %s",segmentEntries[cpt].amount,_aToken.balanceOf(segmentEntries[cpt].owner));

            if ((timeStamp > ( getDelayInSecond (_delay) + (dataStorage.getDCAConfig(segmentEntries[cpt].dcaConfigId).lastSwapTime)))
                &&(_aToken.balanceOf(segmentEntries[cpt].owner) >= segmentEntries[cpt].amount) ) 
             {
                foundSegEntry = segmentEntries[cpt];
                console.log("Segment found - amount %s , owner %s ", foundSegEntry.amount, foundSegEntry.owner);
            }
            cpt++;
        }
        while ((foundSegEntry.amount != 0) && ((segmentEntries.length) > cpt));

        return (foundSegEntry, cpt);
    }

    /**
     * @notice  Swap a token to another for a specifed tokenPair and amount
     * @dev     .
     * @param   _pairId  token pair id to swap
     * @param   _amountIn  amount to swap (input)
     * @param   _isSwapTokenAtoB  true : swap A=> B, false swap B => A
     * @return  amountOut  .
     */
    function swap(
        uint _pairId,
        uint256 _amountIn,
        bool _isSwapTokenAtoB
    ) internal returns (uint256 amountOut) {
        IDataStorage.TokenPair memory lPair = dataStorage.getTokenPair(_pairId);
        address tokenSource;
        address tokenDest;

        if (_isSwapTokenAtoB) {
            tokenSource = lPair.tokenA;
            tokenDest = lPair.tokenB;
        } else {
            tokenSource = lPair.tokenB;
            tokenDest = lPair.tokenA;
        }

        // Approve the router to spend token to swap
        TransferHelper.safeApprove(
            tokenSource,
            address(lPair.swapRouter),
            _amountIn
        );

        // Note: we should explicitly set slippage limits for production
        uint256 minOut = /* Calculate min output */ 0;
        uint160 priceLimit = /* Calculate price limit */ 0;

        if (isProductionMode && minOut == 0 && priceLimit == 0) {
            revert(
                "In prodution mode, you should explicitly set slippage limits for uniswap swap"
            );
        }

        // Create the params that will be used to execute the swap
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: tokenSource,
                tokenOut: tokenDest,
                fee: UNISWAP_FEE_TIERS,
                recipient: address(this),
                deadline: block.timestamp + 15,
                amountIn: _amountIn,
                amountOutMinimum: minOut,
                sqrtPriceLimitX96: priceLimit
            });

        // The call to `exactInputSingle` executes the swap.
        amountOut = ISwapRouter(lPair.swapRouter).exactInputSingle(params);
        return amountOut;
    }

    /**
     * @notice  Supply token to aave pool for lending
     * @dev     A AToken is given back for each token supplied
     * @param   _aavePoolAddressesProvider  AAVE pool provider
     * @param   _token  token to supply
     * @param   _amount  amount to supply
     */
    function supplyTokenAsLending(
        IPoolAddressesProvider _aavePoolAddressesProvider,
        address _token,
        uint _amount
    ) internal {
        // deposit token to aave lending pool
        IPool aavePool = IPool(
            _aavePoolAddressesProvider.getPool()
        );
        IERC20(_token).safeIncreaseAllowance(address(aavePool), _amount);
        aavePool.supply(_token, _amount, address(this), 0);
    }

    /**
     * @notice  Withdraw token to aave pool for lending
     * @dev     Contract mus have AToken (token given while supplied) to be able to withdraw
     * @param   _poolAddressProvider  AAVE poolAddressProvider
     * @param   _token  token to supply
     * @param   _amount  amount to supply
     */
    function withdrawTokenFromLending(
        IPoolAddressesProvider _poolAddressProvider,
        address _token,
        uint _amount
    ) internal {
        // withdraw token from aave lending pool
        IPool aavePool = IPool(_poolAddressProvider.getPool());

        //get aTokenA address
        address aTokenA = aavePool.getReserveData(_token).aTokenAddress;

        //approve aToken doAPP vers aavePool
        IERC20(aTokenA).approve(address(aavePool), _amount);

        //withdraw token
        aavePool.withdraw(_token, _amount, address(this));
    }

    function computeDCA() private {}

    function OTCTransaction() internal {}

    function computeBalanceIndex() internal returns (uint) {
        // @TODO
    }

    /**
     * @notice  .
     * @dev     .
     * @param   _dcaConfigId  .
     */
    function deleteDCAConfig(uint _dcaConfigId) external {
        //@ TODO
    }
}
