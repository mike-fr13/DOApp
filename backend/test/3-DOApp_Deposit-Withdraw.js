const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers')
const { expect } = require('chai')
const { BigNumber } = require('ethers')
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');
const Constant = require("./lib/Constants.js")
const Fixture = require("./lib/Fixtures.js")


// DOApp contract Tests
describe('DOApp Contract - Deposit and Withdraw tests', function () {

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
        const {doApp, dataStorage, tokenA, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await (tokenA.connect(account1).approve(doApp.address, Constant.TOKENA_DEPOSIT_AMOUNT))
        await ( (doApp.connect(account1)).depositTokenA(pairId, Constant.TOKENA_DEPOSIT_AMOUNT))
        //console.log('account1 tokenA balance : ',await tokenA.balanceOf(account1.address))
        //console.log('account1 doApp tokenA : ', (await doApp.connect(account1).getTokenUserBalances(tokenA.address,account1.address)).balance)

        expect(await tokenA.balanceOf(account1.address)).to.be.equals(Constant.TOKEN_INITIAL_SUPPLY.sub(Constant.TOKENA_DEPOSIT_AMOUNT))
        //console.log('account1 tokenA balance : ',await tokenA.balanceOf(account1.address))
        //console.log('account1 doApp tokenA : ', (await doApp.connect(account1).getTokenUserBalances(tokenA.address,account1.address)).balance)
        expect((await doApp.connect(account1).getTokenUserBalances(tokenA.address,account1.address)).balance).to.be.equals(Constant.TOKENA_DEPOSIT_AMOUNT);
      })

      it('Should emit a TokenDeposit event on depositTokenA success', async function () {
        const {doApp, tokenA, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await (tokenA.connect(account1).approve(doApp.address, Constant.TOKENA_DEPOSIT_AMOUNT))
        await expect ((doApp.connect(account1)).depositTokenA(pairId, Constant.TOKENA_DEPOSIT_AMOUNT))
          .to.emit(doApp, 'TokenDeposit').withArgs(account1.address, pairId, tokenA.address, Constant.TOKENA_DEPOSIT_AMOUNT, anyValue);
        //tx = await (doApp.connect(account1)).depositTokenA(pairId, Constant.TOKENA_DEPOSIT_AMOUNT)
        //console.log(tx)
        //const blockBefore = await ethers.provider.getBlock(tx.blocknumber);
        //const blockTimestamp = blockBefore.timestamp;
        //console.log ("Block Timestamp : ", blockTimestamp)
        //
        //let eventFilter = doApp.filters.TokenDeposit()
        //let events = await doApp.queryFilter(eventFilter, 'latest')
        //console.log(events)
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
        const isLogEnable = false
        const {doApp,dataStorage,  tokenB, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);

        isLogEnable ? console.log("Befoe Deposit TokenB balance for account1 : ",await tokenB.balanceOf(account1.address)):{}
        isLogEnable ? console.log("Befoe Deposit getTokenUserBalances : ",await doApp.connect(account1).getTokenUserBalances(tokenB.address,account1.address)):{}
        await tokenB.connect(account1).approve(doApp.address, Constant.TOKENB_DEPOSIT_AMOUNT)
        await doApp.connect(account1).depositTokenB(pairId, Constant.TOKENB_DEPOSIT_AMOUNT)
        isLogEnable ? console.log("After withdraw TokenB balance for account1 : ",await tokenB.balanceOf(account1.address)):{}
        isLogEnable ? console.log("After withdraw getTokenUserBalances : ",await doApp.connect(account1).getTokenUserBalances(tokenB.address,account1.address)):{}
        expect(await tokenB.balanceOf(account1.address)).to.be.equals(Constant.TOKEN_INITIAL_SUPPLY.sub(Constant.TOKENB_DEPOSIT_AMOUNT))
        expect((await doApp.connect(account1).getTokenUserBalances(tokenB.address,account1.address)).balance).to.be.equals(Constant.TOKENB_DEPOSIT_AMOUNT);
      })

      it('Should emit a TokenDeposit event on depositTokenB success', async function () {
        const {doApp, tokenB, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await (tokenB.connect(account1).approve(doApp.address, Constant.TOKENB_DEPOSIT_AMOUNT))
        await expect ((doApp.connect(account1)).depositTokenB(pairId, Constant.TOKENB_DEPOSIT_AMOUNT))
          .to.emit(doApp, 'TokenDeposit').withArgs(account1.address, pairId, tokenB.address, Constant.TOKENB_DEPOSIT_AMOUNT, anyValue);
      })

    })
  })

  describe ('getTokenUserBalances() tests', function () {
    it('Should Revert when trying to get token Balance from a zero address for token', async function () {
      const {doApp, account1} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
      await expect( doApp.connect(account1).getTokenUserBalances(Constant.ADDRESS_0, account1.address)).to.be.revertedWith("Token address should not be 0")
    })
    it('Should Revert when trying to get token Balance from a zero address for user', async function () {
      const {doApp, tokenA, account1} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
      await expect( doApp.connect(account1).getTokenUserBalances(tokenA.address, Constant.ADDRESS_0)).to.be.revertedWith("User address should not be 0")
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
      const {doApp, dataStorage, tokenA, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_DepositToken_Fixture);
      // check tokenA balance for account1 berfore withdraw
      //console.log("tokenA.balanceOf(account1.address) : ", await tokenA.balanceOf(account1.address))
      expect(await tokenA.balanceOf(account1.address)).to.be.equals(Constant.TOKEN_INITIAL_SUPPLY.sub(Constant.TOKENA_DEPOSIT_AMOUNT))
      // check tokenA balance for doApp berfore withdraw
      expect((await doApp.connect(account1).getTokenUserBalances(tokenA.address,account1.address)).balance).to.be.equals(Constant.TOKENA_DEPOSIT_AMOUNT);

      //console.log("Amount to withdraw : ", Constant.TOKENA_WITHDRAW_AMOUNT.toString());
      await doApp.connect(account1).withdrawTokenA(pairId, Constant.TOKENA_WITHDRAW_AMOUNT)

      expect(await tokenA.balanceOf(account1.address))
        .to.be.equals(Constant.TOKEN_INITIAL_SUPPLY.sub(Constant.TOKENA_DEPOSIT_AMOUNT).add(Constant.TOKENA_WITHDRAW_AMOUNT))
      console.log("AdoApp.connect(account1).getTokenUserBalances(tokenA.address,account1.address): ", await doApp.connect(account1).getTokenUserBalances(tokenA.address,account1.address));
      expect((await doApp.connect(account1).getTokenUserBalances(tokenA.address,account1.address)).balance)
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
      const isLogEnable = false;
      const {doApp, tokenB, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_DepositToken_Fixture);
      // check tokenB balance for account1 berfore withdraw
      isLogEnable ? console.log("Before Withdraw TokenB balance for account1 : ",await tokenB.balanceOf(account1.address)):{}
      isLogEnable ? console.log("Before Withdraw getTokenUserBalances : ",await doApp.connect(account1).getTokenUserBalances(tokenB.address,account1.address)):{}
      expect(await tokenB.balanceOf(account1.address)).to.be.equals(Constant.TOKEN_INITIAL_SUPPLY.sub(Constant.TOKENB_DEPOSIT_AMOUNT))
      expect((await doApp.connect(account1).getTokenUserBalances(tokenB.address,account1.address)).balance).to.be.equals(Constant.TOKENB_DEPOSIT_AMOUNT);

      isLogEnable ? console.log("PairId : ",pairId):{}
      isLogEnable ? console.log("Constant.TOKENB_WITHDRAW_AMOUNT : ",Constant.TOKENB_WITHDRAW_AMOUNT):{}
      await doApp.connect(account1).withdrawTokenB(pairId, Constant.TOKENB_WITHDRAW_AMOUNT)

      isLogEnable ? console.log("After Withdraw TokenB balance for account1 : ", await tokenB.balanceOf(account1.address)):{}
      isLogEnable ? console.log("After Withdraw getTokenUserBalances : ",await doApp.connect(account1).getTokenUserBalances(tokenB.address,account1.address)):{}
      
      expect(await tokenB.balanceOf(account1.address))
        .to.be.equals(Constant.TOKEN_INITIAL_SUPPLY.sub(Constant.TOKENB_DEPOSIT_AMOUNT).add(Constant.TOKENB_WITHDRAW_AMOUNT))
      
      struct = await doApp.connect(account1).getTokenUserBalances(tokenB.address,account1.address)         
      balance = struct.balance
      output = Constant.TOKENB_DEPOSIT_AMOUNT.sub(Constant.TOKENB_WITHDRAW_AMOUNT)

      isLogEnable ? console.log("After Withdraw getTokenUserBalances - balanceB: ",balance):{}
      isLogEnable ? console.log("After Withdraw getTokenUserBalances - output: ",output):{}
      
      expect(balance).to.be.equals(output);
        
    })    

    it('Should emit a TokenWithdrawal event on withdrawTokenB() success', async function () {
      const {doApp, tokenB, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_DepositToken_Fixture);
      await expect(doApp.connect(account1).withdrawTokenB(pairId, Constant.TOKENB_WITHDRAW_AMOUNT))
        .to.emit(doApp, 'TokenWithdrawal').withArgs(account1.address, pairId, tokenB.address, Constant.TOKENB_WITHDRAW_AMOUNT, anyValue);
    })
  })

});
