const fs = require("fs")
const path = require("path")

const getDoAppAbi = () => {
  try {
    const dir = path.resolve(
      __dirname,
      "../../artifacts/contracts/DOApp.sol/DOApp.json"
    )
    const file = fs.readFileSync(dir, "utf8")
    const json = JSON.parse(file)
    const abi = json.abi
    //console.log(`abi`, abi)

    return abi
  } catch (e) {
    console.log(`e`, e)
  }
}

async function getTokenPairs(dataStorage) {
    const [owner, account1, account2, account3, account4] = await ethers.getSigners();
    //const ABI = getDoAppAbi();
    const filter = dataStorage.filters.TokenPAirAdded(null, null, null, null, null, null, null, null);
    const events = await dataStorage.queryFilter(filter, 0);

    const pairIds = [];

    events.forEach((event) => {
        /*
        console.log("TokenPAirAdded event received");
        console.log("Pair ID:", event.args._pairId);
        console.log("Token Address A:", event.args._tokenAddressA);
        console.log("Token Address B:", event.args._tokenAddressB);
        console.log("Token Pair Segment Size:", event.args._tokenPairSegmentSize);
        console.log("Token Pair Decimal Number:", event.args._tokenPairDecimalNumber);
        console.log("ChainLink Price Fetcher:", event.args._chainLinkPriceFetcher);
        console.log("AAVE Pool Addresses Provider:", event.args._aavePoolAddressesProvider);
        console.log("Uniswap V3 Swap Router:", event.args._uniswapV3SwapRouter);
        */
        pairIds.push(event.args._pairId);

      });

      return pairIds;
  }

  async function addTokenPair(
    doAPPcontract,
    tokenAAddress,
    tokenBAddress,
    tokenPairSize,
    tokenPairDecimalsNumber,
    mockChainLinkAggregatorV3Address,
    mockAAVEPoolAddressesProviderAddress,
    mockUniswapISwapRouterAddress
  ) {
    doAPPcontract.addTokenPair(
      tokenAAddress,
      tokenPairSegmentSize,
      tokenPairDecimalsNumber,
      tokenBAddress,
      mockChainLinkAggregatorV3Address,
      mockAAVEPoolAddressesProviderAddress,
      mockUniswapISwapRouterAddress
    );
  }  
  
module.exports = {
    getTokenPairs,
    getDoAppAbi,
    addTokenPair
}

