const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { expect } = require('chai')
const { BigNumber } = require("ethers")
const Constant = require("./lib/Constants.js")


describe("MockAAVEPoolAddressesProvider", function () {

  async function deployMockAAVEPoolAddressesProvider_Fixture () {
    const [owner, account1, account2, account3, account4] = await ethers.getSigners()
    const MockAAVEPoolAddressesProvider = await ethers.getContractFactory("MockAAVEPoolAddressesProvider")
    const mockAAVEPoolAddressesProvider = await MockAAVEPoolAddressesProvider.deploy()

    const MockAavePool = await ethers.getContractFactory("MockAavePool")
    const mockAavePool = await MockAavePool.deploy()

    return { mockAAVEPoolAddressesProvider, mockAavePool, owner, account1, account2, account3, account4 }
  }

  describe("getPool() tests", function () {
    it("Should return an empty address after contract init", async function () {
      const  { mockAAVEPoolAddressesProvider, owner, account1, account2, account3, account4 } 
          = await loadFixture(deployMockAAVEPoolAddressesProvider_Fixture);
          expect (await mockAAVEPoolAddressesProvider.getPool()).to.equal(Constant.ADDRESS_0);
    })
  })

  describe("setPoolImpl() tests", function () {
    it("Should return a Pool contract", async function () {
      const  { mockAAVEPoolAddressesProvider, mockAavePool} 
          = await loadFixture(deployMockAAVEPoolAddressesProvider_Fixture);

          expect (await mockAAVEPoolAddressesProvider.getPool()).to.equal(Constant.ADDRESS_0)
          await mockAAVEPoolAddressesProvider.setPoolImpl(mockAavePool.address)
          expect (await mockAAVEPoolAddressesProvider.getPool()).to.equal(mockAavePool.address)
    })
  })


  describe ("Non Mock function tests", function (){
    it("Should revert if calling a non monck function", async function () {
      const { mockAAVEPoolAddressesProvider, tokenA, account1 } = await loadFixture(deployMockAAVEPoolAddressesProvider_Fixture);

      const b32 = ethers.utils.formatBytes32String("This is a mock")

      await expect(mockAAVEPoolAddressesProvider.getMarketId()).to.revertedWith("Not implemented for Mock")
      await expect(mockAAVEPoolAddressesProvider.setMarketId('')).to.revertedWith("Not implemented for Mock")
      await expect(mockAAVEPoolAddressesProvider.getAddress(b32)).to.revertedWith("Not implemented for Mock")
      await expect(mockAAVEPoolAddressesProvider.setAddressAsProxy(b32, Constant.ADDRESS_0)).to.revertedWith("Not implemented for Mock")
      await expect(mockAAVEPoolAddressesProvider.setAddress(b32, Constant.ADDRESS_0)).to.revertedWith("Not implemented for Mock")
      await expect(mockAAVEPoolAddressesProvider.getPoolConfigurator()).to.revertedWith("Not implemented for Mock")
      await expect(mockAAVEPoolAddressesProvider.setPoolConfiguratorImpl(Constant.ADDRESS_0)).to.revertedWith("Not implemented for Mock")
      await expect(mockAAVEPoolAddressesProvider.getPriceOracle()).to.revertedWith("Not implemented for Mock")
      await expect(mockAAVEPoolAddressesProvider.setPriceOracle(Constant.ADDRESS_0)).to.revertedWith("Not implemented for Mock")
      await expect(mockAAVEPoolAddressesProvider.getACLManager()).to.revertedWith("Not implemented for Mock")
      await expect(mockAAVEPoolAddressesProvider.setACLManager(Constant.ADDRESS_0)).to.revertedWith("Not implemented for Mock")
      await expect(mockAAVEPoolAddressesProvider.getACLAdmin()).to.revertedWith("Not implemented for Mock")
      await expect(mockAAVEPoolAddressesProvider.setACLAdmin(Constant.ADDRESS_0)).to.revertedWith("Not implemented for Mock")
      await expect(mockAAVEPoolAddressesProvider.getPriceOracleSentinel()).to.revertedWith("Not implemented for Mock")
      await expect(mockAAVEPoolAddressesProvider.setPriceOracleSentinel(Constant.ADDRESS_0)).to.revertedWith("Not implemented for Mock")
      await expect(mockAAVEPoolAddressesProvider.getPoolDataProvider()).to.revertedWith("Not implemented for Mock")
      await expect(mockAAVEPoolAddressesProvider.setPoolDataProvider(Constant.ADDRESS_0)).to.revertedWith("Not implemented for Mock")
   })
  })
})
