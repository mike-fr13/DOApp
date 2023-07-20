const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { expect } = require('chai')
const { BigNumber } = require("ethers")
const Constant = require("./lib/Constants.js")


describe("MockAavePool tests", function () {

  async function deployMockAAVEPoolAddressesProvider_Fixture() {
    const [owner, account1, account2, account3, account4] = await ethers.getSigners()
    const MockAavePool = await ethers.getContractFactory("MockAavePool")
    const mockAavePool = await MockAavePool.deploy()

    const TokenA = await ethers.getContractFactory('MockERC20');
    const tokenA = await TokenA.deploy(Constant.MCKA_NAME,Constant.MCKA_SYMBOL,Constant.TOKEN_INITIAL_SUPPLY);
  
    await tokenA.mint(account1.address,Constant.TOKEN_INITIAL_SUPPLY)

    return { mockAavePool, tokenA, owner, account1, account2, account3, account4 }
  }

  describe ("Mock function tests", function (){

    describe ("getReserveData() test", async function () {

      it("Should revert with a 0 address for token", async function() {
        const { mockAavePool, account1 } = await loadFixture(deployMockAAVEPoolAddressesProvider_Fixture);
        await expect(mockAavePool.getReserveData(Constant.ADDRESS_0))
        .to.revertedWithCustomError(mockAavePool,"MockError").withArgs("Asset should not be a 0 address")
      })
      it("Should revert if aTokennot created (mock only)", async function() {
        const { mockAavePool, tokenA } = await loadFixture(deployMockAAVEPoolAddressesProvider_Fixture);
        await expect(mockAavePool.getReserveData(tokenA.address))
        .to.revertedWithCustomError(mockAavePool,"MockError").withArgs("aToken not defined")
      })
    })

    describe("supply() tests", function () {

      it("Should revert with a 0 address for token", async function() {
        const { mockAavePool, account1 } = await loadFixture(deployMockAAVEPoolAddressesProvider_Fixture);
        await expect(mockAavePool.connect(account1).supply(Constant.ADDRESS_0, Constant.TOKENA_DEPOSIT_AMOUNT, account1.address, 0))
        .to.revertedWith("Asset address provided should not be zero address")
      })
      it("Should revert with a 0 amount", async function() {
        const { mockAavePool, tokenA,account1 } = await loadFixture(deployMockAAVEPoolAddressesProvider_Fixture);
        await expect(mockAavePool.connect(account1).supply(tokenA.address, 0, account1.address, 0))
        .to.revertedWith("Amount to supply should be > 0")
      })
      it("Should revert with a 0 onBehalf address", async function() {
        const { mockAavePool, tokenA,account1 } = await loadFixture(deployMockAAVEPoolAddressesProvider_Fixture);
        await expect( mockAavePool.connect(account1).supply(tokenA.address, Constant.TOKENA_DEPOSIT_AMOUNT,Constant.ADDRESS_0, 0))
        .to.revertedWith("Address to use on behalf of should not be zero address")
      })

      it("Should supply token to the pool", async function () {
          const { mockAavePool, tokenA, account1} = await loadFixture(deployMockAAVEPoolAddressesProvider_Fixture);

          // check balance and allowance before test
          expect(await tokenA.balanceOf(mockAavePool.address)).to.equal(0)
          expect( await tokenA.allowance(account1.address, mockAavePool.address)).to.equal(0)

          //add allowance
          await tokenA.connect(account1).approve(mockAavePool.address, Constant.TOKENA_DEPOSIT_AMOUNT)
          
          //check allowance
          expect( await tokenA.allowance(account1.address, mockAavePool.address)).to.equal(Constant.TOKENA_DEPOSIT_AMOUNT)

          //supply token to pool
          await mockAavePool.connect(account1).supply(tokenA.address, Constant.TOKENA_DEPOSIT_AMOUNT, account1.address, 0)

          //check balance
          expect(await tokenA.balanceOf(mockAavePool.address)).to.equals(Constant.TOKENA_DEPOSIT_AMOUNT);
          //check allowance
          expect( await tokenA.allowance(account1.address, mockAavePool.address)).to.equal(0)
      })
    })

    describe("withdraw() tests", function () {

      it("Should revert with a 0 address for token", async function() {
        const { mockAavePool, account1 } = await loadFixture(deployMockAAVEPoolAddressesProvider_Fixture);
        await expect(mockAavePool.connect(account1).withdraw(Constant.ADDRESS_0, Constant.TOKENA_DEPOSIT_AMOUNT, account1.address))
        .to.revertedWith("Asset address provided should not be zero address")
      })
      it("Should revert with a 0 amount", async function() {
        const { mockAavePool, tokenA,account1 } = await loadFixture(deployMockAAVEPoolAddressesProvider_Fixture);
        await expect(mockAavePool.connect(account1).withdraw(tokenA.address, 0, account1.address))
        .to.revertedWith("Amount to supply should be > 0")
      })
      it("Should revert with a 0 onBehalf address", async function() {
        const { mockAavePool, tokenA,account1 } = await loadFixture(deployMockAAVEPoolAddressesProvider_Fixture);
        await expect( mockAavePool.connect(account1).withdraw(tokenA.address, Constant.TOKENA_DEPOSIT_AMOUNT,Constant.ADDRESS_0))
        .to.revertedWith("Target address should not be zero address")
      })

      it("Should withdraw token to the pool", async function () {
        const { mockAavePool,owner,  tokenA, account1 } = await loadFixture(deployMockAAVEPoolAddressesProvider_Fixture);

        // check balance and allowance before test
        expect(await tokenA.balanceOf(mockAavePool.address)).to.equal(0)
        expect( await tokenA.allowance(account1.address, mockAavePool.address)).to.equal(0)

        //add allowance
        await tokenA.connect(account1).approve(mockAavePool.address, Constant.TOKENA_DEPOSIT_AMOUNT)

        //check added allowance
        expect( await tokenA.allowance(account1.address, mockAavePool.address)).to.equal( Constant.TOKENA_DEPOSIT_AMOUNT)

        //supply token to pooll
        await mockAavePool.connect(account1).supply(tokenA.address, Constant.TOKENA_DEPOSIT_AMOUNT, account1.address, 0)

        //check balance and allowance
        expect( await tokenA.allowance(account1.address, mockAavePool.address)).to.equal( 0)
        expect(await tokenA.balanceOf(mockAavePool.address)).to.equal(Constant.TOKENA_DEPOSIT_AMOUNT)

        //get Atoken
        reserveData = await(mockAavePool.getReserveData(tokenA.address))
        //console.log("await(mockAavePool.getReserveData(tokenA.address)) :" , reserveData);
        aTokenAddress = reserveData.aTokenAddress
        //console.log("reserveData.aTokenAddress :" , aTokenAddress);

        MockERC20ATokenA = await ethers.getContractFactory('MockERC20');
        mockERC20ATokenA = MockERC20ATokenA.attach(aTokenAddress)
        //console.log("mockERC20ATokenA.address : ", mockERC20ATokenA.address)
        
        //console.log("MockATokenA account1 balance: ", await(mockERC20ATokenA.balanceOf(account1.address)))
        //console.log("allowance account1 => : mockAavePool", await(mockERC20ATokenA.allowance(account1.address,mockAavePool.address)))
        await(mockERC20ATokenA.connect(account1).approve(mockAavePool.address,Constant.TOKENA_WITHDRAW_AMOUNT))
        //console.log("allowance account1 => mockAavePool : ", await(mockERC20ATokenA.allowance(account1.address,mockAavePool.address)))

        //console.log("tokentoATokenMapping : ", await(mockAavePool.tokentoATokenMapping(tokenA.address)))
 
        //withdraw token from pool
        await mockAavePool.connect(account1).withdraw( tokenA.address, Constant.TOKENA_WITHDRAW_AMOUNT, account1.address)

        //check balance
        expect(await tokenA.balanceOf(mockAavePool.address)).to.equal(Constant.TOKENA_DEPOSIT_AMOUNT.sub(Constant.TOKENA_WITHDRAW_AMOUNT))
      
      })
    })
  })
  describe ("Non Mock function tests", function (){

    describe ("getAtoken() tests", function (){
      it("Should revert with a 0 address", async function() {
        const { mockAavePool } = await loadFixture(deployMockAAVEPoolAddressesProvider_Fixture);
        await expect(mockAavePool.getAToken(Constant.ADDRESS_0)).to.revertedWith("Asset should not be a 0 address")
      })
    })


    describe ("createAToken() tests", function (){
      it("Should revert with a 0 address", async function() {
        const { mockAavePool, tokenA } = await loadFixture(deployMockAAVEPoolAddressesProvider_Fixture);
        await expect( mockAavePool.createAToken(Constant.ADDRESS_0)).to.revertedWith("Asset should not be a 0 address")
      })

      it("Should create aToken for given token", async function() {
        const { mockAavePool, tokenA } = await loadFixture(deployMockAAVEPoolAddressesProvider_Fixture);

        expect (await mockAavePool.getAToken(tokenA.address)).to.be.equals(Constant.ADDRESS_0);
        await mockAavePool.createAToken(tokenA.address);
        expect (await mockAavePool.getAToken(tokenA.address)).to.be.not.equals(Constant.ADDRESS_0);
      })

      it("Should keep same aToken if call twice", async function() {
        const { mockAavePool, tokenA } = await loadFixture(deployMockAAVEPoolAddressesProvider_Fixture);

        expect (await mockAavePool.getAToken(tokenA.address)).to.be.equals(Constant.ADDRESS_0);
        await mockAavePool.createAToken(tokenA.address);
        address1 = await mockAavePool.getAToken(tokenA.address);
        await mockAavePool.createAToken(tokenA.address);
        address2 = await mockAavePool.getAToken(tokenA.address);
        expect(address1).to.be.equals(address2)

      })

    })


    it("Should revert if calling a non monck function", async function () {
      const { mockAavePool, tokenA, account1 } = await loadFixture(deployMockAAVEPoolAddressesProvider_Fixture);

      const b32 = ethers.utils.formatBytes32String("This is a mock")

      await expect(mockAavePool.mintUnbacked(Constant.ADDRESS_0,0,Constant.ADDRESS_0,0)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.backUnbacked(Constant.ADDRESS_0, 0, 0)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.supplyWithPermit(Constant.ADDRESS_0,0,Constant.ADDRESS_0,0,0,0, b32, b32)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.borrow(Constant.ADDRESS_0,0,0,0,Constant.ADDRESS_0)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.repay(Constant.ADDRESS_0,0,0,Constant.ADDRESS_0)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.repayWithPermit(Constant.ADDRESS_0,0,0,Constant.ADDRESS_0,0,0, b32, b32)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.repayWithATokens(Constant.ADDRESS_0,0,0)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.swapBorrowRateMode(Constant.ADDRESS_0,0)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.rebalanceStableBorrowRate(Constant.ADDRESS_0, Constant.ADDRESS_0)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.setUserUseReserveAsCollateral(Constant.ADDRESS_0, false)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.liquidationCall(Constant.ADDRESS_0,Constant.ADDRESS_0,Constant.ADDRESS_0,0,false)).to.revertedWith("Not implemented for Mock")
   // await expect (mockAavePool.flashLoan(Constant.ADDRESS_0,[],[],[],Constant.ADDRESS_0,bs,0)).to.revertedWith("Not implemented for Mock")
   // await expect (mockAavePool.flashLoanSimple(Constant.ADDRESS_0,Constant.ADDRESS_0,0,bs,0)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.getUserAccountData(Constant.ADDRESS_0)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.initReserve(Constant.ADDRESS_0,Constant.ADDRESS_0,Constant.ADDRESS_0,Constant.ADDRESS_0,Constant.ADDRESS_0)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.dropReserve(Constant.ADDRESS_0)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.setReserveInterestRateStrategyAddress(Constant.ADDRESS_0,Constant.ADDRESS_0) ).to.revertedWith("Not implemented for Mock")
   // await expect (mockAavePool.setConfiguration(Constant.ADDRESS_0,conf)).to.revertedWith("Not implemented for Mock")
   // await expect (mockAavePool.getConfiguration()).to.revertedWith("Not implemented for Mock")
   // await expect (mockAavePool.getUserConfiguration()).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.getReserveNormalizedIncome(Constant.ADDRESS_0)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.getReserveNormalizedVariableDebt(Constant.ADDRESS_0) ).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.finalizeTransfer(Constant.ADDRESS_0, Constant.ADDRESS_0, Constant.ADDRESS_0,0,0,0)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.getReservesList()).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.getReserveAddressById(0)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.ADDRESSES_PROVIDER() ).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.updateBridgeProtocolFee(0)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.updateFlashloanPremiums(0,0)).to.revertedWith("Not implemented for Mock")
     
   // await expect (mockAavePool.configureEModeCategory(0, config)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.getEModeCategoryData(0)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.setUserEMode(0)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.getUserEMode(Constant.ADDRESS_0)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.resetIsolationModeTotalDebt(Constant.ADDRESS_0)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.MAX_STABLE_RATE_BORROW_SIZE_PERCENT()).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.FLASHLOAN_PREMIUM_TOTAL()).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.BRIDGE_PROTOCOL_FEE() ).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.FLASHLOAN_PREMIUM_TO_PROTOCOL()).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.MAX_NUMBER_RESERVES()).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.mintToTreasury([]) ).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.rescueTokens(Constant.ADDRESS_0, Constant.ADDRESS_0, 0)).to.revertedWith("Not implemented for Mock")
      await expect (mockAavePool.deposit(Constant.ADDRESS_0, 0, Constant.ADDRESS_0, 0)).to.revertedWith("Not implemented for Mock")
      
    })
  })
})