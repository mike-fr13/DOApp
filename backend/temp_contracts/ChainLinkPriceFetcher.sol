// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./mocks/MockChainLinkAggregatorV3.sol";

contract PriceFetcher {
    AggregatorV3Interface internal priceFeedETH;
    AggregatorV3Interface internal priceFeedLINK;
    MockChainLinkAggregatorV3 internal mockPriceFeedETH;
    MockChainLinkAggregatorV3 internal mockPriceFeedLINK;
    address ETH_USD_GOERLI = 0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e;
    address LINK_USD_GOERLI = 0x48731cF7e84dc94C5f84577882c14Be11a5B7456;

    constructor() {
        priceFeedETH = AggregatorV3Interface(ETH_USD_GOERLI);
        priceFeedLINK = AggregatorV3Interface(LINK_USD_GOERLI);
        mockPriceFeedETH = new MockChainLinkAggregatorV3(ETH_USD_GOERLI,true);
        mockPriceFeedLINK = new MockChainLinkAggregatorV3(LINK_USD_GOERLI,true);
    }

    function getEthUsdPrice() public view returns (int256) {
        (, int256 price, , , ) = priceFeedETH.latestRoundData();
        return price;
     }

    function getLinkUsdPrice() public view returns (int256) {
        (, int256 price, , , ) = priceFeedLINK.latestRoundData();
        return price;
    }

    function getMockEthUsdPrice() public view returns (int256) {
        (, int256 price, , , ) = mockPriceFeedETH.latestRoundData();
        return price;
     }

    function getMockLinkUsdPrice() public view returns (int256) {
        (, int256 price, , , ) = mockPriceFeedLINK.latestRoundData();
        return price;
    }

}

