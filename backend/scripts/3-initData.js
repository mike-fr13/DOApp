const hre = require("hardhat");
const Constant = require("../test/lib/Constants.js");
const { pause, getAbi, getTokenPairs, addTokenPair, mintToken, depositToken, addDCAConfig} = require("./lib/DOApp_lib.js");

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
    DataStoragecontractAddress,
    DOAppcontractAddress, 
    TokenAcontractAddress, 
    TokenBcontractAddress, 
    MockChainlinkcontractAddress, 
    MockAAVEPoolcontractAddress, 
    MockUniswapContractAddress, 
   } = require ("./lib/deployedContractAddresses.js")

    console.log("DataStoragecontractAddress", DataStoragecontractAddress)
    console.log ("DOAppcontractAddress : ", DOAppcontractAddress)
    console.log ("TokenAcontractAddress : ", TokenAcontractAddress)
    console.log ("TokenBcontractAddress : ", TokenBcontractAddress)
    console.log ("MockChainlinkcontractAddress : ", MockChainlinkcontractAddress)
    console.log ("MockUniswapContractAddress : ", MockUniswapContractAddress)
  

  const ADD_owner ="0x0699b6F7e3ab7Be573cec92F43c12F8f567C03eE"
  const ADD_account1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const ADD_account2 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
  const ADD_account3 = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
  const ADD_account4 = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";
  const ADD_account5 = "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc";
  const ADD_account6 = "0x976EA74026E726554dB657fA54763abd0C3a0aa9";

  const doAPPABI = getAbi("DOApp");
  //console.log(doAPPABI);
  const { ethers } = require("hardhat");
  const provider = ethers.provider;
  const owner = provider.getSigner(ADD_owner);
  const doAPP = new ethers.Contract(DOAppcontractAddress, doAPPABI, owner);

  const dataStorageABI = getAbi("DataStorage");
  //console.log(dataStorageABI);
  const dataStorage = new ethers.Contract(DataStoragecontractAddress, dataStorageABI, owner);

  const mockERC20ABI = getAbi("MockERC20","mocks/");
  //console.log(mockERC20ABI);
  const tokenA = new ethers.Contract(TokenAcontractAddress, mockERC20ABI, owner);
  const tokenB = new ethers.Contract(TokenBcontractAddress, mockERC20ABI, owner);

  
  await addTokenPair(
    dataStorage,
    TokenAcontractAddress,
    TokenBcontractAddress,
    Constant.TOKEN_PAIR_SEGMENT_SIZE,
    MockChainlinkcontractAddress,
    MockAAVEPoolcontractAddress,
    MockUniswapContractAddress
  );
  
  await pause(5000);

  pairIds = await getTokenPairs(dataStorage)
  console.log("pairIds : ", pairIds)

  await depositToken(
    doAPP, 
    pairIds[0], 
    tokenA, 
    ADD_account1, 
    Constant.TOKENA_DEPOSIT_AMOUNT,
    dataStorage
  )  

  await addDCAConfig(
    dataStorage,
    ADD_owner,
    pairIds[0],
    Constant.DCA_CONFIG_1_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
    Constant.DCA_CONFIG_1_MIN,
    Constant.DCA_CONFIG_1_MAX,
    Constant.DCA_CONFIG_1_AMOUNT,
    Constant.DCA_CONFIG_1_SCALING_FACTOR,
    Constant.DCA_CONFIG_1_DELAY
    )
    
    await addDCAConfig(
      dataStorage,
      ADD_account1,
      pairIds[0],
      Constant.DCA_CONFIG_1_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
      Constant.DCA_CONFIG_1_MIN,
      Constant.DCA_CONFIG_1_MAX,
      Constant.DCA_CONFIG_1_AMOUNT,
      Constant.DCA_CONFIG_1_SCALING_FACTOR,
      Constant.DCA_CONFIG_1_DELAY
    )
    await addDCAConfig(
      dataStorage,
      ADD_account1,
      pairIds[0],
      Constant.DCA_CONFIG_2_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
      Constant.DCA_CONFIG_2_MIN,
      Constant.DCA_CONFIG_2_MAX,
      Constant.DCA_CONFIG_2_AMOUNT,
      Constant.DCA_CONFIG_2_SCALING_FACTOR,
      Constant.DCA_CONFIG_2_DELAY
    )
    await addDCAConfig(
      dataStorage,
      ADD_account2,
      pairIds[0],
      Constant.DCA_CONFIG_3_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
      Constant.DCA_CONFIG_3_MIN,
      Constant.DCA_CONFIG_3_MAX,
      Constant.DCA_CONFIG_3_AMOUNT,
      Constant.DCA_CONFIG_3_SCALING_FACTOR,
      Constant.DCA_CONFIG_3_DELAY
    )
    await addDCAConfig(
      dataStorage,
      ADD_account2,
      pairIds[0],
      Constant.DCA_CONFIG_4_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
      Constant.DCA_CONFIG_4_MIN,
      Constant.DCA_CONFIG_4_MAX,
      Constant.DCA_CONFIG_4_AMOUNT,
      Constant.DCA_CONFIG_4_SCALING_FACTOR,
      Constant.DCA_CONFIG_4_DELAY
    )
      await addDCAConfig(
      dataStorage,
      ADD_account3,
      pairIds[0],
      Constant.DCA_CONFIG_5_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
      Constant.DCA_CONFIG_5_MIN,
      Constant.DCA_CONFIG_5_MAX,
      Constant.DCA_CONFIG_5_AMOUNT,
      Constant.DCA_CONFIG_5_SCALING_FACTOR,
      Constant.DCA_CONFIG_5_DELAY
    )
    await addDCAConfig(
      dataStorage,
      ADD_account3,
      pairIds[0],
      Constant.DCA_CONFIG_6_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
      Constant.DCA_CONFIG_6_MIN,
      Constant.DCA_CONFIG_6_MAX,
      Constant.DCA_CONFIG_6_AMOUNT,
      Constant.DCA_CONFIG_6_SCALING_FACTOR,
      Constant.DCA_CONFIG_6_DELAY
    )
    await addDCAConfig(
      dataStorage,
      ADD_account4,
      pairIds[0],
      Constant.DCA_CONFIG_7_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
      Constant.DCA_CONFIG_7_MIN,
      Constant.DCA_CONFIG_7_MAX,
      Constant.DCA_CONFIG_7_AMOUNT,
      Constant.DCA_CONFIG_7_SCALING_FACTOR,
      Constant.DCA_CONFIG_7_DELAY
    )
    await addDCAConfig(
      dataStorage,
      ADD_account4,
      pairIds[0],
      Constant.DCA_CONFIG_8_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
      Constant.DCA_CONFIG_8_MIN,
      Constant.DCA_CONFIG_8_MAX,
      Constant.DCA_CONFIG_8_AMOUNT,
      Constant.DCA_CONFIG_8_SCALING_FACTOR,
      Constant.DCA_CONFIG_8_DELAY
    )
    await addDCAConfig(
      dataStorage,
      ADD_account5,
      pairIds[0],
      Constant.DCA_CONFIG_9_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
      Constant.DCA_CONFIG_9_MIN,
      Constant.DCA_CONFIG_9_MAX,
      Constant.DCA_CONFIG_9_AMOUNT,
      Constant.DCA_CONFIG_9_SCALING_FACTOR,
      Constant.DCA_CONFIG_9_DELAY
    )
    await addDCAConfig(
      dataStorage,
      ADD_account6,
      pairIds[0],
      Constant.DCA_CONFIG_10_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
      Constant.DCA_CONFIG_10_MIN,
      Constant.DCA_CONFIG_10_MAX,
      Constant.DCA_CONFIG_10_AMOUNT,
      Constant.DCA_CONFIG_10_SCALING_FACTOR,
      Constant.DCA_CONFIG_10_DELAY
    )
  }

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
