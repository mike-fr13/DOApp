const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers')
const { expect } = require('chai')
const { BigNumber } = require('ethers')
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');

const ADDRESS_0 = '0x0000000000000000000000000000000000000000'
const MCKA_NAME = 'Mock Token A'
const MCKA_SYMBOL = 'MCKA'
const MCKB_NAME = 'Mock Token B'
const MCKB_SYMBOL = 'MCKB'
const INITIAL_SUPPLY = new BigNumber.from(1000)
const TOKENA_DEPOSIT_AMOUNT = new BigNumber.from(200)
const TOKENB_DEPOSIT_AMOUNT = new BigNumber.from(33)
const AMOUNT_ABOVE_BALANCE =  new BigNumber.from(9999)
const BAD_PAIR_ID = new BigNumber.from('01010101010')

describe('DOApp', function () {

  async function deployDOAppFixture() {
    const [owner, account1, account2, account3, account4] = await ethers.getSigners();
    const DOApp = await ethers.getContractFactory('DOApp');
    const dOApp = await DOApp.deploy();

    const TokenA = await ethers.getContractFactory('MockERC20');
    const tokenA = await TokenA.deploy(MCKA_NAME,MCKA_SYMBOL,INITIAL_SUPPLY);

    const TokenB = await ethers.getContractFactory('MockERC20');
    const tokenB = await TokenB.deploy(MCKB_NAME,MCKB_SYMBOL,INITIAL_SUPPLY);

    const MockChainLinkAggregatorV3 = await ethers.getContractFactory('MockChainLinkAggregatorV3');
    const mockChainLinkAggregatorV3 = await MockChainLinkAggregatorV3.deploy(ADDRESS_0,true);

    return { dOApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4 };
  }

  // deploy contracts and add a token Pari
  async function deployDOAppFixtureAndAddATokenPair() {
    //deploy contracts
    const { dOApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
    = await loadFixture(deployDOAppFixture);
    
    //add a token pair
    await dOApp.addTokenPair(tokenA.address, tokenB.address, mockChainLinkAggregatorV3.address)

    let eventFilter = dOApp.filters.TokenPAirAdded()
    let events = await dOApp.queryFilter(eventFilter, 'latest')
    let pairId = events[0].args[0]
    
    //TODO à supprimer
    await tokenA.mint(owner.address,INITIAL_SUPPLY)


    return { dOApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId};

  }
  // deploy contract, add a token pair and mint TokenA and TokenB for account1 to account3
  async function deployDOAppFixtureAddATokenPairDepositToken() {
    //deploy contracts
    const { dOApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId} 
    = await loadFixture(deployDOAppFixtureAndAddATokenPair);
    
    //mint tokenA
    await tokenA.mint(account1.address,INITIAL_SUPPLY)
    await tokenA.mint(account2.address,INITIAL_SUPPLY)
    await tokenA.mint(account3.address,INITIAL_SUPPLY)

    //mint tokenB
    await tokenB.mint(account1.address,INITIAL_SUPPLY)
    await tokenB.mint(account2.address,INITIAL_SUPPLY)
    await tokenB.mint(account3.address,INITIAL_SUPPLY)

    return { dOApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId};

  }



  // Test contract deployment
  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      const { dOApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
        = await loadFixture(deployDOAppFixture);
      expect(await dOApp.owner()).to.equal(owner.address);
    })
  })

  //test token Pair management
  describe('Token Pair Management', function () {
    it('Should add a token Pair', async function () {
      const {dOApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
        = await loadFixture(deployDOAppFixture);
      //console.log("tokenA : ", tokenA.address);
      //console.log("tokenB : ", tokenB.address);
      await expect(dOApp.addTokenPair(tokenA.address, tokenB.address, mockChainLinkAggregatorV3.address))
        .to.emit(dOApp,'TokenPAirAdded').withArgs(anyValue, tokenA.address, tokenB.address, mockChainLinkAggregatorV3.address)

      let eventFilter = dOApp.filters.TokenPAirAdded()
      let events = await dOApp.queryFilter(eventFilter, 'latest')
      let hashOfPair = events[0].args[0]
      //console.log("hashPair : ",hashOfPair)
      let tokenPair = await dOApp.tokenPairs(hashOfPair)
      //console.log(tokenPair)
      expect (tokenPair.TokenAddressA).to.equal(tokenA.address)
      expect (tokenPair.TokenAddressB).to.equal(tokenB.address)
      expect (tokenPair.ChainlinkPriceFetcher).to.equal(mockChainLinkAggregatorV3.address)
      expect (tokenPair.enabled).to.be.false
    })

    it('Should revert when trying to add a pair with a null tokenA address', async function () {
      const {dOApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
        = await loadFixture(deployDOAppFixture);
      await expect(dOApp.addTokenPair(ADDRESS_0, tokenB.address, mockChainLinkAggregatorV3.address))
                    .to.be.revertedWith('tokenA address must be defined')
    })

    it('Should revert when trying to add a pair with a null tokenB address', async function () {
      const {dOApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
        = await loadFixture(deployDOAppFixture);
      await expect(dOApp.addTokenPair(tokenA.address,ADDRESS_0, mockChainLinkAggregatorV3.address))
                    .to.be.revertedWith('tokenB address must be defined')
    })
  })


  //Token Deposit tests
  describe('Token Deposit', function () {
    it('Should Revert when trying to deposit TokenA to an unknow token pair (pairId)', async function () {
      const {dOApp} 
        = await loadFixture(deployDOAppFixtureAddATokenPairDepositToken);
      await expect(dOApp.depositTokenA(BAD_PAIR_ID, 1))
                    .to.be.revertedWith('Token Pair not Found')
    })

    it('Should Revert when trying to deposit TokenB to an unknow token pair (pairId)', async function () {
      const {dOApp} 
        = await loadFixture(deployDOAppFixtureAddATokenPairDepositToken);
      await expect(dOApp.depositTokenB(BAD_PAIR_ID, 1))
                    .to.be.revertedWith('Token Pair not Found')
    })

    it('Should Revert when trying to deposit zero TokenA', async function () {
      const {dOApp, pairId} 
        = await loadFixture(deployDOAppFixtureAddATokenPairDepositToken);
      await expect(dOApp.depositTokenA(pairId, 0))
                    .to.be.revertedWith('Deposit amount should be > 0')
    })

    it('Should Revert when trying to deposit zero TokenB', async function () {
      const {dOApp, pairId} 
        = await loadFixture(deployDOAppFixtureAddATokenPairDepositToken);
      await expect(dOApp.depositTokenA(pairId, 0))
                    .to.be.revertedWith('Deposit amount should be > 0')
    })

    it('Should be able to deposit a specified amount of token A', async function () {
      const {dOApp, tokenA, owner, account1, pairId} = await loadFixture(deployDOAppFixtureAddATokenPairDepositToken);
      /*
      console.log('dOApp address : ',dOApp.address)
      console.log('account1 address : ',account1.address)
      console.log('account1 tokenA balance : ',await tokenA.balanceOf(account1.address))
      console.log('pairId : ',pairId)
      console.log('token pair  : ',await dOApp.tokenPairs(pairId))
      console.log('tokenA.address : ',tokenA.address)
      console.log('account1 tokenA allowance for dOApp : ',await tokenA.allowance(account1.address,dOApp.address))
      */
      

      console.log('account1 tokenA balance : ',await tokenA.balanceOf(account1.address))
      console.log ('dOApp balance : ', await(dOApp.connect(owner).getTokenBalances(pairId)));

      await (tokenA.connect(account1).approve(dOApp.address, TOKENA_DEPOSIT_AMOUNT))
      //console.log('account1 tokenA allowance for dOApp after approve : ',await tokenA.allowance(account1.address,dOApp.address))
      await ( (dOApp.connect(account1)).depositTokenA(pairId, TOKENA_DEPOSIT_AMOUNT))
      expect(await tokenA.balanceOf(account1.address)).to.be.equals(INITIAL_SUPPLY - TOKENA_DEPOSIT_AMOUNT)

      console.log('account1 tokenA balance : ',await tokenA.balanceOf(account1.address))
      console.log ('dOApp balance : ', await(dOApp.connect(owner).getTokenBalances(pairId)));

      let eventFilter = dOApp.filters.TokenDeposit()
      let events = await dOApp.queryFilter(eventFilter, 'latest')
      console.log(events)

    })

    it('Should Deposit a specified amount of token B', async function () {
      const {dOApp,  tokenB, owner, account1, pairId} = await loadFixture(deployDOAppFixtureAddATokenPairDepositToken);

      console.log('account1 tokenB balance : ',await tokenB.balanceOf(account1.address))
      console.log ('dOApp balance : ', await(dOApp.connect(owner).getTokenBalances(pairId)));

      await tokenB.connect(account1).approve(dOApp.address, TOKENB_DEPOSIT_AMOUNT)
      await dOApp.connect(account1).depositTokenB(pairId, TOKENB_DEPOSIT_AMOUNT)
      expect(await tokenB.balanceOf(account1.address)).to.be.equals(INITIAL_SUPPLY - TOKENB_DEPOSIT_AMOUNT)

      console.log('account1 tokenB balance : ',await tokenB.balanceOf(account1.address))
      console.log ('dOApp balance : ', await(dOApp.connect(owner).getTokenBalances(pairId)));

    })
  })

  //Token Withdraw tests
  describe('Token Withdraw', function () {

    it('Should Revert when trying to withdraw TokenA from an unknow token pair (pairId)', async function () {
      const {dOApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId} 
        = await loadFixture(deployDOAppFixtureAddATokenPairDepositToken);
      await expect(dOApp.withdrawTokenA(BAD_PAIR_ID, 1))
                    .to.be.revertedWith('Token Pair not Found')
    })

    it('Should Revert when trying to withdraw TokenB from an unknow token pair (pairId)', async function () {
      const {dOApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId} 
        = await loadFixture(deployDOAppFixtureAddATokenPairDepositToken);
      await expect(dOApp.withdrawTokenB(BAD_PAIR_ID, 1))
                    .to.be.revertedWith('Token Pair not Found')
    })

    it('Should Revert when trying to withdraw zero TokenA', async function () {
      const {dOApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId} 
        = await loadFixture(deployDOAppFixtureAddATokenPairDepositToken);
      await expect(dOApp.withdrawTokenA(pairId, 0))
                    .to.be.revertedWith('Withdraw amount should be > 0')
    })

    it('Should Revert when trying to withdraw zero TokenB', async function () {
      const {dOApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId} 
        = await loadFixture(deployDOAppFixtureAddATokenPairDepositToken);
      await expect(dOApp.withdrawTokenB(pairId, 0))
                    .to.be.revertedWith('Withdraw amount should be > 0')
    })

    it('Should Revert when trying to withdraw Token A with amount > account balance', async function () {
      const {dOApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId} 
        = await loadFixture(deployDOAppFixtureAndAddATokenPair);
      await expect(dOApp.withdrawTokenA(pairId, AMOUNT_ABOVE_BALANCE))
                    .to.be.revertedWith('Amount to withdraw should be < your account balance')
    })

    it('Should Revert when trying to withdraw token B with amount > account balance', async function () {
      const {dOApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId} 
        = await loadFixture(deployDOAppFixtureAndAddATokenPair);
      await expect(dOApp.withdrawTokenB(pairId, AMOUNT_ABOVE_BALANCE))
                    .to.be.revertedWith('Amount to withdraw should be < your account balance')
    })

  })




  /*
  describe("Withdrawals", function () {
  
    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { dOApp } = await loadFixture(deployDOAppFixture);

        await expect(dOApp.withdrawUSDT(BigInt(100)))
          .to.emit(dOApp, "Withdrawal")
          .withArgs(BigInt(100), anyValue); // We accept any value as `when` arg

        await expect(dOApp.withdrawETH(BigInt(100)))
          .to.emit(dOApp, "With      await expect(dOApp.addTokenPair(tokenA.address,ADDRESS_0, mockChainLinkAggregatorV3.address))
                    .to.be.revertedWith("tokenB address must be defined")
drawal")
          .withArgs(BigInt(100), anyValue); // We accept any value as `when` arg

        await expect(dOApp.executeDCA())
          .to.emit(dOApp, "DCAExecution")
          .withArgs(anyValue, anyValue); // We accept any value as `when` arg"owner tokenB balance : ",
      });
    });
  });

  describe("ExecuteDCA", function () {
  
    describe("Events", function () {
      it("Should emit an event on DCA Execution", async function () {
        const { dOApp } = await loadFixture(deployDOAppFixture);

        await expect(dOApp.executeDCA())
          .to.emit(dOApp, "DCAExecution")
          .withArgs(anyValue, anyValue); 
      });
    });
  });
  */     
});
