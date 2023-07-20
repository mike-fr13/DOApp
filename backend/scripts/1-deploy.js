const Constant = require("../test/lib/Constants.js");
const fs = require("fs");
const hre = require("hardhat");

async function main() {

  const isDebugEnable = false

  // Get the deployment network name
  const network = hre.network.name;

  // Check if the network name is provided
  if ((!network)||(network =="hardhat")) {
    console.error("Please specify the deployment network name (e.g., localhost, rinkeby, mainnet)");
    console.error("We do not auhtorize the default hardhat network to avoid deployment misstake and waste of time");
    return;
  } else {
    console.log (`Deployment on network : ${network}`);
  }
  

  // deploy DOApp main contract
  const DataStorage = await hre.ethers.getContractFactory('DataStorage');
  const dataStorage = await DataStorage.deploy();
  await dataStorage.deployed();
  console.log(`dataStorage deployed to ${dataStorage.address}`);
  
  const DOApp = await hre.ethers.getContractFactory("DOApp");
  const doApp = await DOApp.deploy(false,dataStorage.address);
  await doApp.deployed();
  console.log(`DOApp deployed to ${doApp.address}`);

  const MockChainLinkAggregatorV3 = await hre.ethers.getContractFactory("MockChainLinkAggregatorV3");
  const mockChainLinkAggregatorV3 = await MockChainLinkAggregatorV3.deploy(Constant.ADDRESS_0, true);
  await mockChainLinkAggregatorV3.deployed();
  console.log(`MockChainLinkAggregatorV3 deployed to ${mockChainLinkAggregatorV3.address}`);

  // create an ERC20 Mock: TokenA
  const TokenA = await hre.ethers.getContractFactory("MockERC20");
  const tokenA = await TokenA.deploy(Constant.MCKA_NAME, Constant.MCKA_SYMBOL, Constant.TOKEN_INITIAL_SUPPLY);
  await tokenA.deployed();
  console.log(`TokenA deployed to ${tokenA.address}`);

  // create an ERC20 Mock: TokenB
  const TokenB = await hre.ethers.getContractFactory("MockERC20");
  const tokenB = await TokenB.deploy(Constant.MCKB_NAME, Constant.MCKB_SYMBOL, Constant.TOKEN_INITIAL_SUPPLY);
  await tokenB.deployed();
  console.log(`TokenB deployed to ${tokenB.address}`);

  // create AAVEPoolAddressProvider Mock
  const MockAAVEPoolAddressesProvider = await hre.ethers.getContractFactory("MockAAVEPoolAddressesProvider");
  const mockAAVEPoolAddressesProvider = await MockAAVEPoolAddressesProvider.deploy();
  await mockAAVEPoolAddressesProvider.deployed();
  console.log(`MockAAVEPoolAddressesProvider deployed to ${mockAAVEPoolAddressesProvider.address}`);

  // create AAVEPool Mock
  const MockAavePool = await hre.ethers.getContractFactory("MockAavePool");
  const mockAavePool = await MockAavePool.deploy();
  await mockAavePool.deployed();
  console.log(`MockAavePool deployed to ${mockAavePool.address}`);

  //create aTockens associated to tokens (to get in same configuratio as real AAVE pool)
  await mockAavePool.createAToken(tokenA.address);
  await mockAavePool.createAToken(tokenB.address);
  console.log("ATokenA address : ", await mockAavePool.getReserveData(tokenA.address).aTokenAddress);
  console.log("ATokenB address : ", await mockAavePool.getReserveData(tokenB.address).aTokenAddress);


  // set AAVEPool Mock as Pool implementation
  await mockAAVEPoolAddressesProvider.setPoolImpl(mockAavePool.address);
  console.log(`AAVE Pool Implementation set to ${mockAavePool.address}`);

  // create ChainLinkAggregatorV3 mock
  const MockUniswapISwapRouter = await hre.ethers.getContractFactory("MockUniswapISwapRouter");
  const mockUniswapISwapRouter = await MockUniswapISwapRouter.deploy();
  await mockUniswapISwapRouter.deployed();
  console.log(`MockUniswapISwapRouter deployed to ${mockUniswapISwapRouter.address}`);

  // Create the output file name with the network prefix
  const fileName = `./scripts/lib/deployedContractAddresses.js`;

  // Write contract addresses to output file
  const output = `
    const DataStoragecontractAddress = "${dataStorage.address}";
    const DOAppcontractAddress = "${doApp.address}";
    const TokenAcontractAddress = "${tokenA.address}";
    const TokenBcontractAddress = "${tokenB.address}";
    const MockChainlinkcontractAddress = "${mockChainLinkAggregatorV3.address}";
    const MockAAVEPoolcontractAddress = "${mockAAVEPoolAddressesProvider.address}";
    const MockUniswapContractAddress = "${mockUniswapISwapRouter.address}";

    module.exports = {
      DataStoragecontractAddress,
      DOAppcontractAddress,
      TokenAcontractAddress,
      TokenBcontractAddress,
      MockChainlinkcontractAddress,
      MockAAVEPoolcontractAddress,
      MockUniswapContractAddress
  }
  
  `;

  fs.writeFileSync(fileName, output);

  console.log(`Contract addresses written to ${fileName}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
