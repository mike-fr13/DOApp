// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @author  Yannick Tison
 * @title   Mock ChainLinkAggregatorV3
 * @dev     This contract overload getRoundData() and getLatestRoundData() 
 * @dev     a setPrice() function is added to set roundData output
 * @notice  This contract will be used to test some personal DEFI stuff.
 */

contract MockChainLinkAggregatorV3 is  AggregatorV3Interface{

    address ETH_USDT_GOERLI = 0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e;
    AggregatorV3Interface localPriceFeed;

    uint80 iRoundId;
    int256 iAnswer;
    uint256 iStartedAt;
    uint256 iUpdatedAt;

    bool iLocalMock;

    // We add _localMock boolean to surcharge some inherited function when working locally
    constructor(address _pairAddressToFetch, bool _localMock) {
        iLocalMock = _localMock;
        if (!iLocalMock) {
            localPriceFeed = AggregatorV3Interface(_pairAddressToFetch);
        }
    }


 /**
  * @notice  if not iLocalMock then call inherited function else return  8 decimals
  * @return  uint8  decimal numbers 
  */
 function decimals() external view returns (uint8) {
    if  (!iLocalMock) {
        return localPriceFeed.decimals();
    }
    else {
        return(8);
    }
 }

  /**
   * @notice  if not iLocalMock then call inherited function else return  "local Mock"
   * @return  string  a description
   */
  function description() external view returns (string memory) {
    if  (!iLocalMock) {
        return localPriceFeed.description();
    }
    else {
        return("Local Mock");
    }
  }

  /**
   * @notice  if not iLocalMock then call inherited function else return  0
   * @dev     .
   * @return  uint256  verion number
   */
  function version() external view returns (uint256) {
    if  (!iLocalMock) {
        return localPriceFeed.version();
    } 
    else {
        return (0);
    }
  }

  /**
   * @notice  this function returns same value  as latestRoundData() : roundId paramter is not used. 
   * @param   . _roundId => not used in this mock
   * @return  roundId  current roundId
   * @return  answer data queried
   * @return  startedAt  block timestamp for last setPrice() execution
   * @return  updatedAt  block timestamp for last setPrice() execution
   * @return  answeredInRound  0 (output not mocked)
   */
  function getRoundData(
    uint80 
  ) external view returns (uint80 , int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {

    return(iRoundId,iAnswer,iStartedAt,iUpdatedAt,0);
  }

  /**
   * @notice  This function return a price for current contract instance associated pair
   * @return  roundId  current roundId
   * @return  answer data queried
   * @return  startedAt  block timestamp for last setPrice() execution
   * @return  updatedAt  block timestamp for last setPrice() execution
   * @return  answeredInRound  0 (output not mocked)
   */
  function latestRoundData()
    external
    view
    returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {

        return(iRoundId,iAnswer,iStartedAt,iUpdatedAt,0);
    }

  /**
   * @notice  Set the price that will be returned for next latestRoundData() call
   * @dev     Each execution increments iRoundId
   * @dev     and set iStartedAt and iUpdatedAt to block.timestamp
   * @param   _price  Price to be returned for next latestRoundData() call
   */
  function setPrice(int256 _price)external {
    iAnswer = _price;
    iRoundId++;
    iStartedAt= block.timestamp;
    iUpdatedAt = block.timestamp;
  }

}
