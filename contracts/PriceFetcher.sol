// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract PriceFetcher {
    AggregatorV3Interface internal priceFeed;
    address ETH_USDT_MUMBAI = 0x0715A7794a1dc8e42615F059dD6e406A6594651A;

    constructor() {
        priceFeed = AggregatorV3Interface(ETH_USDT_MUMBAI);
    }

    function getEthUsdtPrice() public view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }
}
