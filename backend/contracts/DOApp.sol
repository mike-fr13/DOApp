// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IPoolAddressesProvider} from '@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';


contract DOApp is Ownable {
    using SafeERC20 for IERC20;

    uint16 constant DCA_CONFIG_MAX_SEGMENT = 1000;
    uint16 constant MULT_FACTOR = 1000;
    uint8 constant BALANCE_INDEX_DECIMAL_NUMBER = 20;
    uint24 public constant UNISWAP_FEE_TIERS = 3000;
    bool isProductionMode = false;

    /**
     *  @Dev This structure contains configuration for a specific pair of token 
     */
    struct TokenPair {
        // 160 +96 = 256
        address tokenAddressA;
        uint96 indexBalanceTokenA;

        //160 + 96 = 256
        address tokenAddressB;
        uint96 indexBalanceTokenB;

        //160
        address chainlinkPriceFetcher;

        //160 + 8 + 16 + 8 =192
        address aavePoolAddressesProvider;
        bool enabled;
        uint16 tokenPairSegmentSize;
        uint8 tokenPairDecimalNumber;

        //160
        address swapRouter;
    }

    struct DCAConfig {
        // 256
        uint pairID;

        //8+24+24+16+8+32 = 112
        bool isSwapTookenAForTokenB;
        uint24 min;
        uint24 max;
        uint16 amount;
        uint8 scalingFactor;
        uint32 creationDate;
    }

    struct SegmentDCAEntry {
        //160 + 16 + 32 = 208
        address owner;
        uint16 amount;
        uint32 lastSwapTime;
    }

    struct TokenPairUserBalance {
        uint balanceA;
        uint indexA;
        uint balanceB;
        uint indexB;
    }

    // pairID => User address => staked amount
    mapping(uint => mapping(address => TokenPairUserBalance)) tokenPairUserBalances;

    // tokenPairs contains all available token pairs for DCA
    mapping(uint256 => TokenPair) public tokenPairs;

    //tokenPair Segments DCA configuration 
    mapping (uint pairID => mapping (uint segmentStart => SegmentDCAEntry[][2])) public dcaSegmentsMap;

    //deposit lock penalty  time
    uint constant public lockTime = 10 days;

    //maximum penalty for an early withdraw in % ()
    uint constant public maxEarlyWithdrawPenality = 10 ;

    modifier tokenPairExists(uint _pairID) {
        require(tokenPairs[_pairID].tokenAddressA != address(0) ,"Token Pair not Found");
        _;
    }

    event TokenPAirAdded(
        uint _pairId, 
        address _tokenAddressA,
        address _tokenAddressB,
        uint16 _tokenPairSegmentSize, 
        uint8 _tokenPairDecimalNumber,
        address _chainLinkPriceFetcher, 
        address _aavePoolAddressesProvider,
        address _uniswapV3SwapRouter
        );

    event TokenDeposit(
        address _sender, 
        uint _pairId, 
        address token, 
        uint _amount, 
        uint _timestamp
        );
    
    event TokenWithdrawal(
        address _sender, 
        uint _pairId, 
        address token, 
        uint _amount, 
        uint _timestamp
        );

    event DCAConfigCreation(
        address _sender, 
        uint _pairId, 
        uint _configId
        );

    event DCAExecution(
        address _account, 
        uint _pairId, 
        address _tokenInput, 
        uint _tokenInputPrice, 
        IERC20 _tokenOutput, 
        uint _amount, 
        uint _timeStamp
        );

    error DCAConfigError(string _errorMessage);
    
    constructor(bool _isProductionMode) Ownable() payable {
        isProductionMode = _isProductionMode;
    }

    receive() external payable {
    }

    /**
     * @notice  Add a token pair to DOapp application, to enable DCA on this pair
     * @param   _tokenAddressA  First token of Pair
     * @param   _tokenAddressB  Second token of this Pair
     * @param   _chainLinkPriceFetcher  Address for ChainLink price fetcher
     * @return  uint256  the pair ID : a keccak256 hash
     * @dev     Only the contract owner can add a pair.
     * @dev     _tokenAddressA, _tokenAddressB and _chainLinkPriceFetcher should not be null.
     * @dev     We check if the pair is not already existing with inverse order and revert if it is
     */
    function addTokenPair(
        address _tokenAddressA, 
        uint16 _tokenPairSegmentSize,
        uint8 _tokenPairDecimalNumber,  
        address _tokenAddressB, 
        address _chainLinkPriceFetcher,
        address _aavePoolAddressesProvider,
        address _uniswapV3SwapRouter) external onlyOwner() returns (uint256){

        // @TODO utiliser des constantes d'erreurs
        require (_tokenAddressA != address(0),"tokenA address must be defined");
        require (_tokenAddressB != address(0),"tokenB address must be defined");

        // @TODO check interface
        require (_chainLinkPriceFetcher != address(0),"Chain Link Price Fetcher must be defined");

        // @TODO check interface
        require (_aavePoolAddressesProvider != address(0),"AAVE PoolAddressesProvider must be defined");

        // @TODO check interface
        require (_uniswapV3SwapRouter != address(0),"Uniswap ISwapRouter must be defined");

        uint hash = (uint256)(keccak256(abi.encodePacked(_tokenAddressA,_tokenAddressB)));
        uint hash2 = (uint256)(keccak256(abi.encodePacked(_tokenAddressB,_tokenAddressA)));
        require (tokenPairs[hash].tokenAddressA  == address(0), "Token Pair Allready Defined");
        require (tokenPairs[hash2].tokenAddressA  == address(0), "Token Pair Allready Defined");

        tokenPairs[hash] = TokenPair(
            _tokenAddressA, 
            uint96(1),
            _tokenAddressB, 
            uint96(1),
            _chainLinkPriceFetcher,
            _aavePoolAddressesProvider,
            false, 
            _tokenPairSegmentSize,
            _tokenPairDecimalNumber,
            _uniswapV3SwapRouter
            );

        emit TokenPAirAdded(
            hash, 
            _tokenAddressA, 
            _tokenAddressB, 
            _tokenPairSegmentSize,
            _tokenPairDecimalNumber,
            _chainLinkPriceFetcher,
            _aavePoolAddressesProvider,
            _uniswapV3SwapRouter
            );

        return(hash);
    }

    /**
     * @notice  Deposit a token A amount in a DOApp token Pair 
     * @param   _pairId  the pair ID used to deposit token A
     * @param   _amount  the token amount to deposit
     * @dev     _pairID must be an existing token Pair
     * @dev     amount must be >0
     */
    function depositTokenA(uint _pairId, uint _amount) external tokenPairExists(_pairId) {
        require(_amount > 0, "Deposit amount should be > 0");
        TokenPair memory lPair = tokenPairs[_pairId];

        //deposit token to curretn contract
        IERC20(lPair.tokenAddressA).safeTransferFrom(msg.sender, address(this), _amount);

        // deposit token to aave lending pool
        IPool aavePool = IPool(IPoolAddressesProvider(lPair.aavePoolAddressesProvider).getPool());
        IERC20(lPair.tokenAddressA).safeIncreaseAllowance(address(aavePool), _amount);
        aavePool.supply(lPair.tokenAddressA, _amount, address(this), 0);

        // refresh index balance
        tokenPairUserBalances[_pairId][msg.sender].indexA = computeBalanceIndex();
        tokenPairUserBalances[_pairId][msg.sender].balanceA += _amount;

        emit TokenDeposit(msg.sender, _pairId, lPair.tokenAddressA, _amount, block.timestamp);
    }

    /**
     * @notice  Withdraw a token A amount from a DOApp token pair
     * @param   _pairId  the pair ID used to deposit token A
     * @param   _amount  the token amount to deposit
     * @dev     _pairID must be an existing token Pair
     * @dev     amount must be >0
     */
    function withdrawTokenA(uint _pairId, uint _amount) external tokenPairExists(_pairId) {
        require(_amount > 0, "Withdraw amount should be > 0");
        require( _amount <= tokenPairUserBalances[_pairId][msg.sender].balanceA, "Amount to withdraw should be < your account balance");
        TokenPair memory lPair = tokenPairs[_pairId];

        //refresh balance index 
        tokenPairUserBalances[_pairId][msg.sender].indexA = computeBalanceIndex();
        tokenPairUserBalances[_pairId][msg.sender].balanceA -= _amount;

        // withdraw token from aave lending pool
        IPool aavePool = IPool(IPoolAddressesProvider(lPair.aavePoolAddressesProvider).getPool());

        //get aTokenA address
        address aTokenA = aavePool.getReserveData(lPair.tokenAddressA).aTokenAddress;

        //approve aToken doAPP vers aavePool 
        IERC20(aTokenA).approve(address(aavePool), _amount);

        //withdraw token
        aavePool.withdraw(lPair.tokenAddressA, _amount, address(this));

        //withdraw token to user
        IERC20(lPair.tokenAddressA).safeTransfer(msg.sender, _amount);

        emit TokenWithdrawal(msg.sender, _pairId, lPair.tokenAddressA, _amount, block.timestamp);
    }

    /**
     * @notice  Deposit a token B amount in a DOapp token Pair 
     * @param   _pairId  the pair ID used to deposit token B
     * @param   _amount  the token amount to deposit
     * @dev     _pairID must be an existing token Pair
     * @dev     amount must be >0
     */
    function depositTokenB(uint _pairId, uint _amount) external tokenPairExists(_pairId) {
        require(_amount > 0, "Deposit amount should be > 0");
        TokenPair memory lPair = tokenPairs[_pairId];

         //deposit token to curretn contract
        IERC20(lPair.tokenAddressB).safeTransferFrom(msg.sender, address(this), _amount);

        // deposit token to aave lending pool
        IPool aavePool = IPool(IPoolAddressesProvider(lPair.aavePoolAddressesProvider).getPool());
        IERC20(lPair.tokenAddressB).safeIncreaseAllowance(address(aavePool), _amount);
        aavePool.supply(lPair.tokenAddressB, _amount, address(this), 0);

        // refresh index balance
        tokenPairUserBalances[_pairId][msg.sender].indexB = computeBalanceIndex();
        tokenPairUserBalances[_pairId][msg.sender].balanceB += _amount;
        
        emit TokenDeposit(msg.sender, _pairId, lPair.tokenAddressB, _amount, block.timestamp);
    }

    /**
     * @notice  Withdraw a token B amount from a DOApp token pair
     * @param   _pairId  the pair ID used to deposit token B
     * @param   _amount  the token amount to deposit
     * @dev     _pairID must be an existing token Pair
     * @dev     amount must be >0
     */
    function withdrawTokenB(uint _pairId, uint _amount) external tokenPairExists(_pairId) {
        require(_amount > 0, "Withdraw amount should be > 0");
        require( _amount <= tokenPairUserBalances[_pairId][msg.sender].balanceB, "Amount to withdraw should be < your account balance");
        TokenPair memory lPair = tokenPairs[_pairId];

        //refresh balance index 
        tokenPairUserBalances[_pairId][msg.sender].indexB = computeBalanceIndex();
        tokenPairUserBalances[_pairId][msg.sender].balanceB -= _amount;

        // withdraw token from aave lending pool
        IPool aavePool = IPool(IPoolAddressesProvider(lPair.aavePoolAddressesProvider).getPool());

        //get aTokenA address
        address aTokenB = aavePool.getReserveData(lPair.tokenAddressB).aTokenAddress;

        //approve aToken doAPP vers aavePool 
        IERC20(aTokenB).approve(address(aavePool), _amount);

        //withdraw tokenB
        aavePool.withdraw(lPair.tokenAddressB, _amount, address(this));

        //withdraw token to user
        IERC20(lPair.tokenAddressB).safeTransfer(msg.sender, _amount);
                
        emit TokenWithdrawal(msg.sender, _pairId, lPair.tokenAddressB, _amount, block.timestamp);
    }

  
    /**
     * @notice  get the user token balance for a specific token pair
     * @param   _pairId  the pair ID : a keccak256 hash
     * @return  balanceA  user balance for tokenA in the specified pairID
     * @return  balanceB  user balance for tokenB in the specified pairID
     * @dev     _pairId should exist
     */
    function getTokenBalances(uint _pairId) external view tokenPairExists(_pairId) returns (uint256 balanceA, uint256 balanceB, uint indexA, uint indexB) {
        return  (
            tokenPairUserBalances[_pairId][msg.sender].balanceA,
            tokenPairUserBalances[_pairId][msg.sender].balanceB,
            tokenPairUserBalances[_pairId][msg.sender].indexA,
            tokenPairUserBalances[_pairId][msg.sender].indexB
            );
    }


    /**
     * @notice  Add a new DCA configuration pour a specific pairID
     * @param   _pairId The token pair ID for this DCA configuration
     * @param   _isBuyTokenASellTokenB if true Buy token A sell token B, else sell token A, buy token B
     * @param   _min  minimum price for Token A to buy DCA 
     * @param   _max  minimum price for Token A to buy DCA 
     * @param   _amount  standard amount to buy DCA
     * @param   _scalingFactor  multiplicator factor to buy DCA 
     * @return  configId  the DCA config ID
     * @dev if token A price is min then amount to buy will be (_amountIn * _scalingFactorIN)
     */
    function addDCAConfig( 
        uint _pairId,
        bool _isBuyTokenASellTokenB, 
        uint24 _min, 
        uint24 _max, 
        uint16 _amount, 
        uint8 _scalingFactor
    ) external tokenPairExists(_pairId) returns (uint configId) {

        TokenPair memory tokenPair = tokenPairs[_pairId];
        uint24 _segmentNumber = getSegmentNumber(_min, _max, tokenPair.tokenPairSegmentSize);
        if (_segmentNumber > DCA_CONFIG_MAX_SEGMENT) revert DCAConfigError("Too many Segments");
        if (_min >= _max ) revert DCAConfigError("min must be < max");
        if (_amount <= 0 ) revert DCAConfigError("amount must be > 0");
        if (_scalingFactor < 1 ) revert DCAConfigError("scaling factor must be >= 1");

        DCAConfig memory dcaConfig = DCAConfig(_pairId,_isBuyTokenASellTokenB, _min, _max, _amount, _scalingFactor, uint32(block.timestamp));
        createSegments(dcaConfig, _segmentNumber, tokenPair.tokenPairSegmentSize);

        configId = getDCAConfigHash(_pairId);
        emit DCAConfigCreation(msg.sender,_pairId, configId);
        return (configId);
    }


    /**
     * @notice  Create a DCA config hash based on pairId and user address
     * @param   _pairId  the token pair Id
     * @return  hash  the DCA config hash
     */
    function getDCAConfigHash(uint _pairId)internal view returns (uint hash) {
        //@TODO check if it should be based on more param
        return (uint256)(keccak256(abi.encodePacked(msg.sender,_pairId)));
    }

    function createSegments(
        DCAConfig memory _dcaConfig,
        uint24 _segmentNumber,
        uint16 _pairSegmentSize ) internal {
        
        uint pairID = _dcaConfig.pairID;

        for (uint16 i=0; i< _segmentNumber; i++) {
            uint24 segmentStart = _dcaConfig.min + i*_pairSegmentSize;
            SegmentDCAEntry memory entry = SegmentDCAEntry (msg.sender, getDCAAmount(_dcaConfig, segmentStart), 0);
             if (_dcaConfig.isSwapTookenAForTokenB) {
                SegmentDCAEntry[] storage currentArray = dcaSegmentsMap[pairID][segmentStart][0];
                currentArray.push(entry);
                dcaSegmentsMap[pairID][segmentStart][0] = currentArray;
             }
             else {
                SegmentDCAEntry[] storage currentArray = dcaSegmentsMap[pairID][segmentStart][1];
                currentArray.push(entry);
                dcaSegmentsMap[pairID][segmentStart][1] = currentArray;
             }
                
        }
    }

    function getDCAAmount( DCAConfig memory _dcaConfig, uint24 _segmentStart) pure internal returns (uint16 dcaAmount) {
            //@TODO  compute using scalinfFactor
            uint24 min = _dcaConfig.min;
            uint24 max = _dcaConfig.max;
            if (_dcaConfig.isSwapTookenAForTokenB) {
                return uint16((_dcaConfig.amount * (MULT_FACTOR + (_dcaConfig.scalingFactor -1) * (((max -_segmentStart)*MULT_FACTOR) / (max - min))))/MULT_FACTOR);
            }
            else {
                return uint16((_dcaConfig.amount * (MULT_FACTOR + (_dcaConfig.scalingFactor -1) * (((_segmentStart - min)*MULT_FACTOR) / ( max -min))))/MULT_FACTOR);
            }
    }
    
    /**
     * @notice  Compute the segment number base on max, min et segment size 
     * @param   _min  Min value
     * @param   _max  Max Value
     * @param   _segmentSize  Segment size
     * @return  uint  Segment number in this interval
     * @dev     Revert if segment number > DCA_CONFIG_MAX_SEGMENT
     */
    function getSegmentNumber(uint24 _min, uint24 _max, uint16 _segmentSize) pure internal returns (uint24) {
        uint24 segmentNumber = (_max - _min) / _segmentSize;
        return segmentNumber;
    }


    /**
     * @notice  .
     * @dev     .
     * @param   _dcaConfigId  .
     */
    function deleteDCAConfig(uint _dcaConfigId) external  {
        
    }

    function computeBalanceIndex() internal returns (uint){
        // @TODO
    }

    function computeDCA () private {
    }

    function executeDCA() external {
        uint amount;
        address account;
        uint pairId;

        computeDCA();
        OTCTransaction();

        //emit DCAExecution(account,pairId, tokenInput, tokenInputPrice, tokenOutput, amount, block.timestamp);
   }

   function OTCTransaction() internal {
   }

   function swap(uint _pairId, uint256 _amountIn, bool _isSwapTokenAtoB) internal returns (uint256 amountOut) {

        TokenPair memory lPair = tokenPairs[_pairId];
        address tokenSource;
        address tokenDest;

        if (_isSwapTokenAtoB) {
            tokenSource = lPair.tokenAddressA;
            tokenDest = lPair.tokenAddressB;
        }
        else {
            tokenSource = lPair.tokenAddressB;
            tokenDest = lPair.tokenAddressA;
        }

        // Transfer the specified amount of WETH9 to this contract.
        //TransferHelper.safeTransferFrom(tokenSource, msg.sender, address(this), amountIn);
        // Approve the router to spend WETH9.
        TransferHelper.safeApprove(tokenSource, address(lPair.swapRouter), _amountIn);

        // Note: we should explicitly set slippage limits
        uint256 minOut = /* Calculate min output */ 0;
        uint160 priceLimit = /* Calculate price limit */ 0;

        if (isProductionMode && minOut==0 && priceLimit ==0 ) {
            revert("In prodution mode, you should explicitly set slippage limits for uniswap swap");
        }

        // Create the params that will be used to execute the swap
        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: tokenSource,
                tokenOut: tokenDest,
                fee: UNISWAP_FEE_TIERS,
                recipient:address(this),
                deadline: block.timestamp + 15,
                amountIn: _amountIn,
                amountOutMinimum: minOut,
                sqrtPriceLimitX96: priceLimit
            });

        // The call to `exactInputSingle` executes the swap.
        amountOut = ISwapRouter(lPair.swapRouter).exactInputSingle(params);
        return amountOut;
    }

   function stackTokenA(uint amount) internal {
    //function supply(address pool, address token) public {
        /*
        IPool pool = 
        IPool(pool).supply(token, amount, msg.sender, 0);
        */
     }
   

   function stackTokenB() internal {
   }

}