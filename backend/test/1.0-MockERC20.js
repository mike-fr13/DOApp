const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { expect } = require('chai')
const { BigNumber } = require("ethers")

const ERC20_NAME = "Mock Token A"
const ERC20_SYMBOL = "MCKA"
const INITIAL_SUPPLY = 1000

describe("MockERC20", function () {

  async function deployMockERC20Fixture() {
    const [owner, account1, account2, account3, account4] = await ethers.getSigners()
    const TokenA = await ethers.getContractFactory("MockERC20")
    const tokenA = await TokenA.deploy(ERC20_NAME, ERC20_SYMBOL, INITIAL_SUPPLY)
    return { tokenA, owner, account1, account2, account3, account4 }
  }

  describe("Deployment", function () {

    it("Should have correct name ", async function () {
      const { tokenA, owner } = await loadFixture(deployMockERC20Fixture)
      let tokenAName = await tokenA.name()
      expect(ERC20_NAME).to.equal(tokenAName)
    })

    it("Should have correct symbol ", async function () {
      const { tokenA, owner } = await loadFixture(deployMockERC20Fixture)
      let tokenASymbol = await tokenA.symbol()
      expect(tokenASymbol).to.equal(ERC20_SYMBOL)
    })

    it("Should have correct inital balance ", async function () {
      const { tokenA, owner } = await loadFixture(deployMockERC20Fixture)
      let balance = await tokenA.balanceOf(owner.address)
      expect(balance).to.equal(INITIAL_SUPPLY)
    })

    it("Should mint a specified amount for a specified wallet ", async function () {
      const { tokenA, owner, account1 } = await loadFixture(deployMockERC20Fixture)
      let balance = await tokenA.balanceOf(account1.address)
      expect(balance).to.equal(0)
      await tokenA.mint(account1.address,INITIAL_SUPPLY)
      balance = await tokenA.balanceOf(account1.address)
      expect(balance).to.equal(INITIAL_SUPPLY)
    })


  })

})
