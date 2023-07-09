const hre = require("hardhat");

async function main() {
 
  const DOApp = await hre.ethers.getContractFactory("DOApp");
  const doApp = await DOApp.deploy();
  await doApp.deployed();
  console.log(
    `DOApp deployed to ${doApp.address}`
  );

  const MockChainLinkAggregatorV3 = await hre.ethers.getContractFactory("PriceFetcher");
  const mockChainLinkAggregatorV3 = await MockChainLinkAggregatorV3.deploy();
  await mockChainLinkAggregatorV3.deployed();
  console.log(
    `MockChainLinkAggregatorV3 deployed to ${mockChainLinkAggregatorV3.address}`
  );


  const PriceFetcher = await hre.ethers.getContractFactory("PriceFetcher");
  const priceFetcher = await PriceFetcher.deploy();
  await priceFetcher.deployed();
  console.log(
    `PriceFetcher deployed to ${priceFetcher.address}`
  );



}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
