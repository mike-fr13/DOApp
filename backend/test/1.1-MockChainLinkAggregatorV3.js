const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { expect } = require('chai')
const { BigNumber } = require("ethers")

const  ADDRESS_1 = '0x0000000000000000000000000000000000000001';


describe("MockChainLinkAggregatorV3", function () {
  
  async function deployMockChainLinkAggregatorV3_localFixture() {
    const [owner, account1, account2, account3, account4] = await ethers.getSigners()
    const MockChainLink = await ethers.getContractFactory("MockChainLinkAggregatorV3")
    const mockChainLink = await MockChainLink.deploy(ADDRESS_1, true)
    return { mockChainLink, owner, account1, account2, account3, account4 }
  }

  describe("latestRoundData() tests", function () {

    it("Should return 0 before setting price", async function () {
      const { mockChainLink, owner } = await loadFixture(deployMockChainLinkAggregatorV3_localFixture)
      let price  = await mockChainLink.latestRoundData()
      expect(price).to.equal(0)
    })

    
    it("Should return correct value after setting price ", async function () {
        const { mockChainLink, owner } = await loadFixture(deployMockChainLinkAggregatorV3_localFixture)
        await mockChainLink.setPrice(100)
        let price  = await mockChainLink.latestRoundData()
        expect(price).to.equal(100)
    })
    
  })

})
