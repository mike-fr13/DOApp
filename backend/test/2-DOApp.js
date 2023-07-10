const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { expect } = require('chai')
const { BigNumber } = require("ethers")
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

const ADDRESS_0 = "0x0000000000000000000000000000000000000000"
const MCKA_NAME = "Mock Token A"
const MCKA_SYMBOL = "MCKA"
const MCKB_NAME = "Mock Token B"
const MCKB_SYMBOL = "MCKB"
const INITIAL_SUPPLY = 1000

describe("DOApp", function () {

  async function deployDOAppFixture() {
    const [owner, account1, account2, account3, account4] = await ethers.getSigners();
    const DOApp = await ethers.getContractFactory("DOApp");
    const dOApp = await DOApp.deploy();

    const TokenA = await ethers.getContractFactory("MockERC20");
    const tokenA = await TokenA.deploy(MCKA_NAME,MCKA_SYMBOL,INITIAL_SUPPLY);

    const TokenB = await ethers.getContractFactory("MockERC20");
    const tokenB = await TokenB.deploy(MCKB_NAME,MCKB_SYMBOL,INITIAL_SUPPLY);

    const MockChainLinkAggregatorV3 = await ethers.getContractFactory("MockChainLinkAggregatorV3");
    const mockChainLinkAggregatorV3 = await MockChainLinkAggregatorV3.deploy(ADDRESS_0,true);


    return { dOApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { dOApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
        = await loadFixture(deployDOAppFixture);
      expect(await dOApp.owner()).to.equal(owner.address);
    });
  });


  describe("Token Pair Management", function () {
    it("Should add a token Pair", async function () {
      const {dOApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} = await loadFixture(deployDOAppFixture);
      //console.log("tokenA : ", tokenA.address);
      //console.log("tokenB : ", tokenB.address);
      await expect(dOApp.addTokenPair(tokenA.address, tokenB.address, mockChainLinkAggregatorV3.address))
                    .to.emit(dOApp,"TokenPAirAdded").withArgs(anyValue, tokenA.address, tokenB.address, mockChainLinkAggregatorV3.address)

      let eventFilter = dOApp.filters.TokenPAirAdded()
      let events = await dOApp.queryFilter(eventFilter, "latest")
      let hashOfPair = events[0].args[0]
      //console.log("hashPair : ",hashOfPair)
      let tokenPair = await dOApp.tokenPairs(hashOfPair)
      //console.log(tokenPair)
      expect (tokenPair.TokenAddressA).to.equal(tokenA.address)
      expect (tokenPair.TokenAddressB).to.equal(tokenB.address)
      expect (tokenPair.ChainlinkPriceFetcher).to.equal(mockChainLinkAggregatorV3.address)
      expect (tokenPair.enabled).to.be.false
    });

    it("Should revert when trying to add a pair with a null tokenA address", async function () {
      const {dOApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} = await loadFixture(deployDOAppFixture);
      await expect(dOApp.addTokenPair(ADDRESS_0, tokenB.address, mockChainLinkAggregatorV3.address))
                    .to.be.revertedWith("tokenA address must be defined")
    });

    it("Should revert when trying to add a pair with a null tokenB address", async function () {
      const {dOApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} = await loadFixture(deployDOAppFixture);
      await expect(dOApp.addTokenPair(tokenA.address,ADDRESS_0, mockChainLinkAggregatorV3.address))
                    .to.be.revertedWith("tokenB address must be defined")
    });


  });

  /*
  describe("Withdrawals", function () {
  
    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { dOApp } = await loadFixture(deployDOAppFixture);

        await expect(dOApp.withdrawUSDT(BigInt(100)))
          .to.emit(dOApp, "Withdrawal")
          .withArgs(BigInt(100), anyValue); // We accept any value as `when` arg

        await expect(dOApp.withdrawETH(BigInt(100)))
          .to.emit(dOApp, "Withdrawal")
          .withArgs(BigInt(100), anyValue); // We accept any value as `when` arg

        await expect(dOApp.executeDCA())
          .to.emit(dOApp, "DCAExecution")
          .withArgs(anyValue, anyValue); // We accept any value as `when` arg
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
