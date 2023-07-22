// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IPoolAddressesProvider} from '@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol';
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {IDataStorage} from './IDataStorage.sol';

import "hardhat/console.sol";


/**
 * @author  yannick tison
 * @title   Data Set for DOApp contract
 * @dev     .
 * @notice  .
 */

contract DataStorage is IDataStorage, Ownable{

    uint16 constant DCA_CONFIG_MAX_SEGMENT = 1000;
    uint constant MULT_FACTOR = 1*10**8;

    // This parameter is introduced as a safeguard to restrict the number of segment entries, 
    // thereby mitigating the potential for Denial of Service (DOS) attacks.
    // While this is not an optimal solution, it serves as a temporary measure allowing us 
    // to maintain security until a more robust solution can be developed and implemented.
    uint constant MAX_SEGMENT_ENTRIES = 1000;

    // tokenPairs contains all available token pairs for DCA
    mapping(uint256 => TokenPair) private tokenPairs;

    //tokenPair Segments DCA configuration 
    // pairID => segment Start price => DCADelay (1h, 1 day, 1 week)  => DCA entry ([0] token A => B [1] token B => A)
    mapping (uint pairID => mapping (uint segmentStart => mapping(DCADelayEnum => SegmentDCAEntry[][2]))) private dcaSegmentsMap;

    //user address => DCAConfig hash => bool
    mapping(address => mapping(uint => bool)) private userDCAConfig;

    //dca config hash
    mapping(uint => IDataStorage.DCAConfig) private dcaConfigHashMap;

    //maximum penalty for an early withdraw in % ()
    //uint constant public maxEarlyWithdrawPenality = 10;
    // eraly withdraw delay (10 days for example : 10*24*3600)
    //uint constant public EarlyWithdrawInterval = 864000;
    // @TODO manage penalty on early withdraw 

 
    event TokenPAirAdded(
            uint _pairId
            );

    event DCAConfigCreation(
        address indexed _sender, 
        uint indexed _pairId, 
        uint _configId
        );
    
    event DCAConfigDeletion(
        address indexed _sender, 
        uint indexed _pairId, 
        uint _configId,
        bool isDeletedUser
        ); 


    error DCAConfigError(string _errorMessage);

    // check if a token Pair already exists
    modifier tokenPairExists(uint _pairID) {
        require(tokenPairs[_pairID].tokenA != address(0) ,"Token Pair not Found");
        _;
    }

    function getTokenPair(uint _pairId) public view returns (TokenPair memory) {
        TokenPair memory lPair = tokenPairs[_pairId];
        require(lPair.tokenA != address(0) ,"Token Pair not Found");
        return (lPair);
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
        uint _tokenPairSegmentSize,
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
        require (tokenPairs[hash].tokenA  == address(0), "Token Pair Allready Defined");
        require (tokenPairs[hash2].tokenA  == address(0), "Token Pair Allready Defined");

        tokenPairs[hash] = TokenPair(
            _tokenAddressA, 
            uint96(1),
            _tokenAddressB, 
            uint96(1),
            _chainLinkPriceFetcher,
            _aavePoolAddressesProvider,
            false, 
            _tokenPairSegmentSize,
            _uniswapV3SwapRouter,
            hash,
            IPool(IPoolAddressesProvider(_aavePoolAddressesProvider).getPool()).getReserveData(_tokenAddressA).aTokenAddress,
            IPool(IPoolAddressesProvider(_aavePoolAddressesProvider).getPool()).getReserveData(_tokenAddressB).aTokenAddress
            );


        emit TokenPAirAdded(
            hash
            );

        return(hash);
    }
              

   /**
     * @notice  Add a new DCA configuration for a specific pairID
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
        uint _min, 
        uint _max, 
        uint _amount, 
        uint8 _scalingFactor,
        IDataStorage.DCADelayEnum _dcaDelay
    ) external returns (uint configId) {

        IDataStorage.TokenPair memory tokenPair = getTokenPair(_pairId);
        uint24 _segmentNumber = getSegmentNumber(_min, _max, tokenPair.tokenPairSegmentSize);
        if (_segmentNumber > DCA_CONFIG_MAX_SEGMENT) revert DCAConfigError("Too many Segments");
        if (_min >= _max ) revert DCAConfigError("min must be < max");
        if (_amount <= 0 ) revert DCAConfigError("amount must be > 0");
        if (_scalingFactor < 1 ) revert DCAConfigError("scaling factor must be >= 1");

        IDataStorage.DCAConfig memory dcaConfig = 
            IDataStorage.DCAConfig(
                0,
                _pairId,
                _isBuyTokenASellTokenB, 
                _min, 
                _max, 
                _amount, 
                _scalingFactor, 
                uint32(block.timestamp),
                _dcaDelay,
                0,
                msg.sender
            );
        configId = getDCAConfigHash(dcaConfig);
        dcaConfig.dcaConfigId = configId;

        //edge case where two identical config where created on the same block by the same user
        if (userDCAConfig[msg.sender][configId] == true) revert DCAConfigError("DCA Config already exists");

        // add this new config tomapping
        userDCAConfig[msg.sender][configId] = true;
        dcaConfigHashMap[configId] = dcaConfig;   


        createSegments(dcaConfig, _segmentNumber, tokenPair.tokenPairSegmentSize);

        emit DCAConfigCreation(msg.sender, _pairId, configId);
        return (configId);
    }

    /**
     * @notice  Get a DCA config base on config Id
     * @param   _dcaConfigId  ID of DCA config to retrieve
     */
    function getDCAConfig (uint _dcaConfigId) public view returns(DCAConfig memory) {
        return dcaConfigHashMap[_dcaConfigId];
    }

   /**
     * @notice  Delete a  DCA configuration
     * @param   _dcaConfigId The DCA configuration Id to delete
     */
    function deleteDCAConfig(uint _dcaConfigId) external returns (uint ) {
        DCAConfig memory dcaConfig = getDCAConfig (_dcaConfigId);
        
        uint pairId = dcaConfig.pairID;
        if (dcaConfig.creator == address(0)) {
            revert("No DCA config found with given id");
        }
        if ((msg.sender != address(owner())) && (msg.sender != dcaConfig.creator)) {
            revert("Only contract owner or DCA config creator can delete a DCA configuration");
        }
        TokenPair memory tokenPair = getTokenPair(pairId);
        deleteSegments(
            dcaConfig, 
            getSegmentNumber(dcaConfig.min, dcaConfig.max, tokenPair.tokenPairSegmentSize),
            tokenPair.tokenPairSegmentSize
        );

        // delete this new config from mapping
        delete userDCAConfig[dcaConfig.creator][_dcaConfigId];
        delete dcaConfigHashMap[_dcaConfigId];

        emit DCAConfigDeletion(msg.sender, pairId, _dcaConfigId, msg.sender == dcaConfig.creator? true: false);
        return (_dcaConfigId);
    }


    /**
     * @notice  this fonction is called by dca process and should only be called by owner 
     *          for security reason, to avoid multiple DCA on the same config without respect
     *          of the delay set by the user
     *          
     * @dev     .
     * @param   _dcaConfigId  hash of DCA config to update
     * @param   _lastDCATime  tiimestamp
     */

    //function updateDCAConfigLastDCATime (uint _dcaConfigId, uint _lastDCATime) external onlyOwner() {
    function updateDCAConfigLastDCATime (uint _dcaConfigId, uint _lastDCATime) external  {
        //@TODO checker le owner
        console.log("caller : %s", msg.sender);
        require (dcaConfigHashMap[_dcaConfigId].dcaConfigId == _dcaConfigId,"No such DCAConfig");
        require (_lastDCATime != 0,"lastDCATime should not be null");
        dcaConfigHashMap[_dcaConfigId].lastDCATime = _lastDCATime;
    }

    /**
     * @notice  Get segments for a specific Pair, price, delay  for Both Token A and Token B
     * @dev     .
     * @param   _pairId  .
     * @param   price  .
     * @param   delay  .
     */
    function getDCASegment(uint _pairId, uint price, IDataStorage.DCADelayEnum delay) public view returns(SegmentDCAEntry[][2] memory){
        return dcaSegmentsMap[_pairId][price][delay];
    }

    /**
     * @notice  Get segments for a specific Pair, price, delay and token(A or B)
     * @dev     .
     * @param   _pairId  .
     * @param   _price  .
     * @param   delay  .
     * @param   _token  .
     * @return  IDataStorage.SegmentDCAEntry[]  .
     */
    function getDCASegmentEntries (
        uint _pairId,
        uint _price, 
        IDataStorage.DCADelayEnum delay,
        IDataStorage.TokenEnum _token
        ) external view returns (IDataStorage.SegmentDCAEntry[] memory) {

            return (getDCASegment(_pairId,_price,delay)[uint(_token)]);

    }



    /**
     * @notice  Create segmeents for a DCA configuration
     * @dev     Create multiple segment of a specified size to cover the DCA interval
     *          For example, with an interval 1000-1500 and segment size of 25,
     *          20 segments wil be created with the DCA Amount de execute on each segmeent
     *          based on the DCA base amount, the scalling factor and the segment start value
     * @param   _dcaConfig  DCA configuration to create segment for
     * @param   _segmentNumber  Segment number to create
     * @param   _pairSegmentSize  Segment size
     */
    function createSegments(
        IDataStorage.DCAConfig memory _dcaConfig,
        uint24 _segmentNumber,
        uint _pairSegmentSize ) internal {
        
        uint pairID = _dcaConfig.pairID;

        for (uint16 i=0; i< _segmentNumber; i++) {
            uint segmentStart = _dcaConfig.min + i*_pairSegmentSize;
            IDataStorage.SegmentDCAEntry memory entry = 
            IDataStorage.SegmentDCAEntry (
                msg.sender, 
                getDCAAmount(_dcaConfig, segmentStart), 
                _dcaConfig.dcaConfigId
            );
            IDataStorage.SegmentDCAEntry[] storage currentArray;
             if (_dcaConfig.isSwapTookenAForTokenB) {
                currentArray = dcaSegmentsMap[pairID][segmentStart][_dcaConfig.dcaDelay][0];
                currentArray.push(entry);
                dcaSegmentsMap[pairID][segmentStart][_dcaConfig.dcaDelay][0] = currentArray;
             }
             else {
               currentArray = dcaSegmentsMap[pairID][segmentStart][_dcaConfig.dcaDelay][1];
                currentArray.push(entry);
                dcaSegmentsMap[pairID][segmentStart][_dcaConfig.dcaDelay][1] = currentArray;
             }
             if (currentArray.length == MAX_SEGMENT_ENTRIES) {
                revert DCAConfigError("No more DCA configuration allowed on this TokenPair for this price");
             }
        }
    }

    /**
     * @notice  Delete segmeents for a DCA configuration
     * @dev     Delete all segments covering the DCA interval
     * @param   _dcaConfig  DCA configuration to delete segment from
     * @param   _segmentNumber  Segment number to delete
     * @param   _pairSegmentSize  Segment size
     */
    function deleteSegments(
        IDataStorage.DCAConfig memory _dcaConfig,
        uint24 _segmentNumber,
        uint _pairSegmentSize ) internal {
        
        uint pairID = _dcaConfig.pairID;

        for (uint16 i=0; i< _segmentNumber; i++) {
            uint segmentStart = _dcaConfig.min + i*_pairSegmentSize;
            console.log("deleteSegments - segmentStart : ", segmentStart);

            IDataStorage.SegmentDCAEntry[] storage currentArray;
             if (_dcaConfig.isSwapTookenAForTokenB) {
                currentArray = dcaSegmentsMap[pairID][segmentStart][_dcaConfig.dcaDelay][0];
                console.log("deleteSegments - currentArray.length : ", currentArray.length );

                for (uint j=0; j< currentArray.length; j++ ){
                    if (currentArray[j].dcaConfigId == _dcaConfig.dcaConfigId) {
                        // Move the last element into the place to delete
                        currentArray[j] = currentArray[currentArray.length - 1];
                        // Remove the last element
                        currentArray.pop();
                        break;
                    }
                }
                dcaSegmentsMap[pairID][segmentStart][_dcaConfig.dcaDelay][0] = currentArray;
                console.log("deleteSegments - dcaSegmentsMap[pairID][segmentStart][_dcaConfig.dcaDelay][0].length : ",
                  dcaSegmentsMap[pairID][segmentStart][_dcaConfig.dcaDelay][0].length );
             }
             else {
                currentArray = dcaSegmentsMap[pairID][segmentStart][_dcaConfig.dcaDelay][1];
                console.log("deleteSegments - currentArray.length : ", currentArray.length );

                for (uint j=0; j< currentArray.length; j++ ){
                    if (currentArray[j].dcaConfigId == _dcaConfig.dcaConfigId) {
                        // Move the last element into the place to delete
                        currentArray[j] = currentArray[currentArray.length - 1];
                        // Remove the last element
                        currentArray.pop();
                        break;
                    }
                }
                //dcaSegmentsMap[pairID][segmentStart][_dcaConfig.dcaDelay][1] = currentArray;
                console.log("deleteSegments - dcaSegmentsMap[pairID][segmentStart][_dcaConfig.dcaDelay][1].length : ",
                  dcaSegmentsMap[pairID][segmentStart][_dcaConfig.dcaDelay][1].length );
             }
        }
    }


    /**
     * @notice  Create a DCA config hash based on pairId and user address
     *          We allow one DCA config per user / per Pair and per path (2 path :A->B or B->A)
     * @param   _dcaConfig  a DCAConfig object
     * @return  hash  the DCA config hash
     */
    function getDCAConfigHash(IDataStorage.DCAConfig memory _dcaConfig) internal view returns (uint hash) {

        // unicity is one DCAconfig by user / TokenPair / Creation Date
        return (uint256)(keccak256(abi.encodePacked(
            msg.sender,
            _dcaConfig.pairID, 
            _dcaConfig.isSwapTookenAForTokenB)
            )
        );
    }

   /**
     * @notice  Calculate DCA amount based on the DCA base amount, the scalling factor 
     *          and the segment start value
     * @dev     .
     * @param   _dcaConfig  Associated DCA config
     * @param   _segmentStart  Segment start value
     * @return  dcaAmount  Base DCA amount
     */
    function getDCAAmount( IDataStorage.DCAConfig memory _dcaConfig, uint _segmentStart) pure internal 
        returns (uint dcaAmount) {
            //@TODO  compute using scalinfFactor
            uint min = _dcaConfig.min;
            uint max = _dcaConfig.max;
            if (_dcaConfig.isSwapTookenAForTokenB) {
                return uint((_dcaConfig.amount * (MULT_FACTOR + (_dcaConfig.scalingFactor -1) 
                        * (((max -_segmentStart)*MULT_FACTOR) / (max - min))))/MULT_FACTOR);
            }
            else {
                return uint((_dcaConfig.amount * (MULT_FACTOR + (_dcaConfig.scalingFactor -1) 
                        * (((_segmentStart - min)*MULT_FACTOR) / ( max -min))))/MULT_FACTOR);
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
    function getSegmentNumber(uint _min, uint _max, uint _segmentSize) pure internal 
        returns (uint24) {
        uint24 segmentNumber = uint24((_max - _min) / _segmentSize);
        return segmentNumber;
    }


}

