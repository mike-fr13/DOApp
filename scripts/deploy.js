const hre = require("hardhat");

async function main() {

  const DexDCA = await hre.ethers.getContractFactory("DexDCA");
  const dexDCA = await DexDCA.deploy();

  await dexDCA.deployed();

  console.log(
    `DexDCA deployed to ${dexDCA.address}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
