// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
//V3.0
contract getEthPrice {

    AggregatorV3Interface internal immutable i_priceFeed;

    constructor(address priceFeedAddress) {
        i_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function getEthPriceInUSD() public view returns (uint) {
        (, int256 price, , , ) = i_priceFeed.latestRoundData();
        uint256 adjustedPrice = uint256(price) * 10**10;
        return adjustedPrice;
    }
}