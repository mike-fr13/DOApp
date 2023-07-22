const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers')
const Constant = require("./Constants.js")
const isLogEnable = true;

async function deployDOApp_Fixture() {
  const isLogEnable = false
  const [owner, account1, account2, account3, account4, account5, account6] = await ethers.getSigners();
  isLogEnable ? console.log(`owner : ${owner.address}`):{}
  isLogEnable ? console.log(`account1 : ${account1.address}`):{}
  isLogEnable ? console.log(`account2 : ${account2.address}`):{}
  isLogEnable ? console.log(`account3 : ${account3.address}`):{}
  isLogEnable ? console.log(`account4 : ${account4.address}`):{}
  isLogEnable ? console.log(`account5 : ${account5.address}`):{}
  isLogEnable ? console.log(`account6 : ${account6.address}`):{}
  

  // deploy DOApp main contract
  const DataStorage = await ethers.getContractFactory('DataStorage');
  const dataStorage = await DataStorage.deploy();
  isLogEnable ? console.log(`dataStorage deployed to ${dataStorage.address} by account ${await(dataStorage.owner())}`):{}
  
  // deploy DOApp main contract
  const DOApp = await ethers.getContractFactory('DOApp');
  const doApp = await DOApp.deploy(false,dataStorage.address);
  isLogEnable ? console.log(`doApp deployed to ${doApp.address} by ${await(doApp.owner())}`):{}

  // create an ERC20 Mock : tokenA
  const TokenA = await ethers.getContractFactory('MockERC20');
  const tokenA = await TokenA.deploy(Constant.MCKA_NAME, Constant.MCKA_SYMBOL, Constant.TOKEN_INITIAL_SUPPLY);
  isLogEnable ? console.log(`DOApp deployed to ${tokenA.address}`):{}

  // create an ERC20 Mock : tokenB
  const TokenB = await ethers.getContractFactory('MockERC20');
  const tokenB = await TokenB.deploy(Constant.MCKB_NAME, Constant.MCKB_SYMBOL, Constant.TOKEN_INITIAL_SUPPLY);
  isLogEnable ? console.log(`tokenB deployed to ${tokenB.address}`):{}

  // create AAVEPoolAddressProvider Mock
  const MockAAVEPoolAddressesProvider = await ethers.getContractFactory('MockAAVEPoolAddressesProvider');
  const mockAAVEPoolAddressesProvider = await MockAAVEPoolAddressesProvider.deploy();
  isLogEnable ? console.log(`mockAAVEPoolAddressesProvider deployed to ${mockAAVEPoolAddressesProvider.address}`):{}

  // create AAVEPool Mock
  const MockAavePool = await ethers.getContractFactory('MockAavePool');
  const mockAavePool = await MockAavePool.deploy();
  isLogEnable ? console.log(`mockAavePool deployed to ${mockAavePool.address}`):{}

  //create aTockens associated to tokens (to get in same configuratio as real AAVE pool)
  await mockAavePool.createAToken(tokenA.address);
  await mockAavePool.createAToken(tokenB.address);

  isLogEnable ?console.log("ATokenA address : ", (await(mockAavePool.getReserveData(tokenA.address))).aTokenAddress):{};
  isLogEnable ?console.log("ATokenB address : ", (await(mockAavePool.getReserveData(tokenB.address))).aTokenAddress):{};

  //set AAVEPool Mock as Pool implementation 
  await mockAAVEPoolAddressesProvider.setPoolImpl(mockAavePool.address)

  //create ChainLinkAgggregatorV3  mock
  const MockChainLinkAggregatorV3 = await ethers.getContractFactory('MockChainLinkAggregatorV3');
  const mockChainLinkAggregatorV3 = await MockChainLinkAggregatorV3.deploy(Constant.ADDRESS_0, true);
  isLogEnable ? console.log(`mockChainLinkAggregatorV3 deployed to ${mockChainLinkAggregatorV3.address}`):{}

  //create ChainLinkAgggregatorV3  mock
  const MockUniswapISwapRouter = await ethers.getContractFactory('MockUniswapISwapRouter');
  const mockUniswapISwapRouter = await MockUniswapISwapRouter.deploy();
  isLogEnable ? console.log(`mockUniswapISwapRouter deployed to ${mockUniswapISwapRouter.address}`):{}

  return { doApp, dataStorage,tokenA, tokenB, mockChainLinkAggregatorV3, mockAAVEPoolAddressesProvider, mockAavePool, mockUniswapISwapRouter, owner, account1, account2, account3, account4, account5, account6 };
}

