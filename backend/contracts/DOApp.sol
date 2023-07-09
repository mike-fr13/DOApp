// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DOApp is Ownable {


    /**
     *  @Dev This structure contains configuration for a specific pair of token 
     */
    struct TokenPair {
        address TokenAddressA;
        address TokenAddressB;
        address ChainlinkPriceFetcher;
        bool enabled;
    }

    struct DCAConfig {
        uint minIN;
        uint maxIN;
        uint amountIN;
        uint scalingFactorIN;

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

    function addTokenPair(address _tokenAddressA, address _tokenAddressB, address _chainLinkPriceFetcher) external onlyOwner() returns (uint256){
        require (_tokenAddressA != address(0),"tokenA address must be defined");
        require (_tokenAddressB != address(0),"tokenB address must be defined");
        // @TODO check interface
        require (_chainLinkPriceFetcher != address(0),"Chain Link Price Fetcher must be defined");
        uint hash = (uint256)(keccak256(abi.encodePacked(_tokenAddressA,_tokenAddressB)));
        require (tokenPairs[hash].TokenAddressA  == address(0), "token Pair Allready Defined");
        tokenPairs[hash] = TokenPair(_tokenAddressA, _tokenAddressB, _chainLinkPriceFetcher, false);
        emit TokenPAirAdded(hash, _tokenAddressA, _tokenAddressB, _chainLinkPriceFetcher);
        return(hash);
    }

    function depositTokenA(uint _pairId, uint _amount) external tokenPairExists(_pairId) {
        require(_amount > 0, "Amount should be > 0");
        TokenPair memory lPair = tokenPairs[_pairId];
        IERC20(lPair.TokenAddressA).transferFrom(msg.sender, address(this), _amount);
        balanceTokenA[_pairId][msg.sender] += _amount;
        emit TokenDeposit(msg.sender, _pairId, lPair.TokenAddressA, _amount, block.timestamp);
    }

    function withdrawTokenA(uint _pairId, uint _amount) external tokenPairExists(_pairId) {
        require(_amount > 0, "Amount should be > 0");
        TokenPair memory lPair = tokenPairs[_pairId];
        balanceTokenA[_pairId][msg.sender] -= _amount;
        IERC20(lPair.TokenAddressA).transfer(msg.sender, _amount);
        emit TokenWithdrawal(msg.sender, _pairId, lPair.TokenAddressA, _amount, block.timestamp);
    }

    function addOrUpdateDCAConfig(DCAConfig calldata _config) external  {
    }

    function getTokenBalances(uint _pairId) external view tokenPairExists(_pairId) returns (uint256 balanceA, uint256 balanceB) {
        return  (balanceTokenA[_pairId][msg.sender],  balanceTokenA[_pairId][msg.sender]);
    }


    /*
    function disableDCAConfig() external  {
    }
    */

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