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

    // Fees as 10e-6 => 3000 = 0.1% (ie 0.003)
    uint24 constant UNISWAP_FEE_TIERS = 3000;

    // Fees as 10e-6 => 1000 = 0.1% (ie 0.001)
    uint16 constant DCA_EXECUTOR_FEES = 1000;

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

    event PairDCAExecutionResult(
        uint indexed _pairId,
        uint _amountIn,
        uint _amountOut,
        uint _timeStamp,
        bool hasRemainingJobs
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
        bool hasRemainingDCAJobs;

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

        console.log("cptTotalBuy : %s", cptTotalBuy);
        console.log("cptTotalSell : %s", cptTotalSell);


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
        } else {
            hasRemainingDCAJobs = true;
        }

        console.log("cptTotalBuy : %s", cptTotalBuy);
        console.log("cptTotalSell : %s", cptTotalSell);

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
        } else {
            hasRemainingDCAJobs = true;
        }

        console.log("cptTotalBuy : %s", cptTotalBuy);
        console.log("cptTotalSell : %s", cptTotalSell);

        // process segment
        computeDCA(_pairId, segmentDCAToProcess);

        console.log("hasRemainingDCAJobs %s", hasRemainingDCAJobs);
        emit PairDCAExecutionResult(
        _pairId,
        0,  //@TODO
        0, //@TODO
        block.timestamp,
        hasRemainingDCAJobs
        );

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
            console.log("getDCAEntriesToProcess - Init segment entries BUY %s SELL %s", procVars.waitingSegmentEntries[0].length, procVars.waitingSegmentEntries[1].length);
            if ((procVars.waitingSegmentEntries[0].length != 0) || procVars.waitingSegmentEntries[1].length != 0) {
            
                console.log("getDCAEntriesToProcess - MAX_DCA_JOB_PER_DCA_EXECUTION_CALL %s ", MAX_DCA_JOB_PER_DCA_EXECUTION_CALL );
                console.log("getDCAEntriesToProcess - cptBuy %s cptSell %s ", procVars.cptBuy, procVars.cptSell);
                console.log("getDCAEntriesToProcess - cptTotalBuy %s cptTotalSell %s ", cptTotalBuy, cptTotalSell);
                while 
                    (
                    ((cptTotalBuy + cptTotalSell + procVars.cptBuy + procVars.cptSell <  MAX_DCA_JOB_PER_DCA_EXECUTION_CALL) 
                    && ((procVars.waitingSegmentEntries[0].length != procVars.cptBuy) 
                        ||  
                        (procVars.waitingSegmentEntries[1].length != procVars.cptSell))) 

                    ){

                    console.log("getDCAEntriesToProcess - In while - cptBuy %s cptSell %s ", procVars.cptBuy, procVars.cptSell);
                    console.log("getDCAEntriesToProcess - In while - cptTotalBuy %s cptTotalSell %s ", cptTotalBuy, cptTotalSell);
                    if (procVars.isBuy) {
                        console.log("getDCAEntriesToProcess - Start isBuy");
                        if (procVars.waitingSegmentEntries[0].length > 0) {
                            // search for a buy entry
                            (
                                IDataStorage.SegmentDCAEntry memory segEntry,
                                uint16 nextCptBuy
                            ) = getNextSegmentEntry(
                                    _pair.pairID,
                                    procVars.waitingSegmentEntries[0],
                                    _delay,
                                    procVars.cptBuy,
                                    block.timestamp,
                                    true
                                );

                            procVars.cptBuy = nextCptBuy;

                            // if a segment is found
                            console.log("getDCAEntriesToProcess - segEntry.amount %s ",segEntry.amount);
                            console.log("getDCAEntriesToProcess - segEntry.owner %s ",segEntry.owner);
                            console.log("getDCAEntriesToProcess - segEntry.dcaConfigId %s ",segEntry.dcaConfigId);
                            if (segEntry.amount != 0) {
                                segmentDCAToProcess.segmentBuyEntries[cptTotalBuy+procVars.cptBuy -1] = segEntry;
                                segmentDCAToProcess.amountBuy += segEntry.amount;
                            }
                            // if amount to buy > amount to sell, search for a sell entry at next loop
                            console.log("getDCAEntriesToProcess - Buy : amountBuy %s amountSell %s ",segmentDCAToProcess.amountBuy, segmentDCAToProcess.amountSell);
                        }
                        console.log("getDCAEntriesToProcess - End Buy  - segmentEntries[0].length == cptBuy %s ", procVars.waitingSegmentEntries[0].length == procVars.cptBuy);
                        if (
                            (segmentDCAToProcess.amountBuy >
                                segmentDCAToProcess.amountSell) ||
                            (procVars.waitingSegmentEntries[0].length == procVars.cptBuy)
                        ) {
                            procVars.isBuy = false;
                        }
                    } else {
                        console.log("getDCAEntriesToProcess - Start !isBuy");
                        if (procVars.waitingSegmentEntries[1].length > 0) {
                            // Search for a sell entry
                            (
                                IDataStorage.SegmentDCAEntry memory segEntry,
                                uint16 nextCptSell
                            ) = getNextSegmentEntry(
                                    _pair.pairID,
                                    procVars.waitingSegmentEntries[1],
                                    _delay,
                                    procVars.cptSell,
                                    block.timestamp,
                                    false
                                );

                            procVars.cptSell = nextCptSell;

                            // if a segment is found
                            if (segEntry.amount != 0) {
                                segmentDCAToProcess.segmentSellEntries[cptTotalSell+procVars.cptSell -1]=segEntry;
                                segmentDCAToProcess.amountSell += segEntry.amount;
                            }

                            // if amount to sell >= amount to buy, search for a buy entry at next loop
                            console.log("getDCAEntriesToProcess - Sell : amountSell %s amountBuy %s ",segmentDCAToProcess.amountBuy, segmentDCAToProcess.amountSell);
                        }

                        console.log("getDCAEntriesToProcess - End !Buy  - segmentEntries[1].length == cptSell %s ", procVars.waitingSegmentEntries[1].length == procVars.cptSell);
                        if (
                            (segmentDCAToProcess.amountSell >=
                                segmentDCAToProcess.amountBuy) ||
                            (procVars.waitingSegmentEntries[1].length == procVars.cptSell)
                        ) {
                            procVars.isBuy = true;
                        }
                    }

                    console.log("getDCAEntriesToProcess - End while - cptBuy %s cptSell %s ", procVars.cptBuy, procVars.cptSell);
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
        uint _pairId,
        IDataStorage.SegmentDCAEntry[] memory segmentEntries,
        IDataStorage.DCADelayEnum _delay,
        uint16 cpt,
        uint timeStamp,
        bool isBuy
    )
        internal
        returns (
            IDataStorage.SegmentDCAEntry memory foundSegEntry,
            uint16 nextCpt
        )
    {
        console.log("getNextSegmentEntry - 1 - cpt : %s, _delay : %s", cpt, uint(_delay));
        console.log("getNextSegmentEntry - 1 - segmentEntries.length : %s ", segmentEntries.length);

        do {
            //DO the stuff
            // si on est bien ds les temps (last DCA + delay > timestamp)
            console.log("getNextSegmentEntry - 2 In While cpt : %s, timeStamp %s lastSwapTime %s ",cpt,timeStamp,dataStorage.getDCAConfig(segmentEntries[cpt].dcaConfigId).lastSwapTime);
            console.log("getNextSegmentEntry - 2 In While segment entry amount %s",segmentEntries[cpt].amount);
            uint balance;
            if (isBuy) {
                balance = dataStorage.getTokenPairUserBalances(_pairId,segmentEntries[cpt].owner).balanceA;
            }
            else {
                balance = dataStorage.getTokenPairUserBalances(_pairId,segmentEntries[cpt].owner).balanceB;    
            }
            console.log("getNextSegmentEntry - 3 Owner balance : %s", balance);

            if ((timeStamp > ( getDelayInSecond (_delay) + (dataStorage.getDCAConfig(segmentEntries[cpt].dcaConfigId).lastSwapTime)))
                &&(balance >= segmentEntries[cpt].amount) ) 
             {
                foundSegEntry = segmentEntries[cpt];
                console.log("getNextSegmentEntry - 4 Segment found - amount %s , owner %s ", foundSegEntry.amount, foundSegEntry.owner);
            }
            cpt++;
        }
        while ((foundSegEntry.amount == 0) && ((segmentEntries.length) > cpt));

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


    function computeDCA(uint _pairId, IDataStorage.SegmentDCAToProcess memory _segmentToProcess) private {

        uint amountIn;
        uint amountOut;
        uint amountInExecutorFees;
        uint amountOutExecutorFees;
        uint swapAmountReturned;

        // sum amount in and amount out
        for( uint16 i=0; i <_segmentToProcess.segmentBuyEntries.length; i++ ) {
            amountIn = amountIn + _segmentToProcess.segmentBuyEntries[i].amount;
            amountOut = amountOut + _segmentToProcess.segmentSellEntries[i].amount;
        }

        console.log("computeDCA - amoutIn : %s, amountOut : %s", amountIn, amountOut);
        uint amountForOTC = amountIn < amountOut ? amountIn : amountOut;
        uint amountForSwap = amountIn < amountOut ? (amountIn - amountForOTC) : (amountOut-amountForOTC);
        console.log("computeDCA - amountForOTC : %s, amountForSwap : %s", amountForOTC, amountForSwap);


        if (amountForOTC > 0 ) {
            OTCTransaction(amountForOTC);
        }
        if(amountForSwap > 0) {
            swapAmountReturned = swap(_pairId,amountForSwap,amountIn > amountOut ? true : false);
        }

        //compute and transfer fees for DCA Executor
        // @TODO eventuel
        // payDOAppExecutor(_pairId, amountIn, amountOut);

        amountInExecutorFees =  amountIn - (amountIn * DCA_EXECUTOR_FEES)/1000000;
        amountOutExecutorFees = amountOut - (amountOut*DCA_EXECUTOR_FEES)/1000000;

        //compute and transfer fees for DCA Executor
        payDCAExecutor(
            _pairId,
            amountInExecutorFees,
            amountOutExecutorFees
            );

        // Update user Balance afetr OTC and SWAP transaction
        updateUserBalance(
            _segmentToProcess,
            amountIn - amountInExecutorFees,
            amountOut - amountOutExecutorFees,
            swapAmountReturned
        );

        //update DCA segment to fix lastSwapTimestamp
        updateSegmentToProcess(_segmentToProcess);


    }

    function payDCAExecutor(
        uint _pairId,
        uint amountInExecutorFees,
        uint amountOutExecutorFees
        ) internal {
            console.log("payDCAExecutor - amountInExecutorFees % , amountOutExecutorFees %s ",amountInExecutorFees,amountOutExecutorFees);
        }

    // Update user Balance afetr OTC and SWAP transaction
    function updateUserBalance(
        IDataStorage.SegmentDCAToProcess memory _segmentToProcess,
        uint amounIn,
        uint amountOut,
        uint swapAmountReturned
    ) internal{
            console.log("updateUserBalance - amounIn % , amountOut %s ",amounIn,amountOut);
        }

    //update DCA segment to fix lastSwapTimestamp
    function updateSegmentToProcess(IDataStorage.SegmentDCAToProcess memory _segmentToProcess) internal{
            console.log("updateSegmentToProcess - ");

    }


    /**
     * @notice  .
     * @dev     .
     */
    function OTCTransaction(uint amountForOTC) internal {
        console.log("OTCTransaction - amountForOTC %  ",amountForOTC);
        // @ TODO

    }

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
