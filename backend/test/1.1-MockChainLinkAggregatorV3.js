const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { expect } = require('chai')
const { BigNumber } = require("ethers")

const  ADDRESS_1 = '0x0000000000000000000000000000000000000001'
const FAKE_ROUND_ID = 42


describe("MockChainLinkAggregatorV3", function () {

  async function deploylocalMockChainLinkAggregatorV3_Fixture() {
    const [owner, account1, account2, account3, account4] = await ethers.getSigners()
    const MockChainLink = await ethers.getContractFactory("MockChainLinkAggregatorV3")
    const mockChainLink = await MockChainLink.deploy(ADDRESS_1, true)
    return { mockChainLink, owner, account1, account2, account3, account4 }
  }

  describe("local Deployment", function () {
    describe("latestRoundData() tests", function () {

      it("Should return 0 before setting price", async function () {
        const { mockChainLink, owner } = await loadFixture(deploylocalMockChainLinkAggregatorV3_Fixture)
        const [roundId, price, startedAt, updatedAt, answeredInRound]  = await mockChainLink.latestRoundData()
        /*
        console.log('roundID : ', roundId);
        console.log('price : ', price);
        console.log('startedAt : ', startedAt);
        console.log('updatedAt : ', updatedAt);
        console.log('answeredInRound : ', answeredInRound);
        */
        expect(price).to.equal(0)
      })
      it("Should return a 0 roundID before setting a first price", async function () {
        const { mockChainLink, owner } = await loadFixture(deploylocalMockChainLinkAggregatorV3_Fixture)
        const [roundId, price, startedAt, updatedAt, answeredInRound]  = await mockChainLink.latestRoundData()
        expect(roundId).to.equal(0)
      })
      it("Should return a 0 startedAt timestamp before setting a first price", async function () {
        const { mockChainLink, owner } = await loadFixture(deploylocalMockChainLinkAggregatorV3_Fixture)
        const [roundId, price, startedAt, updatedAt, answeredInRound]  = await mockChainLink.latestRoundData()
        expect(startedAt).to.equal(0)
      })
      it("Should return a 0 updatedAt timestamp before setting a first price", async function () {
        const { mockChainLink, owner } = await loadFixture(deploylocalMockChainLinkAggregatorV3_Fixture)
        const [roundId, price, startedAt, updatedAt, answeredInRound]  = await mockChainLink.latestRoundData()
        expect(updatedAt).to.equal(0)
      })
      it("Should return a 0 for answeredInRound ", async function () {
        const { mockChainLink, owner } = await loadFixture(deploylocalMockChainLinkAggregatorV3_Fixture)
        const [roundId, price, startedAt, updatedAt, answeredInRound]  = await mockChainLink.latestRoundData()
        expect(answeredInRound).to.equal(0)
      })

      
      it("Should return correct value after setting price ", async function () {
          const { mockChainLink, owner } = await loadFixture(deploylocalMockChainLinkAggregatorV3_Fixture)
          await mockChainLink.setPrice(100)
          const [roundId, price, startedAt, updatedAt, answeredInRound]  = await mockChainLink.latestRoundData()
          /*
          console.log('roundID : ', roundId);
          console.log('price : ', price);
          console.log('startedAt : ', startedAt);
          console.log('updatedAt : ', updatedAt);
          console.log('answeredInRound : ', answeredInRound);
          */
          expect(price).to.equal(100)
      })
    })

    describe("getRoundData() tests", function () {

      it("Should return a 0 price before setting a first price", async function () {
        const { mockChainLink, owner } = await loadFixture(deploylocalMockChainLinkAggregatorV3_Fixture)
        const [roundId, price, startedAt, updatedAt, answeredInRound]  = await mockChainLink.getRoundData(FAKE_ROUND_ID)
        /*
        console.log('roundID : ', roundId);
        console.log('price : ', price);
        console.log('startedAt : ', startedAt);
        console.log('updatedAt : ', updatedAt);
        console.log('answeredInRound : ', answeredInRound);
        */
        expect(price).to.equal(0)
      })
      it("Should return a 0 roundID before setting a first price", async function () {
        const { mockChainLink, owner } = await loadFixture(deploylocalMockChainLinkAggregatorV3_Fixture)
        const [roundId, price, startedAt, updatedAt, answeredInRound]  = await mockChainLink.getRoundData(FAKE_ROUND_ID)
        expect(roundId).to.equal(0)
      })
      it("Should return a 0 startedAt timestamp before setting a first price", async function () {
        const { mockChainLink, owner } = await loadFixture(deploylocalMockChainLinkAggregatorV3_Fixture)
        const [roundId, price, startedAt, updatedAt, answeredInRound]  = await mockChainLink.getRoundData(FAKE_ROUND_ID)
        expect(startedAt).to.equal(0)
      })
      it("Should return a 0 updatedAt timestamp before setting a first price", async function () {
        const { mockChainLink, owner } = await loadFixture(deploylocalMockChainLinkAggregatorV3_Fixture)
        const [roundId, price, startedAt, updatedAt, answeredInRound]  = await mockChainLink.getRoundData(FAKE_ROUND_ID)
        expect(updatedAt).to.equal(0)
      })
      it("Should return a 0 for answeredInRound ", async function () {
        const { mockChainLink, owner } = await loadFixture(deploylocalMockChainLinkAggregatorV3_Fixture)
        const [roundId, price, startedAt, updatedAt, answeredInRound]  = await mockChainLink.getRoundData(FAKE_ROUND_ID)
        expect(answeredInRound).to.equal(0)
      })
      it("Should return correct value after setting price ", async function () {
          const { mockChainLink, owner } = await loadFixture(deploylocalMockChainLinkAggregatorV3_Fixture)
          await mockChainLink.setPrice(100)
          const [roundId, price, startedAt, updatedAt, answeredInRound]  = await mockChainLink.getRoundData(FAKE_ROUND_ID)
          /*
          console.log('roundID : ', roundId);
          console.log('price : ', price);
          console.log('startedAt : ', startedAt);
          console.log('updatedAt : ', updatedAt);
          console.log('answeredInRound : ', answeredInRound);
          */
          expect(price).to.equal(100)
      })
      it("Should increment roundID by 1 after setting a price", async function () {
        const { mockChainLink, owner } = await loadFixture(deploylocalMockChainLinkAggregatorV3_Fixture)
        const [roundId, price, startedAt, updatedAt, answeredInRound]  = await mockChainLink.getRoundData(FAKE_ROUND_ID)
        expect(roundId).to.equal(0)
        await mockChainLink.setPrice(100)
        const [roundId2, price2, startedAt2, updatedAt2, answeredInRound2]  = await mockChainLink.getRoundData(FAKE_ROUND_ID)
        expect(roundId2).to.equal(1)
        await mockChainLink.setPrice(100)
        const [roundId3, price3, startedAt3, updatedAt3, answeredInRound3]  = await mockChainLink.getRoundData(FAKE_ROUND_ID)
        expect(roundId3).to.equal(2)
      })

    })


    describe("description() tests", function () {
      it("Should return 'Local Mock' description when locally deployed  ", async function () {
        const { mockChainLink, owner } = await loadFixture(deploylocalMockChainLinkAggregatorV3_Fixture)
        await mockChainLink.setPrice(100)
        description  = await mockChainLink.description()
        expect(description).to.equal('Local Mock')
      })
    })
  
    describe("decimals() tests", function () {
      it("Should return 8 when locally deployed  ", async function () {
        const { mockChainLink, owner } = await loadFixture(deploylocalMockChainLinkAggregatorV3_Fixture)
        await mockChainLink.setPrice(100)
        decimals  = await mockChainLink.decimals()
        expect(decimals).to.equal(8)
      })
    })

    describe("version() tests", function () {
      it("Should return 0 when locally deployed  ", async function () {
        const { mockChainLink, owner } = await loadFixture(deploylocalMockChainLinkAggregatorV3_Fixture)
        await mockChainLink.setPrice(100)
        version  = await mockChainLink.version()
        expect(version).to.equal(0)
      })
    })

  })
})
