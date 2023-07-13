const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers')
const { expect } = require('chai')
const { BigNumber } = require('ethers')
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');

const ADDRESS_0 = '0x0000000000000000000000000000000000000000'
const MCKA_NAME = 'Mock Token A'
const MCKA_SYMBOL = 'MCKA'
const MCKB_NAME = 'Mock Token B'
const MCKB_SYMBOL = 'MCKB'
const BAD_PAIR_ID = new BigNumber.from('01010101010')

//token pair constante
TOCKENA_SEGMENT_SIZE = 10
TOCKENA_DECIMAL_NUMBER = 0

TOCKENB_SEGMENT_SIZE = 10
TOCKENB_DECIMAL_NUMBER = 2

//TOKEN amount constants
const TOKEN_INITIAL_SUPPLY = new BigNumber.from(1000)
const TOKENA_DEPOSIT_AMOUNT = new BigNumber.from(500)
const TOKENA_WITHDRAW_AMOUNT = new BigNumber.from(300)
const TOKENB_DEPOSIT_AMOUNT = new BigNumber.from(250)
const TOKENB_WITHDRAW_AMOUNT = new BigNumber.from(250)
const TOKEN_AMOUNT_ABOVE_BALANCE =  new BigNumber.from(9999)



// DOApp contract Tests
describe('DOApp Contract tests', function () {

  async function deployDOApp_Fixture() {
    const [owner, account1, account2, account3, account4] = await ethers.getSigners();
    const DOApp = await ethers.getContractFactory('DOApp');
    const doApp = await DOApp.deploy();

    const TokenA = await ethers.getContractFactory('MockERC20');
    const tokenA = await TokenA.deploy(MCKA_NAME,MCKA_SYMBOL,TOKEN_INITIAL_SUPPLY);

    const TokenB = await ethers.getContractFactory('MockERC20');
    const tokenB = await TokenB.deploy(MCKB_NAME,MCKB_SYMBOL,TOKEN_INITIAL_SUPPLY);

    const MockChainLinkAggregatorV3 = await ethers.getContractFactory('MockChainLinkAggregatorV3');
    const mockChainLinkAggregatorV3 = await MockChainLinkAggregatorV3.deploy(ADDRESS_0,true);

    return { doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4 };
  }

  // deploy contracts and add a token Pair
  async function deploy_AddATokenPair_Fixture() {
    //deploy contracts
    const { doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
    = await loadFixture(deployDOApp_Fixture);
    
    //add a token pair
    await doApp.addTokenPair(tokenA.address, TOCKENA_SEGMENT_SIZE, TOCKENA_DECIMAL_NUMBER,
                             tokenB.address, TOCKENB_SEGMENT_SIZE, TOCKENB_DECIMAL_NUMBER,
                             mockChainLinkAggregatorV3.address)

    let eventFilter = doApp.filters.TokenPAirAdded()
    let events = await doApp.queryFilter(eventFilter, 'latest')
    let pairId = events[0].args[0]
    
    return { doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId};
  }

  // deploy contract, add a token pair and mint TokenA and TokenB for account1 to account3
  async function deploy_AddATokenPair_MinToken_Fixture() {
    //deploy contracts
    const { doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId} 
    = await loadFixture(deploy_AddATokenPair_Fixture);
    
    //mint tokenA
    await tokenA.mint(account1.address,TOKEN_INITIAL_SUPPLY)
    await tokenA.mint(account2.address,TOKEN_INITIAL_SUPPLY)
    await tokenA.mint(account3.address,TOKEN_INITIAL_SUPPLY)

    //mint tokenB
    await tokenB.mint(account1.address,TOKEN_INITIAL_SUPPLY)
    await tokenB.mint(account2.address,TOKEN_INITIAL_SUPPLY)
    await tokenB.mint(account3.address,TOKEN_INITIAL_SUPPLY)

    return { doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId};
  }

  // deploy contract, add a token pair, mint TokenA and TokenB, deposit tokenA and token B in the pair for account1 to account3
  //acount1 => deposit token A and token B
  //acount2 => deposit token A only
  //acount3 => deposit token B only
  
  async function deploy_AddATokenPair_MinToken_DepositToken_Fixture() {
    //deploy contracts
    const { doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId} 
    = await loadFixture(deploy_AddATokenPair_MinToken_Fixture);

    //acount1 => deposit token A and token B
    await tokenA.connect(account1).approve(doApp.address, TOKENA_DEPOSIT_AMOUNT)
    await doApp.connect(account1).depositTokenA(pairId,TOKENA_DEPOSIT_AMOUNT)
    await tokenB.connect(account1).approve(doApp.address, TOKENB_DEPOSIT_AMOUNT)
    await doApp.connect(account1).depositTokenB(pairId,TOKENB_DEPOSIT_AMOUNT)

    //acount2 => deposit token A only
    await tokenA.connect(account2).approve(doApp.address, TOKENA_DEPOSIT_AMOUNT)
    await doApp.connect(account2).depositTokenA(pairId,TOKENA_DEPOSIT_AMOUNT)

    //acount3 => deposit token B only
    await tokenB.connect(account3).approve(doApp.address, TOKENB_DEPOSIT_AMOUNT)
    await doApp.connect(account3).depositTokenB(pairId,TOKENB_DEPOSIT_AMOUNT)

    return { doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId};
  }




  // Test contract deployment
  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      const { doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
        = await loadFixture(deployDOApp_Fixture);
      expect(await doApp.owner()).to.equal(owner.address);
    })
  })

  //test token Pair management
  describe('Token Pair Management', function () {
    describe("addTokenPair() tests", function () {

      it("Should revert if caller is not a owner", async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, account1} 
          = await loadFixture(deployDOApp_Fixture);
        await expect(doApp.connect(account1).addTokenPair(
          tokenA.address, TOCKENA_SEGMENT_SIZE, TOCKENA_DECIMAL_NUMBER,
          tokenB.address, TOCKENB_SEGMENT_SIZE, TOCKENB_DECIMAL_NUMBER,
          mockChainLinkAggregatorV3.address))
          .to.revertedWith("Ownable: caller is not the owner")
      });
      it('Should revert when trying to add a pair with a null tokenA address', async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
          = await loadFixture(deployDOApp_Fixture);
        await expect(doApp.addTokenPair(
          ADDRESS_0,  TOCKENA_SEGMENT_SIZE, TOCKENA_DECIMAL_NUMBER,
          tokenB.address, TOCKENB_SEGMENT_SIZE, TOCKENB_DECIMAL_NUMBER,
          mockChainLinkAggregatorV3.address))
          .to.be.revertedWith('tokenA address must be defined')
      })

      it('Should revert when trying to add a pair with a null tokenB address', async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
          = await loadFixture(deployDOApp_Fixture);
        await expect(doApp.addTokenPair(
          tokenA.address,TOCKENA_SEGMENT_SIZE, TOCKENA_DECIMAL_NUMBER,
          ADDRESS_0, TOCKENB_SEGMENT_SIZE, TOCKENB_DECIMAL_NUMBER,
          mockChainLinkAggregatorV3.address))
          .to.be.revertedWith('tokenB address must be defined')
      })
      it('Should revert when trying to add a pair with a null ChainLinkAggregatorV3 address', async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
          = await loadFixture(deployDOApp_Fixture);
        await expect(doApp.addTokenPair(
          tokenA.address,TOCKENA_SEGMENT_SIZE, TOCKENA_DECIMAL_NUMBER,
          tokenB.address,TOCKENB_SEGMENT_SIZE, TOCKENB_DECIMAL_NUMBER,
          ADDRESS_0))
          .to.be.revertedWith('Chain Link Price Fetcher must be defined')
      })

      it('Should add a token Pair and emit TokenPAirAdded event', async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
          = await loadFixture(deployDOApp_Fixture);
        //console.log("tokenA : ", tokenA.address);
        //console.log("tokenB : ", tokenB.address);
        await expect(doApp.addTokenPair(
          tokenA.address,TOCKENA_SEGMENT_SIZE, TOCKENA_DECIMAL_NUMBER,
          tokenB.address,TOCKENB_SEGMENT_SIZE, TOCKENB_DECIMAL_NUMBER,
          mockChainLinkAggregatorV3.address))
          .to.emit(doApp,'TokenPAirAdded').withArgs(anyValue, tokenA.address, tokenB.address, mockChainLinkAggregatorV3.address)
      })

      it('Should be able to get an added tokenPair', async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
          = await loadFixture(deployDOApp_Fixture);
        //console.log("tokenA : ", tokenA.address);
        //console.log("tokenB : ", tokenB.address);
        await (doApp.addTokenPair(
          tokenA.address,TOCKENA_SEGMENT_SIZE, TOCKENA_DECIMAL_NUMBER,
          tokenB.address,TOCKENB_SEGMENT_SIZE, TOCKENB_DECIMAL_NUMBER,
          mockChainLinkAggregatorV3.address))

        let eventFilter = doApp.filters.TokenPAirAdded()
        let events = await doApp.queryFilter(eventFilter, 'latest')
        let hashOfPair = events[0].args[0]
        let tokenPair = await doApp.tokenPairs(hashOfPair)
        //console.log(tokenPair)
        expect (tokenPair.TokenAddressA).to.equal(tokenA.address)
        expect (tokenPair.TokenAddressB).to.equal(tokenB.address)
        expect (tokenPair.ChainlinkPriceFetcher).to.equal(mockChainLinkAggregatorV3.address)
        expect (tokenPair.enabled).to.be.false
      })

      it('Should revert when trying to add the same tokenPair', async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
          = await loadFixture(deployDOApp_Fixture);
        await (doApp.addTokenPair(
          tokenA.address, TOCKENA_SEGMENT_SIZE, TOCKENA_DECIMAL_NUMBER,
          tokenB.address, TOCKENB_SEGMENT_SIZE, TOCKENB_DECIMAL_NUMBER,
          mockChainLinkAggregatorV3.address))
        await expect(doApp.addTokenPair(
          tokenA.address, TOCKENA_SEGMENT_SIZE, TOCKENA_DECIMAL_NUMBER,
          tokenB.address, TOCKENB_SEGMENT_SIZE, TOCKENB_DECIMAL_NUMBER,
          mockChainLinkAggregatorV3.address))
        .to.revertedWith("Token Pair Allready Defined")
      })

      it('Should revert when trying to add the same tokenPair with a revert order', async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
          = await loadFixture(deployDOApp_Fixture);
        await (doApp.addTokenPair(
          tokenA.address, TOCKENA_SEGMENT_SIZE, TOCKENA_DECIMAL_NUMBER,
          tokenB.address, TOCKENB_SEGMENT_SIZE, TOCKENB_DECIMAL_NUMBER,
          mockChainLinkAggregatorV3.address))
        await expect(doApp.addTokenPair(
          tokenB.address, TOCKENB_SEGMENT_SIZE, TOCKENB_DECIMAL_NUMBER,
          tokenA.address, TOCKENA_SEGMENT_SIZE, TOCKENA_DECIMAL_NUMBER,
          mockChainLinkAggregatorV3.address))
        .to.revertedWith("Token Pair Allready Defined")
      })


    })
  })


  //Token Deposit tests
  describe('Token Deposit', function () {

    describe ('depositTokenA() tests', function () {
      it('Should Revert when trying to deposit TokenA to an unknow token pair (pairId)', async function () {
        const {doApp} 
          = await loadFixture(deploy_AddATokenPair_MinToken_Fixture);
        await expect(doApp.depositTokenA(BAD_PAIR_ID, 1))
                      .to.be.revertedWith('Token Pair not Found')
      })
      it('Should Revert when trying to deposit zero TokenA', async function () {
        const {doApp, pairId} 
          = await loadFixture(deploy_AddATokenPair_MinToken_Fixture);
        await expect(doApp.depositTokenA(pairId, 0))
                      .to.be.revertedWith('Deposit amount should be > 0')
      })
      it('Should be able to deposit a specified amount of token A and check balance', async function () {
        const {doApp, tokenA, account1, pairId} = await loadFixture(deploy_AddATokenPair_MinToken_Fixture);

        await (tokenA.connect(account1).approve(doApp.address, TOKENA_DEPOSIT_AMOUNT))
        await ( (doApp.connect(account1)).depositTokenA(pairId, TOKENA_DEPOSIT_AMOUNT))
        expect(await tokenA.balanceOf(account1.address)).to.be.equals(TOKEN_INITIAL_SUPPLY.sub(TOKENA_DEPOSIT_AMOUNT))
        /*
        console.log('account1 tokenA balance : ',await tokenA.balanceOf(account1.address))
        console.log('account1 doApp tokenA : ', (await doApp.connect(account1).getTokenBalances(pairId))[0])
        */
        expect((await doApp.connect(account1).getTokenBalances(pairId))[0]).to.be.equals(TOKENA_DEPOSIT_AMOUNT);
      })
      it('Should emit a TokenDeposit event on depositTokenA success', async function () {
        const {doApp, tokenA, account1, pairId} = await loadFixture(deploy_AddATokenPair_MinToken_Fixture);

        await (tokenA.connect(account1).approve(doApp.address, TOKENA_DEPOSIT_AMOUNT))
        await expect ((doApp.connect(account1)).depositTokenA(pairId, TOKENA_DEPOSIT_AMOUNT))
          .to.emit(doApp, 'TokenDeposit').withArgs(account1.address, pairId, tokenA.address, TOKENA_DEPOSIT_AMOUNT, anyValue);

        /*
        tx = await (doApp.connect(account1)).depositTokenA(pairId, TOKENA_DEPOSIT_AMOUNT)
        console.log(tx)
        const blockBefore = await ethers.provider.getBlock(tx.blocknumber);
        const blockTimestamp = blockBefore.timestamp;
        console.log ("Block Timestamp : ", blockTimestamp)
        
        let eventFilter = doApp.filters.TokenDeposit()
        let events = await doApp.queryFilter(eventFilter, 'latest')
        console.log(events)
        */
      })
    })
    
    describe ('depositTokenB() tests', function () {
      it('Should Revert when trying to deposit TokenB to an unknow token pair (pairId)', async function () {
        const {doApp} 
          = await loadFixture(deploy_AddATokenPair_MinToken_Fixture);
        await expect(doApp.depositTokenB(BAD_PAIR_ID, 1))
                      .to.be.revertedWith('Token Pair not Found')
      })
      it('Should Revert when trying to deposit zero TokenB', async function () {
        const {doApp, pairId} 
          = await loadFixture(deploy_AddATokenPair_MinToken_Fixture);
        await expect(doApp.depositTokenB(pairId, 0))
                      .to.be.revertedWith('Deposit amount should be > 0')
      })
      it('Should Deposit a specified amount of token B', async function () {
        const {doApp,  tokenB, account1, pairId} = await loadFixture(deploy_AddATokenPair_MinToken_Fixture);

        await tokenB.connect(account1).approve(doApp.address, TOKENB_DEPOSIT_AMOUNT)
        await doApp.connect(account1).depositTokenB(pairId, TOKENB_DEPOSIT_AMOUNT)

        expect(await tokenB.balanceOf(account1.address)).to.be.equals(TOKEN_INITIAL_SUPPLY.sub(TOKENB_DEPOSIT_AMOUNT))
        expect((await doApp.connect(account1).getTokenBalances(pairId))[1]).to.be.equals(TOKENB_DEPOSIT_AMOUNT);
      })

      it('Should emit a TokenDeposit event on depositTokenB success', async function () {
        const {doApp, tokenB, account1, pairId} = await loadFixture(deploy_AddATokenPair_MinToken_Fixture);

        await (tokenB.connect(account1).approve(doApp.address, TOKENB_DEPOSIT_AMOUNT))
        await expect ((doApp.connect(account1)).depositTokenB(pairId, TOKENB_DEPOSIT_AMOUNT))
          .to.emit(doApp, 'TokenDeposit').withArgs(account1.address, pairId, tokenB.address, TOKENB_DEPOSIT_AMOUNT, anyValue);
      })
    })
  })

  describe ('getTokenBalances() tests', function () {
    it('Should Revert when trying to get token Balance from an unknow token pair (pairId)', async function () {
      const {doApp, account1} = await loadFixture(deploy_AddATokenPair_MinToken_Fixture);
      await expect( doApp.connect(account1).getTokenBalances(BAD_PAIR_ID)).to.be.revertedWith("Token Pair not Found")
    })
  })


  //Token Withdraw tests
  describe ('withdrawTokenA() tests', function () {
    it('Should Revert when trying to withdraw TokenA from an unknow token pair (pairId)', async function () {
      const {doApp} 
        = await loadFixture(deploy_AddATokenPair_MinToken_Fixture);
      await expect(doApp.withdrawTokenA(BAD_PAIR_ID, 1))
                    .to.be.revertedWith('Token Pair not Found')
    })

    it('Should Revert when trying to withdraw zero TokenA', async function () {
      const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId} 
        = await loadFixture(deploy_AddATokenPair_MinToken_Fixture);
      await expect(doApp.withdrawTokenA(pairId, 0))
                    .to.be.revertedWith('Withdraw amount should be > 0')
    })

    it('Should Revert when trying to withdraw Token A with amount > account balance', async function () {
      const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId} 
        = await loadFixture(deploy_AddATokenPair_Fixture);
      await expect(doApp.withdrawTokenA(pairId, TOKEN_AMOUNT_ABOVE_BALANCE))
                    .to.be.revertedWith('Amount to withdraw should be < your account balance')
    })

    it('Should withdraw a specified amount of token A', async function () {
      const {doApp,  tokenA, account1, pairId} = await loadFixture(deploy_AddATokenPair_MinToken_DepositToken_Fixture);
      // check tokenA balance for account1 berfore withdraw
      expect(await tokenA.balanceOf(account1.address)).to.be.equals(TOKEN_INITIAL_SUPPLY.sub(TOKENA_DEPOSIT_AMOUNT))
      // check tokenA balance for doApp berfore withdraw
      expect((await doApp.connect(account1).getTokenBalances(pairId))[0]).to.be.equals(TOKENA_DEPOSIT_AMOUNT);

      await doApp.connect(account1).withdrawTokenA(pairId, TOKENA_WITHDRAW_AMOUNT)

      expect(await tokenA.balanceOf(account1.address))
        .to.be.equals(TOKEN_INITIAL_SUPPLY.sub(TOKENA_DEPOSIT_AMOUNT).add(TOKENA_WITHDRAW_AMOUNT))
      expect((await doApp.connect(account1).getTokenBalances(pairId))[0])
        .to.be.equals(TOKENA_DEPOSIT_AMOUNT.sub(TOKENA_WITHDRAW_AMOUNT));
    })

    it('Should emit a TokenWithdrawal event on withdrawTokenA() success', async function () {
      const {doApp, tokenA, account1, pairId} = await loadFixture(deploy_AddATokenPair_MinToken_DepositToken_Fixture);
      await expect(doApp.connect(account1).withdrawTokenA(pairId, TOKENA_WITHDRAW_AMOUNT))
        .to.emit(doApp, 'TokenWithdrawal').withArgs(account1.address, pairId, tokenA.address, TOKENA_WITHDRAW_AMOUNT, anyValue);
    })


  })

  describe('withdrawTokenB() tests', function () {
    it('Should Revert when trying to withdraw TokenB from an unknow token pair (pairId)', async function () {
      const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId} 
        = await loadFixture(deploy_AddATokenPair_MinToken_Fixture);
      await expect(doApp.withdrawTokenB(BAD_PAIR_ID, 1))
                    .to.be.revertedWith('Token Pair not Found')
    })

    it('Should Revert when trying to withdraw zero TokenB', async function () {
      const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId} 
        = await loadFixture(deploy_AddATokenPair_MinToken_Fixture);
      await expect(doApp.withdrawTokenB(pairId, 0))
                    .to.be.revertedWith('Withdraw amount should be > 0')
    })

    it('Should Revert when trying to withdraw token B with amount > account balance', async function () {
      const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId} 
        = await loadFixture(deploy_AddATokenPair_Fixture);
      await expect(doApp.withdrawTokenB(pairId, TOKEN_AMOUNT_ABOVE_BALANCE))
                    .to.be.revertedWith('Amount to withdraw should be < your account balance')
    })


    it('Should withdraw a specified amount of token B', async function () {
      const {doApp,  tokenB, account1, pairId} = await loadFixture(deploy_AddATokenPair_MinToken_DepositToken_Fixture);
      // check tokenB balance for account1 berfore withdraw
      expect(await tokenB.balanceOf(account1.address)).to.be.equals(TOKEN_INITIAL_SUPPLY.sub(TOKENB_DEPOSIT_AMOUNT))
      // check tokenB balance for doApp berfore withdraw
      expect((await doApp.connect(account1).getTokenBalances(pairId))[1]).to.be.equals(TOKENB_DEPOSIT_AMOUNT);

      await doApp.connect(account1).withdrawTokenB(pairId, TOKENB_WITHDRAW_AMOUNT)

      expect(await tokenB.balanceOf(account1.address))
        .to.be.equals(TOKEN_INITIAL_SUPPLY.sub(TOKENB_DEPOSIT_AMOUNT).add(TOKENB_WITHDRAW_AMOUNT))
      expect((await doApp.connect(account1).getTokenBalances(pairId))[1])
        .to.be.equals(TOKENB_DEPOSIT_AMOUNT.sub(TOKENB_WITHDRAW_AMOUNT));
    })    

    it('Should emit a TokenWithdrawal event on withdrawTokenB() success', async function () {
      const {doApp, tokenB, account1, pairId} = await loadFixture(deploy_AddATokenPair_MinToken_DepositToken_Fixture);
      await expect(doApp.connect(account1).withdrawTokenB(pairId, TOKENB_WITHDRAW_AMOUNT))
        .to.emit(doApp, 'TokenWithdrawal').withArgs(account1.address, pairId, tokenB.address, TOKENB_WITHDRAW_AMOUNT, anyValue);
    })
  })




  /*
  describe("Withdrawals", function () {
  
    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { doApp } = await loadFixture(deployDOAppFixture);

        await expect(doApp.withdrawUSDT(BigInt(100)))
          .to.emit(doApp, "Withdrawal")
          .withArgs(BigInt(100), anyValue); // We accept any value as `when` arg

        await expect(doApp.withdrawETH(BigInt(100)))
          .to.emit(doApp, "With      await expect(doApp.addTokenPair(tokenA.address,ADDRESS_0, mockChainLinkAggregatorV3.address))
                    .to.be.revertedWith("tokenB address must be defined")
drawal")
          .withArgs(BigInt(100), anyValue); // We accept any value as `when` arg

        await expect(doApp.executeDCA())
          .to.emit(doApp, "DCAExecution")
          .withArgs(anyValue, anyValue); // We accept any value as    it('Should Revert when trying to deposit TokenA to an unknow token pair (pairId)', async function () {
      const {doApp} 
        = await loadFixture(deployDOAppFixtureAddATokenPairDepositToken);
      await expect(doApp.depositTokenA(BAD_PAIR_ID, 1))
                    .to.be.revertedWith('Token Pair not Found')
    })

    it('Should Revert when trying to deposit TokenB to an unknow token pair (pairId)', async function () {
      const {doApp} 
        = await loadFixture(deployDOAppFixtureAddATokenPairDepositToken);
      await expect(doApp.depositTokenB(BAD_PAIR_ID, 1))
                    .to.be.revertedWith('Token Pair not Found')
    })

    it('Should Revert when trying to deposit zero TokenA', async function () {
      const {doApp, pairId} 
        = await loadFixture(deployDOAppFixtureAddATokenPairDepositToken);
      await expect(doApp.depositTokenA(pairId, 0))
                    .to.be.revertedWith('Deposit amount should be > 0')
    })

    it('Should Revert when trying to deposit zero TokenB', async function () {
      const {doApp, pairId} 
        = await loadFixture(deployDOAppFixtureAddATokenPairDepositToken);
      await expect(doApp.depositTokenA(pairId, 0))
                    .to.be.revertedWith('Deposit amount should be > 0')
    })
 `when` arg"owner tokenB balance : ",
      });
    });
  });

  describe("ExecuteDCA", function () {
  
    describe("Events", function () {
      it("Should emit an event on DCA Execution", async function () {
        const { doApp } = await loadFixture(deployDOAppFixture);

        await expect(doApp.executeDCA())
          .to.emit(doApp, "DCAExecution")
          .withArgs(anyValue, anyValue); 
      });
    });
  });
  */     
});
