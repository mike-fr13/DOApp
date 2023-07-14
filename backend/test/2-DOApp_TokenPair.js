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
          tokenA.address, Constant.TOCKEN_PAIR_SEGMENT_SIZE, Constant.TOCKEN_PAIR_DECIMAL_NUMBER,
          tokenB.address, 
          mockChainLinkAggregatorV3.address))
          .to.revertedWith("Ownable: caller is not the owner")
      });
      it('Should revert when trying to add a pair with a null tokenA address', async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
          = await loadFixture(Fixture.deployDOApp_Fixture);
        await expect(doApp.addTokenPair(
          Constant.ADDRESS_0,  Constant.TOCKEN_PAIR_SEGMENT_SIZE, Constant.TOCKEN_PAIR_DECIMAL_NUMBER,
          tokenB.address, 
          mockChainLinkAggregatorV3.address))
          .to.be.revertedWith('tokenA address must be defined')
      })

      it('Should revert when trying to add a pair with a null tokenB address', async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
          = await loadFixture(Fixture.deployDOApp_Fixture);
        await expect(doApp.addTokenPair(
          tokenA.address,Constant.TOCKEN_PAIR_SEGMENT_SIZE, Constant.TOCKEN_PAIR_DECIMAL_NUMBER,
          Constant.ADDRESS_0, 
          mockChainLinkAggregatorV3.address))
          .to.be.revertedWith('tokenB address must be defined')
      })
      it('Should revert when trying to add a pair with a null ChainLinkAggregatorV3 address', async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
          = await loadFixture(Fixture.deployDOApp_Fixture);
        await expect(doApp.addTokenPair(
          tokenA.address,Constant.TOCKEN_PAIR_SEGMENT_SIZE, Constant.TOCKEN_PAIR_DECIMAL_NUMBER,
          tokenB.address,
          Constant.ADDRESS_0))
          .to.be.revertedWith('Chain Link Price Fetcher must be defined')
      })

      it('Should add a token Pair and emit TokenPAirAdded event', async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
          = await loadFixture(Fixture.deployDOApp_Fixture);
        //console.log("tokenA : ", tokenA.address);
        //console.log("tokenB : ", tokenB.address);
        await expect(doApp.addTokenPair(
          tokenA.address,Constant.TOCKEN_PAIR_SEGMENT_SIZE, Constant.TOCKEN_PAIR_DECIMAL_NUMBER,
          tokenB.address,
          mockChainLinkAggregatorV3.address))
          .to.emit(doApp,'TokenPAirAdded').withArgs(anyValue, tokenA.address, tokenB.address, mockChainLinkAggregatorV3.address)
      })

      it('Should be able to get an added tokenPair', async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
          = await loadFixture(Fixture.deployDOApp_Fixture);
        //console.log("tokenA : ", tokenA.address);
        //console.log("tokenB : ", tokenB.address);
        await (doApp.addTokenPair(
          tokenA.address,Constant.TOCKEN_PAIR_SEGMENT_SIZE, Constant.TOCKEN_PAIR_DECIMAL_NUMBER,
          tokenB.address,
          mockChainLinkAggregatorV3.address))

        let eventFilter = doApp.filters.TokenPAirAdded()
        let events = await doApp.queryFilter(eventFilter, 'latest')
        let hashOfPair = events[0].args[0]
        let tokenPair = await doApp.tokenPairs(hashOfPair)
        //console.log(tokenPair)
        expect (tokenPair.tokenAddressA).to.equal(tokenA.address)
        expect (tokenPair.tokenPairSegmentSize).to.equal(Constant.TOCKEN_PAIR_SEGMENT_SIZE)
        expect (tokenPair.tokenPairDecimalNumber).to.equal(Constant.TOCKEN_PAIR_DECIMAL_NUMBER)
        expect (tokenPair.tokenAddressB).to.equal(tokenB.address)
        expect (tokenPair.chainlinkPriceFetcher).to.equal(mockChainLinkAggregatorV3.address)
        expect (tokenPair.enabled).to.be.false
      })

      it('Should revert when trying to add the same tokenPair', async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
          = await loadFixture(Fixture.deployDOApp_Fixture);
        await (doApp.addTokenPair(
          tokenA.address, Constant.TOCKEN_PAIR_SEGMENT_SIZE, Constant.TOCKEN_PAIR_DECIMAL_NUMBER,
          tokenB.address, 
          mockChainLinkAggregatorV3.address))
        await expect(doApp.addTokenPair(
          tokenA.address, Constant.TOCKEN_PAIR_SEGMENT_SIZE, Constant.TOCKEN_PAIR_DECIMAL_NUMBER,
          tokenB.address, 
          mockChainLinkAggregatorV3.address))
        .to.revertedWith("Token Pair Allready Defined")
      })

      it('Should revert when trying to add the same tokenPair with a revert order', async function () {
        const {doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
          = await loadFixture(Fixture.deployDOApp_Fixture);
        await (doApp.addTokenPair(
          tokenA.address, Constant.TOCKEN_PAIR_SEGMENT_SIZE, Constant.TOCKEN_PAIR_DECIMAL_NUMBER,
          tokenB.address, 
          mockChainLinkAggregatorV3.address))
        await expect(doApp.addTokenPair(
          tokenB.address, Constant.TOCKEN_PAIR_SEGMENT_SIZE, Constant.TOCKEN_PAIR_DECIMAL_NUMBER,
          tokenA.address, 
          mockChainLinkAggregatorV3.address))
        .to.revertedWith("Token Pair Allready Defined")
      })
    })
  })
});
