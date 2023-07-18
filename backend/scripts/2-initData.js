const hre = require("hardhat");
const Constant = require("../test/lib/Constants.js");
const { getDoAppAbi, addTokenPair } = require("./lib/DOApp_lib.js");

async function main() {
  const network = hre.network.name;

 // Check if the network name is provided
 if ((!network)||(network =="hardhat")) {
    console.error("Please specify the deployment network name (e.g., localhost, rinkeby, mainnet)");
    console.error("We do not auhtorize the default hardhat network to avoid deployment misstake and waste of time");
    return;
  } else {
    console.log (`Deployment on network : ${network}`);
  }

  const {
    DOAppcontractAddress, 
    TokenAcontractAddress, 
    TokenBcontractAddress, 
    MockChainlinkcontractAddress, 
    MockAAVEPoolcontractAddress, 
    MockUniswapContractAddress, 
    ADD_owner } = require ("./lib/deployedContractAddresses.js")

    console.log ("DOAppcontractAddress : ", DOAppcontractAddress)
    console.log ("TokenAcontractAddress : ", TokenAcontractAddress)
    console.log ("TokenBcontractAddress : ", TokenBcontractAddress)
    console.log ("MockChainlinkcontractAddress : ", MockChainlinkcontractAddress)
    console.log ("MockUniswapContractAddress : ", MockUniswapContractAddress)
  

  const ADD_account1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const ADD_account2 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
  const ADD_account3 = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
  const ADD_account4 = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";
  const ADD_account5 = "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc";
  const ADD_account6 = "0x976EA74026E726554dB657fA54763abd0C3a0aa9";

  const doAPPABI = getDoAppAbi();
  //console.log(doAPPABI);
  const { ethers } = require("hardhat");
  const provider = ethers.provider;
  const owner = provider.getSigner(ADD_owner);
  const doAPP = new ethers.Contract(DOAppcontractAddress, doAPPABI, owner);

  //const account1Signer = await doAPP.provider.getSigner(ADD_account1);

  
  await addTokenPair(
    doAPP,
    TokenAcontractAddress,
    TokenBcontractAddress,
    Constant.TOCKEN_PAIR_SEGMENT_SIZE,
    Constant.TOCKEN_PAIR_DECIMAL_NUMBER,
    MockChainlinkcontractAddress,
    MockAAVEPoolcontractAddress,
    MockUniswapContractAddress
  );
  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
