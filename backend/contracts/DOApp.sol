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

contract DOApp is Ownable {
    using SafeERC20 for IERC20;

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

    event EvmPrint(string);

    constructor(
        bool _isProductionMode,
        IDataStorage _dataStorage
    ) payable Ownable() {
        isProductionMode = _isProductionMode;
        dataStorage = _dataStorage;
    }

    receive() external payable {}

    fallback() external payable {}

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
        IERC20(lPair.tokenAddressA).safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );

        //supply token to AAVE
        supplyTokenAsLending(
            IPoolAddressesProvider(lPair.aavePoolAddressesProvider),
            lPair.tokenAddressA,
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
            lPair.tokenAddressA,
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
            lPair.tokenAddressA,
            _amount
        );

        //withdraw token to user
        IERC20(lPair.tokenAddressA).safeTransfer(msg.sender, _amount);

        emit TokenWithdrawal(
            msg.sender,
            _pairId,
            lPair.tokenAddressA,
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
        IERC20(lPair.tokenAddressB).safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );

        //supply token to AAVE
        supplyTokenAsLending(
            IPoolAddressesProvider(lPair.aavePoolAddressesProvider),
            lPair.tokenAddressB,
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
            lPair.tokenAddressB,
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
            lPair.tokenAddressB,
            _amount
        );

        //withdraw token to user
        IERC20(lPair.tokenAddressB).safeTransfer(msg.sender, _amount);

        emit TokenWithdrawal(
            msg.sender,
            _pairId,
            lPair.tokenAddressB,
            _amount,
            block.timestamp
        );
    }

    function executeDCA(uint _pairId) external returns (bool hasRemainingJobs) {
        uint amount;
        address account;
        IDataStorage.TokenPair memory lPair = dataStorage.getTokenPair(_pairId);

        IDataStorage.SegmentDCAToProcess storage segmentDCAToProcess;

        (segmentDCAToProcess) = getDCAJobs(
            lPair,
            IDataStorage.DCADelayEnum.Hourly,
            segmentDCAToProcess
        );

        if (
            (segmentDCAToProcess.segmentBuyEntries.length +
                segmentDCAToProcess.segmentSellEntries.length) <
            MAX_DCA_JOB_PER_DCA_EXECUTION_CALL
        ) {
            (segmentDCAToProcess) = getDCAJobs(
                lPair,
                IDataStorage.DCADelayEnum.Daily,
                segmentDCAToProcess
            );
        }

        if (
            (segmentDCAToProcess.segmentBuyEntries.length +
                segmentDCAToProcess.segmentSellEntries.length) <
            MAX_DCA_JOB_PER_DCA_EXECUTION_CALL
        ) {
            (segmentDCAToProcess) = getDCAJobs(
                lPair,
                IDataStorage.DCADelayEnum.Weekly,
                segmentDCAToProcess
            );
        }

        computeDCA();
        OTCTransaction();

        hasRemainingJobs = false;
        return hasRemainingJobs;

        //emit DCAExecution(account,pairId, tokenInput, tokenInputPrice, tokenOutput, amount, block.timestamp);
    }

    function getDCAJobs(
        IDataStorage.TokenPair memory _pair,
        IDataStorage.DCADelayEnum _delay,
        IDataStorage.SegmentDCAToProcess storage segmentDCAToProcess
    ) internal returns (IDataStorage.SegmentDCAToProcess storage) {
        // Obtenir le prix du tokenA
        (, int256 oracleTokenAPrice, , , ) = AggregatorV3Interface(
            _pair.chainlinkPriceFetcher
        ).latestRoundData();
        uint roundedTokenPrice = uint(oracleTokenAPrice) -
            (uint(oracleTokenAPrice) % _pair.tokenPairSegmentSize);

        //mapping (uint pairID => mapping (uint segmentStart => mapping(DCADelayEnum => SegmentDCAEntry[][2]))) public dcaSegmentsMap;
        // Obtenir les segments d'entrées correspondants à ce prix
        IDataStorage.SegmentDCAEntry[][2] memory segmentEntries = dataStorage
            .getDCASegment(_pair.pairID, roundedTokenPrice, _delay);

        uint cptBuy;
        uint cptSell;
        bool isBuy = true;
        uint timeStamp = block.timestamp;

        if ((segmentEntries[0].length != 0) || segmentEntries[1].length != 0) {
            while (
                ((segmentDCAToProcess.segmentBuyEntries.length +
                    segmentDCAToProcess.segmentSellEntries.length) <
                    MAX_DCA_JOB_PER_DCA_EXECUTION_CALL) &&
                ((segmentEntries[0].length != cptBuy) ||
                    (segmentEntries[1].length != cptSell))
            ) {
                if (isBuy) {
                    // search for a buy entry
                    (
                        IDataStorage.SegmentDCAEntry memory segEntry,
                        uint nextCptBuy
                    ) = getNextSegmentEntry(
                            segmentEntries[0],
                            _delay,
                            cptBuy,
                            isBuy,
                            timeStamp
                        );

                    cptBuy = nextCptBuy;

                    // if a segment is found
                    if (segEntry.amount != 0) {
                        segmentDCAToProcess.segmentBuyEntries.push(segEntry);
                        segmentDCAToProcess.amountBuy += segEntry.amount;
                    }
                    // if amount to buy > amount to sell, search for a sell entry at next loop
                    if (
                        (segmentDCAToProcess.amountBuy >
                            segmentDCAToProcess.amountSell) ||
                        (segmentEntries[0].length == cptBuy)
                    ) {
                        isBuy = false;
                    }
                } else {
                    // Search for a sell entry
                    (
                        IDataStorage.SegmentDCAEntry memory segEntry,
                        uint nextCptSell
                    ) = getNextSegmentEntry(
                            segmentEntries[0],
                            _delay,
                            cptBuy,
                            isBuy,
                            timeStamp
                        );

                    cptSell = nextCptSell;

                    // if a segment is found
                    if (segEntry.amount != 0) {
                        segmentDCAToProcess.segmentSellEntries.push(segEntry);
                        segmentDCAToProcess.amountSell += segEntry.amount;
                    }

                    // if amount to sell >= amount to buy, search for a buy entry at next loop
                    if (
                        (segmentDCAToProcess.amountSell >=
                            segmentDCAToProcess.amountBuy) ||
                        (segmentEntries[1].length == cptSell)
                    ) {
                        isBuy = true;
                    }
                }
            }
        }
        return (segmentDCAToProcess);
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
        uint cpt,
        bool isBuy,
        uint timeStamp
    )
        internal
        returns (
            IDataStorage.SegmentDCAEntry memory foundSegEntry,
            uint nextCptBuy
        )
    {
        emit EvmPrint("getNextSegmentEntry");

        while ((foundSegEntry.amount != 0) || ((segmentEntries.length) > cpt)) {
            //DO the stuff
            // si on est bien ds les temps (last DCA + delay > timestamp)
            if (getDelayInSecond (_delay) > (block.timestamp - segmentEntries[cpt].lastSwapTime)) {
                foundSegEntry = segmentEntries[cpt];
            }
            cpt++;
        }
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
            tokenSource = lPair.tokenAddressA;
            tokenDest = lPair.tokenAddressB;
        } else {
            tokenSource = lPair.tokenAddressB;
            tokenDest = lPair.tokenAddressA;
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
     * @param   _poolAddressProvider  AAVE poolAddressProvider
     * @param   _token  token to supply
     * @param   _amount  amount to supply
     */
    function supplyTokenAsLending(
        IPoolAddressesProvider _poolAddressProvider,
        address _token,
        uint _amount
    ) internal {
        // deposit token to aave lending pool
        IPool aavePool = IPool(
            IPoolAddressesProvider(_poolAddressProvider).getPool()
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
