const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers')
const { expect } = require('chai')
const { BigNumber } = require('ethers')
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');
const Constant = require("./lib/Constants.js")
const Fixture = require("./lib/Fixtures.js")


// DOApp contract Tests
describe('DOApp Contract tests', function () {

  // Test contract deployment
  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      const { doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
        = await loadFixture(Fixture.deployDOApp_Fixture);
      expect(await doApp.owner()).to.equal(owner.address);
    })
  })

  //test token Pair management
  describe('Token Pair Management', function () {
    describe("addTokenPair() tests", function () {

      it("Should revert if caller is not a owner", async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, account1} 
          = await loadFixture(Fixture.deployDOApp_Fixture);
        await expect(doApp.connect(account1).addTokenPair(
          tokenA.address, Constant.TOCKENA_SEGMENT_SIZE, Constant.TOCKENA_DECIMAL_NUMBER,
          tokenB.address, Constant.TOCKENB_SEGMENT_SIZE, Constant.TOCKENB_DECIMAL_NUMBER,
          mockChainLinkAggregatorV3.address))
          .to.revertedWith("Ownable: caller is not the owner")
      });
      it('Should revert when trying to add a pair with a null tokenA address', async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
          = await loadFixture(Fixture.deployDOApp_Fixture);
        await expect(doApp.addTokenPair(
          Constant.ADDRESS_0,  Constant.TOCKENA_SEGMENT_SIZE, Constant.TOCKENA_DECIMAL_NUMBER,
          tokenB.address, Constant.TOCKENB_SEGMENT_SIZE, Constant.TOCKENB_DECIMAL_NUMBER,
          mockChainLinkAggregatorV3.address))
          .to.be.revertedWith('tokenA address must be defined')
      })

      it('Should revert when trying to add a pair with a null tokenB address', async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
          = await loadFixture(Fixture.deployDOApp_Fixture);
        await expect(doApp.addTokenPair(
          tokenA.address,Constant.TOCKENA_SEGMENT_SIZE, Constant.TOCKENA_DECIMAL_NUMBER,
          Constant.ADDRESS_0, Constant.TOCKENB_SEGMENT_SIZE, Constant.TOCKENB_DECIMAL_NUMBER,
          mockChainLinkAggregatorV3.address))
          .to.be.revertedWith('tokenB address must be defined')
      })
      it('Should revert when trying to add a pair with a null ChainLinkAggregatorV3 address', async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
          = await loadFixture(Fixture.deployDOApp_Fixture);
        await expect(doApp.addTokenPair(
          tokenA.address,Constant.TOCKENA_SEGMENT_SIZE, Constant.TOCKENA_DECIMAL_NUMBER,
          tokenB.address,Constant.TOCKENB_SEGMENT_SIZE, Constant.TOCKENB_DECIMAL_NUMBER,
          Constant.ADDRESS_0))
          .to.be.revertedWith('Chain Link Price Fetcher must be defined')
      })

      it('Should add a token Pair and emit TokenPAirAdded event', async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
          = await loadFixture(Fixture.deployDOApp_Fixture);
        //console.log("tokenA : ", tokenA.address);
        //console.log("tokenB : ", tokenB.address);
        await expect(doApp.addTokenPair(
          tokenA.address,Constant.TOCKENA_SEGMENT_SIZE, Constant.TOCKENA_DECIMAL_NUMBER,
          tokenB.address,Constant.TOCKENB_SEGMENT_SIZE, Constant.TOCKENB_DECIMAL_NUMBER,
          mockChainLinkAggregatorV3.address))
          .to.emit(doApp,'TokenPAirAdded').withArgs(anyValue, tokenA.address, tokenB.address, mockChainLinkAggregatorV3.address)
      })

      it('Should be able to get an added tokenPair', async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
          = await loadFixture(Fixture.deployDOApp_Fixture);
        //console.log("tokenA : ", tokenA.address);
        //console.log("tokenB : ", tokenB.address);
        await (doApp.addTokenPair(
          tokenA.address,Constant.TOCKENA_SEGMENT_SIZE, Constant.TOCKENA_DECIMAL_NUMBER,
          tokenB.address,Constant.TOCKENB_SEGMENT_SIZE, Constant.TOCKENB_DECIMAL_NUMBER,
          mockChainLinkAggregatorV3.address))

        let eventFilter = doApp.filters.TokenPAirAdded()
        let events = await doApp.queryFilter(eventFilter, 'latest')
        let hashOfPair = events[0].args[0]
        let tokenPair = await doApp.tokenPairs(hashOfPair)
        //console.log(tokenPair)
        expect (tokenPair.tokenAddressA).to.equal(tokenA.address)
        expect (tokenPair.tokenASegmentSize).to.equal(Constant.TOCKENA_SEGMENT_SIZE)
        expect (tokenPair.tokenADecimalNumber).to.equal(Constant.TOCKENA_DECIMAL_NUMBER)
        expect (tokenPair.tokenAddressB).to.equal(tokenB.address)
        expect (tokenPair.tokenBSegmentSize).to.equal(Constant.TOCKENB_SEGMENT_SIZE)
        expect (tokenPair.tokenBDecimalNumber).to.equal(Constant.TOCKENB_DECIMAL_NUMBER)
        expect (tokenPair.chainlinkPriceFetcher).to.equal(mockChainLinkAggregatorV3.address)
        expect (tokenPair.enabled).to.be.false
      })

      it('Should revert when trying to add the same tokenPair', async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
          = await loadFixture(Fixture.deployDOApp_Fixture);
        await (doApp.addTokenPair(
          tokenA.address, Constant.TOCKENA_SEGMENT_SIZE, Constant.TOCKENA_DECIMAL_NUMBER,
          tokenB.address, Constant.TOCKENB_SEGMENT_SIZE, Constant.TOCKENB_DECIMAL_NUMBER,
          mockChainLinkAggregatorV3.address))
        await expect(doApp.addTokenPair(
          tokenA.address, Constant.TOCKENA_SEGMENT_SIZE, Constant.TOCKENA_DECIMAL_NUMBER,
          tokenB.address, Constant.TOCKENB_SEGMENT_SIZE, Constant.TOCKENB_DECIMAL_NUMBER,
          mockChainLinkAggregatorV3.address))
        .to.revertedWith("Token Pair Allready Defined")
      })

      it('Should revert when trying to add the same tokenPair with a revert order', async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
          = await loadFixture(Fixture.deployDOApp_Fixture);
        await (doApp.addTokenPair(
          tokenA.address, Constant.TOCKENA_SEGMENT_SIZE, Constant.TOCKENA_DECIMAL_NUMBER,
          tokenB.address, Constant.TOCKENB_SEGMENT_SIZE, Constant.TOCKENB_DECIMAL_NUMBER,
          mockChainLinkAggregatorV3.address))
        await expect(doApp.addTokenPair(
          tokenB.address, Constant.TOCKENB_SEGMENT_SIZE, Constant.TOCKENB_DECIMAL_NUMBER,
          tokenA.address, Constant.TOCKENA_SEGMENT_SIZE, Constant.TOCKENA_DECIMAL_NUMBER,
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
          = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await expect(doApp.depositTokenA(Constant.BAD_PAIR_ID, 1))
                      .to.be.revertedWith('Token Pair not Found')
      })
      it('Should Revert when trying to deposit zero TokenA', async function () {
        const {doApp, pairId} 
          = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await expect(doApp.depositTokenA(pairId, 0))
                      .to.be.revertedWith('Deposit amount should be > 0')
      })
      it('Should be able to deposit a specified amount of token A and check balance', async function () {
        const {doApp, tokenA, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);

        await (tokenA.connect(account1).approve(doApp.address, Constant.TOKENA_DEPOSIT_AMOUNT))
        await ( (doApp.connect(account1)).depositTokenA(pairId, Constant.TOKENA_DEPOSIT_AMOUNT))
        expect(await tokenA.balanceOf(account1.address)).to.be.equals(Constant.TOKEN_INITIAL_SUPPLY.sub(Constant.TOKENA_DEPOSIT_AMOUNT))
        /*
        console.log('account1 tokenA balance : ',await tokenA.balanceOf(account1.address))
        console.log('account1 doApp tokenA : ', (await doApp.connect(account1).getTokenBalances(pairId))[0])
        */
        expect((await doApp.connect(account1).getTokenBalances(pairId))[0]).to.be.equals(Constant.TOKENA_DEPOSIT_AMOUNT);
      })
      it('Should emit a TokenDeposit event on depositTokenA success', async function () {
        const {doApp, tokenA, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);

        await (tokenA.connect(account1).approve(doApp.address, Constant.TOKENA_DEPOSIT_AMOUNT))
        await expect ((doApp.connect(account1)).depositTokenA(pairId, Constant.TOKENA_DEPOSIT_AMOUNT))
          .to.emit(doApp, 'TokenDeposit').withArgs(account1.address, pairId, tokenA.address, Constant.TOKENA_DEPOSIT_AMOUNT, anyValue);

        /*
        tx = await (doApp.connect(account1)).depositTokenA(pairId, Constant.TOKENA_DEPOSIT_AMOUNT)
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
          = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await expect(doApp.depositTokenB(Constant.BAD_PAIR_ID, 1))
                      .to.be.revertedWith('Token Pair not Found')
      })
      it('Should Revert when trying to deposit zero TokenB', async function () {
        const {doApp, pairId} 
          = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await expect(doApp.depositTokenB(pairId, 0))
                      .to.be.revertedWith('Deposit amount should be > 0')
      })
      it('Should Deposit a specified amount of token B', async function () {
        const {doApp,  tokenB, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);

        await tokenB.connect(account1).approve(doApp.address, Constant.TOKENB_DEPOSIT_AMOUNT)
        await doApp.connect(account1).depositTokenB(pairId, Constant.TOKENB_DEPOSIT_AMOUNT)

        expect(await tokenB.balanceOf(account1.address)).to.be.equals(Constant.TOKEN_INITIAL_SUPPLY.sub(Constant.TOKENB_DEPOSIT_AMOUNT))
        expect((await doApp.connect(account1).getTokenBalances(pairId))[1]).to.be.equals(Constant.TOKENB_DEPOSIT_AMOUNT);
      })

      it('Should emit a TokenDeposit event on depositTokenB success', async function () {
        const {doApp, tokenB, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);

        await (tokenB.connect(account1).approve(doApp.address, Constant.TOKENB_DEPOSIT_AMOUNT))
        await expect ((doApp.connect(account1)).depositTokenB(pairId, Constant.TOKENB_DEPOSIT_AMOUNT))
          .to.emit(doApp, 'TokenDeposit').withArgs(account1.address, pairId, tokenB.address, Constant.TOKENB_DEPOSIT_AMOUNT, anyValue);
      })
    })
  })

  describe ('getTokenBalances() tests', function () {
    it('Should Revert when trying to get token Balance from an unknow token pair (pairId)', async function () {
      const {doApp, account1} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
      await expect( doApp.connect(account1).getTokenBalances(Constant.BAD_PAIR_ID)).to.be.revertedWith("Token Pair not Found")
    })
  })


  //Token Withdraw tests
  describe ('withdrawTokenA() tests', function () {
    it('Should Revert when trying to withdraw TokenA from an unknow token pair (pairId)', async function () {
      const {doApp} 
        = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
      await expect(doApp.withdrawTokenA(Constant.BAD_PAIR_ID, 1))
                    .to.be.revertedWith('Token Pair not Found')
    })

    it('Should Revert when trying to withdraw zero TokenA', async function () {
      const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId} 
        = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
      await expect(doApp.withdrawTokenA(pairId, 0))
                    .to.be.revertedWith('Withdraw amount should be > 0')
    })

    it('Should Revert when trying to withdraw Token A with amount > account balance', async function () {
      const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId} 
        = await loadFixture(Fixture.deploy_AddATokenPair_Fixture);
      await expect(doApp.withdrawTokenA(pairId, Constant.TOKEN_AMOUNT_ABOVE_BALANCE))
                    .to.be.revertedWith('Amount to withdraw should be < your account balance')
    })

    it('Should withdraw a specified amount of token A', async function () {
      const {doApp,  tokenA, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_DepositToken_Fixture);
      // check tokenA balance for account1 berfore withdraw
      expect(await tokenA.balanceOf(account1.address)).to.be.equals(Constant.TOKEN_INITIAL_SUPPLY.sub(Constant.TOKENA_DEPOSIT_AMOUNT))
      // check tokenA balance for doApp berfore withdraw
      expect((await doApp.connect(account1).getTokenBalances(pairId))[0]).to.be.equals(Constant.TOKENA_DEPOSIT_AMOUNT);

      await doApp.connect(account1).withdrawTokenA(pairId, Constant.TOKENA_WITHDRAW_AMOUNT)

      expect(await tokenA.balanceOf(account1.address))
        .to.be.equals(Constant.TOKEN_INITIAL_SUPPLY.sub(Constant.TOKENA_DEPOSIT_AMOUNT).add(Constant.TOKENA_WITHDRAW_AMOUNT))
      expect((await doApp.connect(account1).getTokenBalances(pairId))[0])
        .to.be.equals(Constant.TOKENA_DEPOSIT_AMOUNT.sub(Constant.TOKENA_WITHDRAW_AMOUNT));
    })

    it('Should emit a TokenWithdrawal event on withdrawTokenA() success', async function () {
      const {doApp, tokenA, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_DepositToken_Fixture);
      await expect(doApp.connect(account1).withdrawTokenA(pairId, Constant.TOKENA_WITHDRAW_AMOUNT))
        .to.emit(doApp, 'TokenWithdrawal').withArgs(account1.address, pairId, tokenA.address, Constant.TOKENA_WITHDRAW_AMOUNT, anyValue);
    })


  })

  describe('withdrawTokenB() tests', function () {
    it('Should Revert when trying to withdraw TokenB from an unknow token pair (pairId)', async function () {
      const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId} 
        = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
      await expect(doApp.withdrawTokenB(Constant.BAD_PAIR_ID, 1))
                    .to.be.revertedWith('Token Pair not Found')
    })

    it('Should Revert when trying to withdraw zero TokenB', async function () {
      const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId} 
        = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
      await expect(doApp.withdrawTokenB(pairId, 0))
                    .to.be.revertedWith('Withdraw amount should be > 0')
    })

    it('Should Revert when trying to withdraw token B with amount > account balance', async function () {
      const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4, pairId} 
        = await loadFixture(Fixture.deploy_AddATokenPair_Fixture);
      await expect(doApp.withdrawTokenB(pairId, Constant.TOKEN_AMOUNT_ABOVE_BALANCE))
                    .to.be.revertedWith('Amount to withdraw should be < your account balance')
    })


    it('Should withdraw a specified amount of token B', async function () {
      const {doApp,  tokenB, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_DepositToken_Fixture);
      // check tokenB balance for account1 berfore withdraw
      expect(await tokenB.balanceOf(account1.address)).to.be.equals(Constant.TOKEN_INITIAL_SUPPLY.sub(Constant.TOKENB_DEPOSIT_AMOUNT))
      // check tokenB balance for doApp berfore withdraw
      expect((await doApp.connect(account1).getTokenBalances(pairId))[1]).to.be.equals(Constant.TOKENB_DEPOSIT_AMOUNT);

      await doApp.connect(account1).withdrawTokenB(pairId, Constant.TOKENB_WITHDRAW_AMOUNT)

      expect(await tokenB.balanceOf(account1.address))
        .to.be.equals(Constant.TOKEN_INITIAL_SUPPLY.sub(Constant.TOKENB_DEPOSIT_AMOUNT).add(Constant.TOKENB_WITHDRAW_AMOUNT))
      expect((await doApp.connect(account1).getTokenBalances(pairId))[1])
        .to.be.equals(Constant.TOKENB_DEPOSIT_AMOUNT.sub(Constant.TOKENB_WITHDRAW_AMOUNT));
    })    

    it('Should emit a TokenWithdrawal event on withdrawTokenB() success', async function () {
      const {doApp, tokenB, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_DepositToken_Fixture);
      await expect(doApp.connect(account1).withdrawTokenB(pairId, Constant.TOKENB_WITHDRAW_AMOUNT))
        .to.emit(doApp, 'TokenWithdrawal').withArgs(account1.address, pairId, tokenB.address, Constant.TOKENB_WITHDRAW_AMOUNT, anyValue);
    })
  })

});