// deploy contracts and add a token Pair
async function deploy_AddATokenPair_Fixture() {
  //deploy contracts
  const { doApp, dataStorage,tokenA, tokenB, mockChainLinkAggregatorV3, mockAAVEPoolAddressesProvider, mockUniswapISwapRouter, owner, account1, account2, account3, account4, account5, account6}
    = await loadFixture(deployDOApp_Fixture);

  //add a token pair
  await dataStorage.addTokenPair(
    tokenA.address,
    Constant.TOKEN_PAIR_SEGMENT_SIZE,
    tokenB.address,
    mockChainLinkAggregatorV3.address,
    mockAAVEPoolAddressesProvider.address,
    mockUniswapISwapRouter.address)

  let eventFilter = dataStorage.filters.TokenPAirAdded()
  let events = await dataStorage.queryFilter(eventFilter, 'latest')
  let pairId = events[0].args[0]

  return { doApp, dataStorage,tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, account5, account6, pairId };
}

async function deploy_AddATokenPair_MinToken_Fixture() {
  // deploy contract, add a token pair and mint TokenA and TokenB for account1 to account3
  const { doApp, dataStorage, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, account5, account6, pairId }
    = await loadFixture(deploy_AddATokenPair_Fixture);

  //mint tokenA
  await tokenA.mint(account1.address, Constant.TOKEN_INITIAL_SUPPLY)
  await tokenA.mint(account2.address, Constant.TOKEN_INITIAL_SUPPLY)
  await tokenA.mint(account3.address, Constant.TOKEN_INITIAL_SUPPLY)
  await tokenA.mint(account4.address, Constant.TOKEN_INITIAL_SUPPLY)
  await tokenA.mint(account5.address, Constant.TOKEN_INITIAL_SUPPLY)
  await tokenA.mint(account6.address, Constant.TOKEN_INITIAL_SUPPLY)

  //mint tokenB
  await tokenB.mint(account1.address, Constant.TOKEN_INITIAL_SUPPLY)
  await tokenB.mint(account2.address, Constant.TOKEN_INITIAL_SUPPLY)
  await tokenB.mint(account3.address, Constant.TOKEN_INITIAL_SUPPLY)
  await tokenB.mint(account4.address, Constant.TOKEN_INITIAL_SUPPLY)
  await tokenB.mint(account5.address, Constant.TOKEN_INITIAL_SUPPLY)
  await tokenB.mint(account6.address, Constant.TOKEN_INITIAL_SUPPLY)

  return { doApp, dataStorage, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, account5, account6, pairId };
}

// deploy contract, add a token pair, mint TokenA and TokenB, deposit tokenA and token B in the pair for account1 to account3
//acount1 => deposit token A and token B
//acount2 => deposit token A only
//acount3 => deposit token B only

async function deploy_AddATokenPair_MinToken_DepositToken_Fixture() {
  //deploy contracts
  const { doApp, dataStorage, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, account5, account6, pairId }
    = await loadFixture(deploy_AddATokenPair_MinToken_Fixture);

  //account1 => deposit token A and token B
  await tokenA.connect(account1).approve(doApp.address, Constant.TOKENA_DEPOSIT_AMOUNT)
  await doApp.connect(account1).depositTokenA(pairId, Constant.TOKENA_DEPOSIT_AMOUNT)
  await tokenB.connect(account1).approve(doApp.address, Constant.TOKENB_DEPOSIT_AMOUNT)
  await doApp.connect(account1).depositTokenB(pairId, Constant.TOKENB_DEPOSIT_AMOUNT)

  //account2 => deposit token A only
  await tokenA.connect(account2).approve(doApp.address, Constant.TOKENA_DEPOSIT_AMOUNT)
  await doApp.connect(account2).depositTokenA(pairId, Constant.TOKENA_DEPOSIT_AMOUNT)

  //account3 => deposit token B only
  await tokenB.connect(account3).approve(doApp.address, Constant.TOKENB_DEPOSIT_AMOUNT)
  await doApp.connect(account3).depositTokenB(pairId, Constant.TOKENB_DEPOSIT_AMOUNT)

  //account4 => deposit A et B
  await tokenA.connect(account4).approve(doApp.address, Constant.TOKENA_DEPOSIT_AMOUNT)
  await doApp.connect(account4).depositTokenA(pairId, Constant.TOKENA_DEPOSIT_AMOUNT)
  await tokenB.connect(account4).approve(doApp.address, Constant.TOKENB_DEPOSIT_AMOUNT)
  await doApp.connect(account4).depositTokenB(pairId, Constant.TOKENB_DEPOSIT_AMOUNT)

  //account5 => deposit A et B
  await tokenA.connect(account5).approve(doApp.address, Constant.TOKENA_DEPOSIT_AMOUNT)
  await doApp.connect(account5).depositTokenA(pairId, Constant.TOKENA_DEPOSIT_AMOUNT)
  await tokenB.connect(account5).approve(doApp.address, Constant.TOKENB_DEPOSIT_AMOUNT)
  await doApp.connect(account5).depositTokenB(pairId, Constant.TOKENB_DEPOSIT_AMOUNT)

  //account6 => deposit A et B
  await tokenA.connect(account6).approve(doApp.address, Constant.TOKENA_DEPOSIT_AMOUNT)
  await doApp.connect(account6).depositTokenA(pairId, Constant.TOKENA_DEPOSIT_AMOUNT)
  await tokenB.connect(account6).approve(doApp.address, Constant.TOKENB_DEPOSIT_AMOUNT)
  await doApp.connect(account6).depositTokenB(pairId, Constant.TOKENB_DEPOSIT_AMOUNT)
    


  return { doApp, dataStorage, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, account5, account6, pairId };
}


