// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IPoolAddressesProvider} from '@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol';

contract DOApp is Ownable {
    using SafeERC20 for IERC20;

    uint16 constant DCA_CONFIG_MAX_SEGMENT = 1000;
    uint16 constant MULT_FACTOR = 1000;

    /**
     *  @Dev This structure contains configuration for a specific pair of token 
     */
    struct TokenPair {
        // 8 + 160 +16 +8 = 192
        bool enabled;
        address tokenAddressA;
        uint16 tokenPairSegmentSize;
        uint8 tokenPairDecimalNumber;

        //160
        address tokenAddressB;

        //160
        address chainlinkPriceFetcher;

        //160
        IPoolAddressesProvider aavePoolAddressesProvider;
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

    // User address => staked amount
    mapping(uint => mapping(address => uint)) balanceTokenA;
    mapping(uint => mapping(address => uint)) balanceTokenB;

    // tokenPairs contains all available token pairs for DCA
    mapping(uint256 => TokenPair) public tokenPairs;

    //tokePair Segments DCA configuration 
    mapping (uint pairID => mapping (uint segmentStart => SegmentDCAEntry[][2])) public dcaSegmentsMap;

    //deposit lock penalty  time
    uint constant public lockTime = 10 days;

    //maximum penalty for an early withdraw in % ()
    uint constant public maxEarlyWithdrawPenality = 10 ;

    modifier tokenPairExists(uint _pairID) {
        require(tokenPairs[_pairID].tokenAddressA != address(0) ,"Token Pair not Found");
        _;
    }

    event TokenPAirAdded(uint _pairId, address _tokenAddressA,address _tokenAddressB,address _chainLinkPriceFetcher);
    event TokenDeposit(address _sender, uint _pairId, address token, uint _amount, uint _timestamp);
    event TokenWithdrawal(address _sender, uint _pairId, address token, uint _amount, uint _timestamp);
    event DCAConfigCreation(address _sender, uint _pairId, uint _configId);
    event DCAExecution(address _account, uint _pairId, address _tokenInput, uint _tokenInputPrice, IERC20 _tokenOutput, uint _amount, uint _timeStamp);

    error DCAConfigError(string _errorMessage);
    
    constructor() Ownable() payable {
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
        address _aavePoolAddressesProvider) external onlyOwner() returns (uint256){

        // @TODO utiliser des constantes d'erreurs
        require (_tokenAddressA != address(0),"tokenA address must be defined");
        require (_tokenAddressB != address(0),"tokenB address must be defined");

        // @TODO check interface
        require (_chainLinkPriceFetcher != address(0),"Chain Link Price Fetcher must be defined");

        //@TODO check interface
        //TODO bonus : maange token without aave stacking
        require (_aavePoolAddressesProvider != address(0),"AAVE PoolAddressesProvider must be defined");
        
        uint hash = (uint256)(keccak256(abi.encodePacked(_tokenAddressA,_tokenAddressB)));
        uint hash2 = (uint256)(keccak256(abi.encodePacked(_tokenAddressB,_tokenAddressA)));
        require (tokenPairs[hash].tokenAddressA  == address(0), "Token Pair Allready Defined");
        require (tokenPairs[hash2].tokenAddressA  == address(0), "Token Pair Allready Defined");

        tokenPairs[hash] = TokenPair(
            false, 
            _tokenAddressA, 
            _tokenPairSegmentSize,
            _tokenPairDecimalNumber,
            _tokenAddressB, 
            _chainLinkPriceFetcher,
            IPoolAddressesProvider(_aavePoolAddressesProvider));
        emit TokenPAirAdded(hash, _tokenAddressA, _tokenAddressB, _chainLinkPriceFetcher);
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

        (IERC20(lPair.tokenAddressA)).safeTransferFrom(msg.sender, address(this), _amount);

        balanceTokenA[_pairId][msg.sender] += _amount;
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
        require( _amount <= balanceTokenA[_pairId][msg.sender], "Amount to withdraw should be < your account balance");
        TokenPair memory lPair = tokenPairs[_pairId];

        balanceTokenA[_pairId][msg.sender] -= _amount;
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

        IERC20(lPair.tokenAddressB).safeTransferFrom(msg.sender, address(this), _amount);
        balanceTokenB[_pairId][msg.sender] += _amount;
        
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
        require( _amount <= balanceTokenB[_pairId][msg.sender], "Amount to withdraw should be < your account balance");
        TokenPair memory lPair = tokenPairs[_pairId];

        balanceTokenB[_pairId][msg.sender] -= _amount;
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
    function getTokenBalances(uint _pairId) external view tokenPairExists(_pairId) returns (uint256 balanceA, uint256 balanceB) {
        return  (balanceTokenA[_pairId][msg.sender],  balanceTokenB[_pairId][msg.sender]);
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

        uint configId = getDCAConfigHash(_pairId);
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
            SegmentDCAEntry memory entry = SegmentDCAEntry (msg.sender, getDCAAmount(pairID, _dcaConfig, segmentStart), 0);
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

    function getDCAAmount(uint _pairId, DCAConfig memory _dcaConfig, uint24 _segmentStart) pure internal returns (uint16 dcaAmount) {
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

   function swap() internal {
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