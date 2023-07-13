// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract DOApp is Ownable {
    using SafeERC20 for IERC20;

    /**
     *  @Dev This structure contains configuration for a specific pair of token 
     */
    struct TokenPair {
        address TokenAddressA;
        uint16 TokenASegmentSize;
        uint8 TokenADecimalNumber;
        address TokenAddressB;
        uint TokenBSegmentSize;
        uint8 TokenBDecimalNumber;
        address ChainlinkPriceFetcher;
        bool enabled;
    }

    struct DCAConfig {
        bool inputDCAEnable;
        uint minIN;
        uint maxIN;
        uint amountIN;
        uint scalingFactorIN;

        bool outputDCAEnable;
        uint minOUT;
        uint maxOUT;
        uint amountOUT;
        uint scalingFactorOUT;
    }

    // User address => staked amount
    mapping(uint => mapping(address => uint)) balanceTokenA;
    mapping(uint => mapping(address => uint)) balanceTokenB;

    // tokenPairs contains all available token pairs for DCA
    mapping(uint256 => TokenPair) public tokenPairs;

    //deposit lock penality  time
    uint constant public lockTime = 10 days;

    //maximum penality for an early withdraw in % ()
    uint constant public maxEarlyWithdrawPenality = 10 ;

    modifier tokenPairExists(uint _pairID) {
        require(tokenPairs[_pairID].TokenAddressA != address(0) ,"Token Pair not Found");
        _;
    }

    event TokenPAirAdded(uint hash,address _tokenAddressA,address _tokenAddressB,address _chainLinkPriceFetcher);
    event TokenDeposit(address _sender, uint _pairId, address token, uint _amount, uint _timestamp);
    event TokenWithdrawal(address _sender, uint _pairId, address token, uint _amount, uint _timestamp);
    event DCAExecution(address _account, uint _pairId, address _tokenInput, uint _tokenInputPrice, IERC20 _tokenOutput, uint _amount, uint _timeStamp);

    
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
     * @dev     We order _tokenAddressA and _tokenAddressB to create the new Pair to avoid the same pair with inverted token
     */
    function addTokenPair(address _tokenAddressA, uint16 _tokenASegmentSize,uint8 _tokenADecimalNumber,  
                          address _tokenAddressB, uint16 _tokenBSegmentSize,uint8 _tokenBDecimalNumber,
                          address _chainLinkPriceFetcher) external onlyOwner() returns (uint256){
        // @TODO utiliser des constantes d'erreurs
        require (_tokenAddressA != address(0),"tokenA address must be defined");
        require (_tokenAddressB != address(0),"tokenB address must be defined");

        // @TODO check interface
        require (_chainLinkPriceFetcher != address(0),"Chain Link Price Fetcher must be defined");
        
        //sort the token address
        if (_tokenAddressA > _tokenAddressB) {
            (_tokenAddressA, _tokenAddressB) = (_tokenAddressB, _tokenAddressA);
        }
        
        uint hash = (uint256)(keccak256(abi.encodePacked(_tokenAddressA,_tokenAddressB)));
        require (tokenPairs[hash].TokenAddressA  == address(0), "Token Pair Allready Defined");
        tokenPairs[hash] = TokenPair(_tokenAddressA, _tokenASegmentSize,_tokenADecimalNumber,
                                     _tokenAddressB, _tokenBSegmentSize,_tokenBDecimalNumber,
                                     _chainLinkPriceFetcher, false);
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

        (IERC20(lPair.TokenAddressA)).safeTransferFrom(msg.sender, address(this), _amount);

        balanceTokenA[_pairId][msg.sender] += _amount;
        emit TokenDeposit(msg.sender, _pairId, lPair.TokenAddressA, _amount, block.timestamp);
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
        IERC20(lPair.TokenAddressA).safeTransfer(msg.sender, _amount);

        emit TokenWithdrawal(msg.sender, _pairId, lPair.TokenAddressA, _amount, block.timestamp);
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

        IERC20(lPair.TokenAddressB).safeTransferFrom(msg.sender, address(this), _amount);
        balanceTokenB[_pairId][msg.sender] += _amount;
        
        emit TokenDeposit(msg.sender, _pairId, lPair.TokenAddressB, _amount, block.timestamp);
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
        IERC20(lPair.TokenAddressB).safeTransfer(msg.sender, _amount);
                
        emit TokenWithdrawal(msg.sender, _pairId, lPair.TokenAddressB, _amount, block.timestamp);
    }

    /*
    function addOrUpdateDCAConfig(DCAConfig calldata _config) external  {
    }
    */

    
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

    function deleteDCAConfig() external  {
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

   function stackTokenA() internal {
   }

   function stackTokenB() internal {
   }

}