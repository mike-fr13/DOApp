const fs = require("fs")
const path = require("path")

const getAbi = (contractName, folder) => {
  try {

    let filePath = `../../artifacts/contracts/${folder ? `${folder}/` : ''}${contractName}.sol/${contractName}.json`;


    const dir = path.resolve(
      __dirname,
      filePath
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
    const filter = dataStorage.filters.TokenPAirAdded(null);
    const events = await dataStorage.queryFilter(filter, 0);

    const pairIds = [];

    events.forEach((event) => {
        pairIds.push(event.args._pairId);
      });

    return pairIds;
  }

async function getDCAConfigs(dataStorage) {
  const filter = dataStorage.filters.DCAConfigCreation(null, null, null);
  const events = await dataStorage.queryFilter(filter, 0);

  const dcaConfigs = [];

  events.forEach((event) => {
    dcaConfigs.push(event.args._configId);
    });

    return dcaConfigs;
}

async function getlastPairDCAExecutionResultEvent(_doApp, _pairId) {
  const [owner, account1, account2, account3, account4] = await ethers.getSigners();

  const currentBlockNumber = await ethers.provider.getBlockNumber();
  const fromBlockNumber = currentBlockNumber - 1; // to get the last two blocks
  const filter = _doApp.filters.PairDCAExecutionResult(_pairId, null, null, null, null);
  const events = await _doApp.queryFilter(filter, fromBlockNumber);
  const lastEvent = events[events.length - 1];

  //console.log(lastEvent)

  return lastEvent;
}

function pause(x) {
  return new Promise(resolve => {
      setTimeout(resolve, x); // Pause de 5 secondes (5000 millisecondes)
  });
}


async function addTokenPair(
  datastorecontract,
  tokenAAddress,
  tokenBAddress,
  tokenPairSegmentSize,
  mockChainLinkAggregatorV3Address,
  mockAAVEPoolAddressesProviderAddress,
  mockUniswapISwapRouterAddress
) {
  console.log('addTokenPair - start');

  datastorecontract.addTokenPair(
    tokenAAddress,
    tokenPairSegmentSize,
    tokenBAddress,
    mockChainLinkAggregatorV3Address,
    mockAAVEPoolAddressesProviderAddress,
    mockUniswapISwapRouterAddress
  );
  pair = getTokenPairs(datastorecontract) 
  console.log(`addTokenPair - Token Pair added : ${pair.configId}`);
}  

async function mintToken(
  _tokenContract,
  _user, 
  _amount) {
    console.log('mintToken - start ');
    await (_tokenContract.mint(_user, _amount))
    console.log(`mintToken - ${_amount} token ${_tokenContract.address} mint for address ${_user}`)
}

async function depositToken(doAPPContract, pairId, _tokenContract, _user, _amount, dataStorage) {
  console.log('depositToken - start ')

  const userSigner = await ethers.provider.getSigner(_user);
  
  await (_tokenContract.connect(userSigner).approve(doAPPContract.address, _amount))
  await ( (doAPPContract.connect(userSigner)).depositTokenA(pairId, _amount))
  console.log(`Balance of ${_user} for token ${_tokenContract.address} : `  ,await ( (_tokenContract.balanceOf(_user))))
  console.log(`Balance of ${doAPPContract.address} for token ${_tokenContract.address} : `  ,await ( (_tokenContract.balanceOf(doAPPContract.address))))

  console.log('depositToken - account1 doApp tokenA : ', (await doAPPContract.connect(_user).getTokenUserBalances(_tokenContract.address,_user)))
}

async function addDCAConfig(
  dataStorage,
  user, 
  pairId, 
  swapAToB, 
  min, 
  max, 
  amount,
  scalingFactor,
  delay
  ) {
    console.log("addDCAConfig - Starting DCA Config creation")
    const userSigner = await ethers.provider.getSigner(user);
    dataStorage.connect(userSigner).addDCAConfig(
    pairId,
    swapAToB, 
    min, 
    max, 
    amount,
    scalingFactor,
    delay
    )
    console.log (`addDCAConfig - DCA config added for pair${pairId} and user ${user}`)
}


  
module.exports = {
  pause,
  getTokenPairs,
  getDCAConfigs,
  getlastPairDCAExecutionResultEvent,
  getAbi,
  addTokenPair,
  mintToken,
  depositToken,
  addDCAConfig
}