async function deploy_Prepare_One_Buy_DCA_Config_Fixture() {
  //deploy contracts
  const { doApp, dataStorage, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, account5, account6, pairId }
    = await loadFixture(deploy_AddATokenPair_MinToken_DepositToken_Fixture);

  await dataStorage.connect(account1).addDCAConfig(
    pairId,
    Constant.DCA_CONFIG_1_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
    Constant.DCA_CONFIG_1_MIN,
    Constant.DCA_CONFIG_1_MAX,
    Constant.DCA_CONFIG_1_AMOUNT,
    Constant.DCA_CONFIG_1_SCALING_FACTOR,
    Constant.DCA_CONFIG_1_DELAY
  )
  return { doApp, dataStorage, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, account5, account6, pairId };
}

async function deploy_Prepare_One_Sell_DCA_Config_Fixture() {
  //deploy contracts
  const { doApp, dataStorage, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, account5, account6, pairId }
    = await loadFixture(deploy_AddATokenPair_MinToken_DepositToken_Fixture);

  await dataStorage.connect(account1).addDCAConfig(
    pairId,
    Constant.DCA_CONFIG_2_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
    Constant.DCA_CONFIG_2_MIN,
    Constant.DCA_CONFIG_2_MAX,
    Constant.DCA_CONFIG_2_AMOUNT,
    Constant.DCA_CONFIG_2_SCALING_FACTOR,
    Constant.DCA_CONFIG_2_DELAY
  )
  return { doApp, dataStorage, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, account5, account6, pairId };
}

async function deploy_Prepare_4_DCA_Config_Fixture() {
  //deploy contracts
  const {doApp, dataStorage, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, account5, account6, pairId }
    = await loadFixture(deploy_AddATokenPair_MinToken_DepositToken_Fixture);

  await dataStorage.connect(account1).addDCAConfig(
    pairId,
    Constant.DCA_CONFIG_1_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
    Constant.DCA_CONFIG_1_MIN,
    Constant.DCA_CONFIG_1_MAX,
    Constant.DCA_CONFIG_1_AMOUNT,
    Constant.DCA_CONFIG_1_SCALING_FACTOR,
    Constant.DCA_CONFIG_1_DELAY
  )


  await dataStorage.connect(account1).addDCAConfig(
    pairId,
    Constant.DCA_CONFIG_2_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
    Constant.DCA_CONFIG_2_MIN,
    Constant.DCA_CONFIG_2_MAX,
    Constant.DCA_CONFIG_2_AMOUNT,
    Constant.DCA_CONFIG_2_SCALING_FACTOR,
    Constant.DCA_CONFIG_2_DELAY
  )

  await dataStorage.connect(account2).addDCAConfig(
    pairId,
    Constant.DCA_CONFIG_3_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
    Constant.DCA_CONFIG_3_MIN,
    Constant.DCA_CONFIG_3_MAX,
    Constant.DCA_CONFIG_3_AMOUNT,
    Constant.DCA_CONFIG_3_SCALING_FACTOR,
    Constant.DCA_CONFIG_3_DELAY
  )

  await dataStorage.connect(account2).addDCAConfig(
    pairId,
    Constant.DCA_CONFIG_4_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
    Constant.DCA_CONFIG_4_MIN,
    Constant.DCA_CONFIG_4_MAX,
    Constant.DCA_CONFIG_4_AMOUNT,
    Constant.DCA_CONFIG_4_SCALING_FACTOR,
    Constant.DCA_CONFIG_4_DELAY
  )
  return { doApp, dataStorage, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, account5, account6, pairId };
}

