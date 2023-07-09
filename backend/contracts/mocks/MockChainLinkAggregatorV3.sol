// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract MockChainLinkAggregatorV3 is  AggregatorV3Interface{

    address ETH_USDT_GOERLI = 0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e;
    AggregatorV3Interface localPriceFeed;

    uint80 iRoundId;
    int256 iAnswer;
    uint256 iStartedAt;
    uint256 iUpdatedAt;

    bool iLocalMock;

    constructor(address _pairAddressToFetch, bool _localMock) {
        iLocalMock = _localMock;
        if (!iLocalMock) {
            localPriceFeed = AggregatorV3Interface(_pairAddressToFetch);
        }
    }


 function decimals() external view returns (uint8) {
    if  (!iLocalMock) {
        return localPriceFeed.decimals();
    }
    else {
        return(8);
    }
 }

  function description() external view returns (string memory) {
    if  (!iLocalMock) {
        return localPriceFeed.description();
    }
    else {
        return("local Mock");
    }
  }

  function version() external view returns (uint256) {
    if  (!iLocalMock) {
        return localPriceFeed.version();
    } 
    else {
        return (0);
    }
  }

  function getRoundData(
    uint80 _roundId
  ) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {

    return(iRoundId,iAnswer,iStartedAt,iUpdatedAt,0);
  }

  function latestRoundData()
    external
    view
    returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {

        return(iRoundId,iAnswer,iStartedAt,iUpdatedAt,0);
    }

  function setPrice(int256 _price)external {
    iAnswer = _price;
    ++iRoundId;
    iStartedAt= block.timestamp;
    iUpdatedAt = block.timestamp;
  }

}
