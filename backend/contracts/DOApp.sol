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



    struct TokenUserBalance {
        //256 * 4
        uint balance;
        uint index;
    }

    // used to avoid stack too deep during DCA computation
    struct ProcessingVars {
        uint roundedTokenPrice;
        IDataStorage.SegmentDCAEntry[][2] waitingSegmentEntries;
        IERC20 aTokenA;
        IERC20 aTokenB;
        uint16 cptBuy;
        uint16 cptSell;
        bool isBuy;
    }

    // used during DCA finalisation 
    struct AmountStruct {
        uint amountIn;
        uint amountOut;
        uint amountForOTC;
        uint amountForSwap;
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
    uint8 public MAX_DCA_SEGMENT_PROCESSED_BY_DCA_EXECUTION_CALL = 2;

    // Token address => User address => staked amount
    mapping(address => mapping(address => TokenUserBalance)) private tokenUserBalances;

    // event when user deposit token
    event TokenDeposit(
        address _sender,
        uint indexed _pairId,
        address token,
        uint _amount,
        uint _timestamp
    );

    // event when user withdraw token
    event TokenWithdrawal(
        address _sender,
        uint indexed _pairId,
        address token,
        uint _amount,
        uint _timestamp
    );

    event PairDCAExecutionResult(
        uint indexed _pairId,
        uint _amountIn,
        uint _amountOut,
        uint _amountOTC,
        uint _amountSwap,
        uint _timeStamp,
        bool hasRemainingJobs
    );

    event UserDCAExecutionResult(
        uint indexed _pairId,
        address indexed _user,
        uint _amountOTC,
        uint _amountSwap,
        uint _timeStamp
    );



    // the datastore well be set at constructor
    constructor(
        bool _isProductionMode,
        IDataStorage _dataStorage
    ) payable Ownable() {
        isProductionMode = _isProductionMode;
        dataStorage = _dataStorage;
    }

    /* No real need at the moment

    receive() external payable {}
    fallback() external payable {}
    */

   /**
    * @notice  Set the maximum number of DCA segment processd for each executeDCA() call
    * @dev     .
    * @param   _newVal  .
    */
   function setMaxDCAProcessSegmentPerCall(uint8 _newVal) external onlyOwner() {
        MAX_DCA_SEGMENT_PROCESSED_BY_DCA_EXECUTION_CALL = _newVal;
   }


    /**
     * @notice  Return token balance of user for a specified Token
     * @dev     .
     * @param   _token token to get balance 
     * @param   _user  search user
     */
    function  getTokenUserBalances (
        address _token , 
        address _user
        ) external view  
    returns( TokenUserBalance memory){
        require (_token != address(0),"Token address should not be 0");
        require (_user != address(0),"User address should not be 0");
        return tokenUserBalances[_token][_user];
    }

     /**
     * @notice  Deposit a token A amount in a DOApp token Pair
     * @param   _pairId  the pair ID used to deposit token A
     * @param   _amount  the token amount to deposit
     * @dev     _pairID must be an existing token Pair
     * @dev     amount must be >0
     */
    function depositTokenA(uint _pairId, uint _amount) external {
        IDataStorage.TokenPair memory lPair = dataStorage.getTokenPair(_pairId);
        require(_amount > 0, "Deposit amount should be > 0");

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

        // refresh index balance
        tokenUserBalances[lPair.tokenA][msg.sender].index = computeBalanceIndex();
        tokenUserBalances[lPair.tokenA][msg.sender].balance += _amount;

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
        IDataStorage.TokenPair memory lPair = dataStorage.getTokenPair(_pairId);
        require(_amount > 0, "Withdraw amount should be > 0");
        require(
            _amount <=
                tokenUserBalances[lPair.tokenA][msg.sender].balance,
            "Amount to withdraw should be < your account balance"
        );

        // refresh index balance
        tokenUserBalances[lPair.tokenA][msg.sender].index = computeBalanceIndex();
        tokenUserBalances[lPair.tokenA][msg.sender].balance -= _amount;

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

    /**>
     * @notice  Deposit a token B amount in a DOapp token Pair
     * @param   _pairId  the pair ID used to deposit token B
     * @param   _amount  the token amount to deposit
     * @dev     _pairID must be an existing token Pair
     * @dev     amount must be >0
     */
    function depositTokenB(uint _pairId, uint _amount) external {
        IDataStorage.TokenPair memory lPair = dataStorage.getTokenPair(_pairId);
        require(_amount > 0, "Deposit amount should be > 0");

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

        // refresh index balance
        tokenUserBalances[lPair.tokenB][msg.sender].index = computeBalanceIndex();
        tokenUserBalances[lPair.tokenB][msg.sender].balance += _amount;

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
        IDataStorage.TokenPair memory lPair = dataStorage.getTokenPair(_pairId);
        require(_amount > 0, "Withdraw amount should be > 0");
        require(
            _amount <= tokenUserBalances[lPair.tokenB][msg.sender].balance,
            "Amount to withdraw should be < your account balance"
        );

        // refresh index balance
        tokenUserBalances[lPair.tokenB][msg.sender].index = computeBalanceIndex();
        tokenUserBalances[lPair.tokenB][msg.sender].balance -= _amount;

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


    /**
     * @notice  this function execute DCA operations
     * @dev     .The segmeent array for a specific entry price will be scanned and 
     *          Jobs waiting for DCA will be executed (depending on interval since last execution )
     *          and user balance level )
     * @param   _pairId  .
     * @return  hasRemainingDCAJobs  .
     */
    function executeDCA(uint _pairId) external returns (bool hasRemainingDCAJobs) {
        uint16 cptTotalBuy;
        uint16 cptTotalSell;

        IDataStorage.TokenPair memory lPair = dataStorage.getTokenPair(_pairId);

        IDataStorage.SegmentDCAToProcess memory segmentDCAToProcess;
        segmentDCAToProcess.segmentBuyEntries = new IDataStorage.SegmentDCAEntry[](MAX_DCA_SEGMENT_PROCESSED_BY_DCA_EXECUTION_CALL);
        segmentDCAToProcess.segmentSellEntries = new IDataStorage.SegmentDCAEntry[](MAX_DCA_SEGMENT_PROCESSED_BY_DCA_EXECUTION_CALL);

        console.log("-----------executeDCA Hourly -----------");
        (segmentDCAToProcess, cptTotalBuy, cptTotalSell) = getDCAEntriesToProcess(
            lPair,
            IDataStorage.DCADelayEnum.Hourly,
            segmentDCAToProcess, 
            0, 
            0
        );

        console.log("Post hourly cptTotalBuy : %s", cptTotalBuy);
        console.log("Post hourly cptTotalSell : %s", cptTotalSell);


        if (
            (cptTotalBuy+ cptTotalSell) <
            MAX_DCA_SEGMENT_PROCESSED_BY_DCA_EXECUTION_CALL
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

        console.log("Post daily cptTotalBuy : %s", cptTotalBuy);
        console.log("Post daily cptTotalSell : %s", cptTotalSell);

        if (
            (cptTotalBuy+ cptTotalSell) <
            MAX_DCA_SEGMENT_PROCESSED_BY_DCA_EXECUTION_CALL
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

        console.log("Post weekly cptTotalBuy : %s", cptTotalBuy);
        console.log("Post weekly cptTotalSell : %s", cptTotalSell);

         if (
            (cptTotalBuy+ cptTotalSell) <
            MAX_DCA_SEGMENT_PROCESSED_BY_DCA_EXECUTION_CALL
        ) {
            hasRemainingDCAJobs =false;
        }

        AmountStruct memory amounts = computeDCA(_pairId, segmentDCAToProcess);
  
        emit PairDCAExecutionResult(
                _pairId,
                amounts.amountIn,
                amounts.amountOut,
                amounts.amountForOTC,
                amounts.amountForSwap, 
                block.timestamp,
                hasRemainingDCAJobs
                );

        console.log("hasRemainingDCAJobs %s", hasRemainingDCAJobs);
        return hasRemainingDCAJobs;
    }


    /**
     * @notice  get a rounded price to match with DCA segments
     * @dev     .
     * @param   _pair  .
     */
    function getRoundedOraclePrice(IDataStorage.TokenPair memory _pair) internal view returns(uint){
        // get Token price
        (, int256 oracleTokenAPrice, , , ) = AggregatorV3Interface(
            _pair.chainlinkPriceFetcher
        ).latestRoundData();
        return (uint(oracleTokenAPrice) - (uint(oracleTokenAPrice) % _pair.tokenPairSegmentSize));
    }


    /**
     * @notice  .this function will search for a specific segments if there are entries to process DCA
     * @dev     .
     * @param   _pair  Token pair to search
     * @param   _delay  DCA delay (hourly, daily, weekly)
     * @param   segmentDCAToProcess  (an array of all entries for the specfic price entry on this token pair)
     * @param   cptTotalBuy  a counter representing all previously segment to process on the buy side
     * @param   cptTotalSell  a counter representing all previously segment to process on the sell side.
     * @return  IDataStorage.SegmentDCAToProcess  .
     * @return  outCptTotalBuy  update of the previous counter at function exit
     * @return  outCptTotalSell  update of the previous counter at function exit
     */
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
            
                console.log("getDCAEntriesToProcess - MAX_DCA_JOB_PER_DCA_EXECUTION_CALL %s ", MAX_DCA_SEGMENT_PROCESSED_BY_DCA_EXECUTION_CALL );
                console.log("getDCAEntriesToProcess - cptBuy %s cptSell %s ", procVars.cptBuy, procVars.cptSell);
                console.log("getDCAEntriesToProcess - cptTotalBuy %s cptTotalSell %s ", cptTotalBuy, cptTotalSell);
                while 
                    (
                    ((cptTotalBuy + cptTotalSell  <  MAX_DCA_SEGMENT_PROCESSED_BY_DCA_EXECUTION_CALL) 
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
                            console.log("getDCAEntriesToProcess - procVars.cptBuy %s ",procVars.cptBuy);
                            console.log("getDCAEntriesToProcess - cptTotalBuy %s ",cptTotalBuy);
                            if (segEntry.amount != 0) {
                                segmentDCAToProcess.segmentBuyEntries[cptTotalBuy] = segEntry;
                                segmentDCAToProcess.amountBuy += segEntry.amount;
                                cptTotalBuy ++;
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
                                segmentDCAToProcess.segmentSellEntries[cptTotalSell]=segEntry;
                                segmentDCAToProcess.amountSell += segEntry.amount;
                                cptTotalSell++;
                            }

                            // if amount to sell >= amount to buy, search for a buy entry at next loop
                            console.log("getDCAEntriesToProcess - Sell : amountBuy %s amountSell %s ",segmentDCAToProcess.amountBuy, segmentDCAToProcess.amountSell);
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
        console.log("End GetDCAJobs - cptTotalBuy %s cptTotalSell %s ", cptTotalBuy, cptTotalSell);
        return (segmentDCAToProcess, cptTotalBuy, cptTotalSell);
    }

    /**
     * @notice  returned the dca delay in seconds
     * @dev     .
     * @param   _delay  .
     * @return  delayInSecond  .
     */
    function getDelayInSecond(IDataStorage.DCADelayEnum _delay) internal pure returns (uint delayInSecond) {
        if (_delay == IDataStorage.DCADelayEnum.Hourly ) {
            delayInSecond = 3600;
        }
        else if (_delay == IDataStorage.DCADelayEnum.Daily ) {
            delayInSecond = 3600*24;
        }
        else if (_delay == IDataStorage.DCADelayEnum.Weekly ) {
            delayInSecond = 3600*24*7;
        }
        return delayInSecond;

    }

    
    /**
     * @notice  Check the next elligible segment entry for DCA  in courant segment array
     * @dev     .
     * @param   _pairId  current token pair
     * @param   segmentEntries  array of segments waiting DCA (but some of them could have 
     *          allready been fullfilled and others one does'nt have sufficient balance)
     * @param   _delay  DCA delay
     * @param   cpt  counter to bypass allready processed entries
     * @param   timeStamp  timestamp used to check elligibility to DCA
     * @param   isBuy  buy er Sell side
     * @return  foundSegEntry  segment entry found (or none)
     * @return  nextCpt  update of cpt counter at function exit
     */
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
            IDataStorage.TokenPair memory pair = dataStorage.getTokenPair(_pairId);

            //DO the stuff
            // si on est bien ds les temps (last DCA + delay > timestamp)
            console.log("getNextSegmentEntry - 2 In While cpt : %s, timeStamp %s lastDCATime %s ",cpt,timeStamp,
            dataStorage.getDCAConfig(segmentEntries[cpt].dcaConfigId).lastDCATime);
            console.log("getNextSegmentEntry - 2 In While segment entry amount %s",segmentEntries[cpt].amount);
            uint balance;
            if (isBuy) {
                balance = tokenUserBalances[pair.tokenA][segmentEntries[cpt].owner].balance;
            }
            else {
                balance = tokenUserBalances[pair.tokenB][segmentEntries[cpt].owner].balance;    
            }
            console.log("getNextSegmentEntry - 3 Owner balance : %s", balance);
            console.log("getNextSegmentEntry - 3 _delay : %s", uint(_delay));
            console.log("getNextSegmentEntry - 3 getDelayInSecond(_delay) : %s", getDelayInSecond(_delay));
            console.log("getNextSegmentEntry - 3 calcul %s", timeStamp, getDelayInSecond(_delay) + (dataStorage.getDCAConfig(segmentEntries[cpt].dcaConfigId).lastDCATime));

            if ((timeStamp > ( getDelayInSecond (_delay) + (dataStorage.getDCAConfig(segmentEntries[cpt].dcaConfigId).lastDCATime)))
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

        console.log("swap - address msg.sender : ", msg.sender);
        console.log("swap - address this : ", address(this));
        console.log("swap - address lPair.swapRouter : ", lPair.swapRouter);
        console.log("swap - atoken balance msg.sender : ", IERC20(tokenSource).balanceOf(msg.sender));
        console.log("swap - atoken balance this(address) : ", IERC20(tokenSource).balanceOf(address(this)));
        console.log("swap - atoken balance lPair.swapRouter : ", IERC20(tokenSource).balanceOf(lPair.swapRouter));
        console.log("swap - atoken allowance msg.sender -> swaprouter : ", IERC20(tokenSource).allowance(msg.sender,address(lPair.swapRouter)));
        console.log("swap - atoken allowance this(address) -> swaprouter: ", IERC20(tokenSource).allowance(address(this),address(lPair.swapRouter)));


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


    /**
     * @notice  For given DCA segment to process, compute amount for OTC and swap, withdraw from aave, swap with uniswap and supply back to aave
     * @dev     .
     * @param   _pairId  current TokenPair
     * @param   _segmentToProcess  Segments Array to process
     */
    function computeDCA(
        uint _pairId, 
        IDataStorage.SegmentDCAToProcess memory _segmentToProcess
    ) private returns (
        AmountStruct memory){

        AmountStruct memory amounts;

        uint swapAmountReturned;
        address tokenToSwap;
        address tokenOut;

        // sum amount in and amount out
        for( uint16 i=0; i <_segmentToProcess.segmentBuyEntries.length; i++ ) {
            amounts.amountIn = amounts.amountIn + _segmentToProcess.segmentBuyEntries[i].amount;
            amounts.amountOut = amounts.amountOut + _segmentToProcess.segmentSellEntries[i].amount;
        }

        console.log("computeDCA - amoutIn : %s, amountOut : %s", amounts.amountIn, amounts.amountOut);
        amounts.amountForOTC = amounts.amountIn < amounts.amountOut ? amounts.amountIn : amounts.amountOut;
        amounts.amountForSwap = amounts.amountIn < amounts.amountOut ? 
            (amounts.amountOut - amounts.amountForOTC) : (amounts.amountIn - amounts.amountForOTC) ; 
        console.log("computeDCA - amountForOTC : %s, amountForSwap : %s", amounts.amountForOTC, amounts.amountForSwap);


        /*
        compute and transfer fees for DCA Executor
        @TODO if we have time
        uint amountInExecutorFees;
        uint amountOutExecutorFees;
        amountInExecutorFees =  amountIn - (amountIn * DCA_EXECUTOR_FEES)/1000000;
        amountOutExecutorFees = amountOut - (amountOut*DCA_EXECUTOR_FEES)/1000000;
        payDOAppExecutor(_pairId, amountInExecutorFees, amountOutExecutorFees);
        */


        if(amounts.amountForSwap > 0) {
            IDataStorage.TokenPair memory tokenPair = dataStorage.getTokenPair(_pairId);
             if(amounts.amountIn > amounts.amountOut) {
                tokenToSwap = tokenPair.tokenA;
                tokenOut = tokenPair.tokenB;
             } else {
                tokenToSwap = tokenPair.tokenB;
                tokenOut = tokenPair.tokenA;
             } 
            

            address atokenToSwap;
            atokenToSwap = amounts.amountIn > amounts.amountOut ? tokenPair.aTokenA : tokenPair.aTokenB;
            console.log("computeDCA - atoken balance msg.sender : ", IERC20(atokenToSwap).balanceOf(msg.sender));
            console.log("computeDCA - atoken balance this(address) : ", IERC20(atokenToSwap).balanceOf(address(this)));

            // withdraw token from AAVE to contract
            withdrawTokenFromLending(IPoolAddressesProvider(tokenPair.aavePoolAddressesProvider),tokenToSwap,amounts.amountForSwap);

            //swap with uniswap
            swapAmountReturned = swap(_pairId,amounts.amountForSwap,amounts.amountIn > amounts.amountOut ? true : false);

            //suppply back to aave
            supplyTokenAsLending(IPoolAddressesProvider(tokenPair.aavePoolAddressesProvider),tokenOut, swapAmountReturned );

        }

        // Update user Balance afetr OTC and SWAP transaction
        processOTCAndSwapTransactionToUserBalance(_pairId,amounts.amountIn, amounts.amountOut, amounts.amountForOTC, swapAmountReturned,_segmentToProcess);

        //update DCA config to fix lastDCATimestamp
        updateDCAConfigProcessed(_segmentToProcess);

    
        return(amounts);

    }

     /**
     * @notice  update DCA config to set lastDCATimestamp to block.timeStamp according to segments processed
     * @dev     .
     * @param   _segmentToProcess  .
     */
    function updateDCAConfigProcessed(IDataStorage.SegmentDCAToProcess memory _segmentToProcess) internal{
            console.log("updateDCAConfigProcessed - ");
            // set lastDCATime on each Segment
            for( uint16 i=0; i <_segmentToProcess.segmentBuyEntries.length; i++ ) {
               //update DCA config
                dataStorage.updateDCAConfigLastDCATime(_segmentToProcess.segmentBuyEntries[i].dcaConfigId,block.timestamp);
            }
    }


    /**
     * @notice  Manage user balance for OTC and Swap transactions 
     * @dev     .
     * @param   pairId  current token Pair
     * @param   amountIn  total amout In
     * @param   amountOut  total amout In
     * @param   amountForOTC  total amout for OTC 
     * @param   amountForSwap  total amout for Swap
     * @param   _segmentToProcess  DCA segments associated to theses mvts
     */
    function processOTCAndSwapTransactionToUserBalance(
        uint pairId, 
        uint amountIn, 
        uint amountOut, 
        uint amountForOTC, 
        uint amountForSwap,
        IDataStorage.SegmentDCAToProcess memory _segmentToProcess) 
    internal {
        console.log("OTCOrSwapTransactionToUserBalance - amountIn %s, amountOut %s  ",amountIn, amountOut);
        console.log("OTCOrSwapTransactionToUserBalance - amountForOTC %s, amountForSwap %s  ",amountForOTC, amountForSwap);

        

        IDataStorage.TokenPair memory pair = dataStorage.getTokenPair(pairId);

        for (uint16 i =0; i< _segmentToProcess.segmentBuyEntries.length; i++) {
            if(_segmentToProcess.segmentBuyEntries[i].amount != 0 ) {

                address segOwner = _segmentToProcess.segmentBuyEntries[i].owner;
                uint amountToDCA = _segmentToProcess.segmentBuyEntries[i].amount;

                console.log("OTCOrSwapTransactionToUserBalance - A-> B Token balance before - Token A %s", tokenUserBalances[pair.tokenA][segOwner].balance);
                console.log("OTCOrSwapTransactionToUserBalance - A-> B Token balance before - Token B %s", tokenUserBalances[pair.tokenB][segOwner].balance);

                uint balanceMvtOTC = (amountToDCA * amountForOTC) / amountIn;
                uint balanceMvtSwap = (amountToDCA * amountForSwap) / amountIn;
                tokenUserBalances[pair.tokenA][segOwner].balance -= (balanceMvtOTC+balanceMvtSwap);
                tokenUserBalances[pair.tokenB][segOwner].balance += (balanceMvtOTC+balanceMvtSwap);

                console.log("OTCOrSwapTransactionToUserBalance - A-> B Token balance after - Token A %s", tokenUserBalances[pair.tokenA][segOwner].balance);
                console.log("OTCOrSwapTransactionToUserBalance - A-> B Token balance after - Token B %s", tokenUserBalances[pair.tokenB][segOwner].balance);

                emit UserDCAExecutionResult(pairId, segOwner, balanceMvtOTC, balanceMvtSwap, block.timestamp);

            }
            if(_segmentToProcess.segmentSellEntries[i].amount != 0 ) {
                address segOwner = _segmentToProcess.segmentSellEntries[i].owner;
                uint amountToDCA = _segmentToProcess.segmentSellEntries[i].amount;

                console.log("OTCOrSwapTransactionToUserBalance - B-> A - Token balance before - Token A %s", tokenUserBalances[pair.tokenA][segOwner].balance);
                console.log("OTCOrSwapTransactionToUserBalance - B-> A Token balance before - Token B %s", tokenUserBalances[pair.tokenB][segOwner].balance);

                uint balanceMvtOTC = (amountToDCA * amountForOTC) / amountOut;
                uint balanceMvtSwap = (amountToDCA * amountForSwap) / amountOut;
                tokenUserBalances[pair.tokenB][segOwner].balance -= (balanceMvtOTC+balanceMvtSwap);
                tokenUserBalances[pair.tokenA][segOwner].balance += (balanceMvtOTC+balanceMvtSwap);

                console.log("OTCOrSwapTransactionToUserBalance - B-> A Token balance after - Token A %s", tokenUserBalances[pair.tokenA][segOwner].balance);
                console.log("OTCOrSwapTransactionToUserBalance - B-> A Token balance after - Token B %s", tokenUserBalances[pair.tokenB][segOwner].balance);

                emit UserDCAExecutionResult(pairId, segOwner, balanceMvtOTC, balanceMvtSwap, block.timestamp);
            }
        }

    }

    // MAY BE next time : this function should get total balance from AAVE and calculate 
    // an index corresponding to ratio of  
    //              total balance (ie total deposit + accrued interest)
    //      ratio = ---------------------------------------------------
    //                          deposit
    // this should be the base for a partial redistrubution of intereste to clients
    // we should keep 
    //      1 - a ratio for the main contract 
    //      2 - a ratio for each user account token balance
    // each time a user made a move on his account (deposit, withdraw or a dca) 
    // we update his balance by comparing the global ratio  and his personal ratio
    // @TODO later
    /**
     * @notice  an un-implemented feature  :(
     * @dev     .
     * @return  uint  .
     */
    function computeBalanceIndex() internal returns (uint) {
        // @TODO
    }

}