async function deploy_Prepare_Multi_DCA_Config_Fixture() {
  //deploy contracts
  const {doApp, dataStorage, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, account5, account6, pairId }
    = await loadFixture(deploy_AddATokenPair_MinToken_DepositToken_Fixture);

  await dataStorage.connect(account1).addDCAConfig(
    pairId,
    Constant.DCA_CONFIG_1_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
    Constant.DCA_CONFIG_1_MIN,
    Constant.DCA_CONFIG_1_MAX,
    Constant.DCA_CONFIG_1_AMOUNT,
    Constant.DCA_CONFIG_1_SCALING_FACTOR,
    Constant.DCA_CONFIG_1_DELAY
  )


  await dataStorage.connect(account1).addDCAConfig(
    pairId,
    Constant.DCA_CONFIG_2_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
    Constant.DCA_CONFIG_2_MIN,
    Constant.DCA_CONFIG_2_MAX,
    Constant.DCA_CONFIG_2_AMOUNT,
    Constant.DCA_CONFIG_2_SCALING_FACTOR,
    Constant.DCA_CONFIG_2_DELAY
  )

  await dataStorage.connect(account2).addDCAConfig(
    pairId,
    Constant.DCA_CONFIG_3_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
    Constant.DCA_CONFIG_3_MIN,
    Constant.DCA_CONFIG_3_MAX,
    Constant.DCA_CONFIG_3_AMOUNT,
    Constant.DCA_CONFIG_3_SCALING_FACTOR,
    Constant.DCA_CONFIG_3_DELAY
  )

  await dataStorage.connect(account2).addDCAConfig(
    pairId,
    Constant.DCA_CONFIG_4_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
    Constant.DCA_CONFIG_4_MIN,
    Constant.DCA_CONFIG_4_MAX,
    Constant.DCA_CONFIG_4_AMOUNT,
    Constant.DCA_CONFIG_4_SCALING_FACTOR,
    Constant.DCA_CONFIG_4_DELAY
  )

  await dataStorage.connect(account3).addDCAConfig(
    pairId,
    Constant.DCA_CONFIG_5_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
    Constant.DCA_CONFIG_5_MIN,
    Constant.DCA_CONFIG_5_MAX,
    Constant.DCA_CONFIG_5_AMOUNT,
    Constant.DCA_CONFIG_5_SCALING_FACTOR,
    Constant.DCA_CONFIG_5_DELAY
  )

  await dataStorage.connect(account3).addDCAConfig(
    pairId,
    Constant.DCA_CONFIG_6_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
    Constant.DCA_CONFIG_6_MIN,
    Constant.DCA_CONFIG_6_MAX,
    Constant.DCA_CONFIG_6_AMOUNT,
    Constant.DCA_CONFIG_6_SCALING_FACTOR,
    Constant.DCA_CONFIG_6_DELAY
  )

  await dataStorage.connect(account4).addDCAConfig(
    pairId,
    Constant.DCA_CONFIG_7_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
    Constant.DCA_CONFIG_7_MIN,
    Constant.DCA_CONFIG_7_MAX,
    Constant.DCA_CONFIG_7_AMOUNT,
    Constant.DCA_CONFIG_7_SCALING_FACTOR,
    Constant.DCA_CONFIG_7_DELAY
  )

  await dataStorage.connect(account4).addDCAConfig(
    pairId,
    Constant.DCA_CONFIG_8_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
    Constant.DCA_CONFIG_8_MIN,
    Constant.DCA_CONFIG_8_MAX,
    Constant.DCA_CONFIG_8_AMOUNT,
    Constant.DCA_CONFIG_8_SCALING_FACTOR,
    Constant.DCA_CONFIG_8_DELAY
  )

  await dataStorage.connect(account5).addDCAConfig(
    pairId,
    Constant.DCA_CONFIG_9_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
    Constant.DCA_CONFIG_9_MIN,
    Constant.DCA_CONFIG_9_MAX,
    Constant.DCA_CONFIG_9_AMOUNT,
    Constant.DCA_CONFIG_9_SCALING_FACTOR,
    Constant.DCA_CONFIG_9_DELAY
  )

  await dataStorage.connect(account6).addDCAConfig(
    pairId,
    Constant.DCA_CONFIG_10_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
    Constant.DCA_CONFIG_10_MIN,
    Constant.DCA_CONFIG_10_MAX,
    Constant.DCA_CONFIG_10_AMOUNT,
    Constant.DCA_CONFIG_10_SCALING_FACTOR,
    Constant.DCA_CONFIG_10_DELAY
  )


  return { doApp, dataStorage, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, account5, account6, pairId };
}
  

module.exports = {
  deployDOApp_Fixture,
  deploy_AddATokenPair_Fixture,
  deploy_AddATokenPair_MinToken_Fixture,
  deploy_AddATokenPair_MinToken_DepositToken_Fixture,
  deploy_Prepare_One_Buy_DCA_Config_Fixture,
  deploy_Prepare_One_Sell_DCA_Config_Fixture,
  deploy_Prepare_4_DCA_Config_Fixture,
  deploy_Prepare_Multi_DCA_Config_Fixture
  
}
