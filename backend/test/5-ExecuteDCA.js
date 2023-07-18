const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers')
const { expect } = require('chai')
const { BigNumber } = require('ethers')
const Constant = require("./lib/Constants.js")
const Fixture = require("./lib/Fixtures.js")
const {getTokenPairs} = require("../scripts/lib/DOApp_lib.js");

// DOApp contract Tests
describe('DOApp DCA execution', function () {

  // Test contract deployment
  describe('executeDCA() tests', function () {
    it('Should revert if call with a wrong token Pair', async function () {
      const { doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
        = await loadFixture(Fixture.deployDOApp_Fixture);
      expect(await doApp.owner()).to.equal(owner.address);

      tokenPairs = await getTokenPairs(doApp);
      console.log ("TokenPairs : ", tokenPairs);
      expect(tokenPairs.length == 0)
      //console.log("await doApp.callStatic.executeDCA(0) : ", await doApp.callStatic.executeDCA(0));
      //result = await (doApp.executeDCA(0));
      await expect(doApp.executeDCA(0)).to.be.revertedWith("Token Pair not Found")
    })

    it('Should do nothing whent launch executeDCA() for an existing TokenPair with oracle price not in DCA interval', async function () {
      const { doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
        = await loadFixture(Fixture.deploy_Prepare_One_DCA_Config_Fixture);
      expect(await doApp.owner()).to.equal(owner.address);

      tokenPairs = await getTokenPairs(doApp);
      console.log ("TokenPairs : ", tokenPairs);
      expect(tokenPairs.length == 1)

      await (doApp.executeDCA(tokenPairs[0]));
      hasRemainingJobs = await doApp.callStatic.executeDCA(tokenPairs[0]);
      console.log ("hasRemainingJobs : ", hasRemainingJobs)
      expect(hasRemainingJobs).to.be.false;

    })

    it('Should DCA for an existing TokenPair with oracle price set in DCA interval', async function () {
      const { doApp, tokenA, tokenB, mockChainLinkAggregatorV3, owner, account1, account2, account3, account4} 
        = await loadFixture(Fixture.deploy_Prepare_One_DCA_Config_Fixture);
      expect(await doApp.owner()).to.equal(owner.address);

      tokenPairs = await getTokenPairs(doApp);
      console.log ("TokenPairs : ", tokenPairs);
      expect(tokenPairs.length == 1)

      mockChainLinkAggregatorV3.setPrice(Constant.DCA_CONFIG_1_MIN.add(1));

      await (doApp.executeDCA(tokenPairs[0]));
      hasRemainingJobs = await doApp.callStatic.executeDCA(tokenPairs[0]);
      console.log ("hasRemainingJobs : ", hasRemainingJobs)
      expect(hasRemainingJobs).to.be.false;

    })

  })
})
