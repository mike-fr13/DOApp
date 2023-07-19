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

  function pause() {
    return new Promise(resolve => {
        setTimeout(resolve, 5000); // Pause de 5 secondes (5000 millisecondes)
    });
  }


  async function addTokenPair(
    datastorecontract,
    tokenAAddress,
    tokenBAddress,
    tokenPairSegmentSize,
    tokenPairDecimalsNumber,
    mockChainLinkAggregatorV3Address,
    mockAAVEPoolAddressesProviderAddress,
    mockUniswapISwapRouterAddress
  ) {
    datastorecontract.addTokenPair(
      tokenAAddress,
      tokenPairSegmentSize,
      tokenPairDecimalsNumber,
      tokenBAddress,
      mockChainLinkAggregatorV3Address,
      mockAAVEPoolAddressesProviderAddress,
      mockUniswapISwapRouterAddress
    );
  }  

  async function mintToken(
    _tokenContract,
    _user, 
    _amount) {
    await (_tokenContract.mint(_user, _amount))
    console.log(`${_amount} token ${_tokenContract.address} mint for address ${_user}`)
  }

  async function depositToken(doAPPContract, pairId, _tokenContract, _user, _amount, dataStorage) {
    const userSigner = await ethers.provider.getSigner(_user);
    
    await (_tokenContract.connect(userSigner).approve(doAPPContract.address, _amount))
    await ( (doAPPContract.connect(userSigner)).depositTokenA(pairId, _amount))
    console.log(`Balance of ${_user} for token ${_tokenContract.address} : `  ,await ( (_tokenContract.balanceOf(_user))))
    console.log(`Balance of ${doAPPContract.address} for token ${_tokenContract.address} : `  ,await ( (_tokenContract.balanceOf(doAPPContract.address))))

    console.log('account1 doApp tokenA : ', (await dataStorage.connect(_user).getTokenPairUserBalances(pairId,_user)))
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
      Console.log (`DCA config added for pair${pairId} and user ${user}`)
  }


  
module.exports = {
  pause,
  getTokenPairs,
  getAbi,
  addTokenPair,
  mintToken,
  depositToken,
  addDCAConfig
}

