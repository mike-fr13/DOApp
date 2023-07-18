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
})