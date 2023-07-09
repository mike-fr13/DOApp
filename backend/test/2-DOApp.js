const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");


describe("DOApp", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployDOAppFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, account1, account2, account3, account4] = await ethers.getSigners();
    const DOApp = await ethers.getContractFactory("DOApp");
    const dOApp = await DOApp.deploy();

    const TokenA = await ethers.getContractFactory("MockERC20");
    const tokenA = await TokenA.deploy("Mock Token A", "MCKA", 1000);

    const TokenB = await ethers.getContractFactory("MockERC20");
    const tokenB = await TokenB.deploy("Mock Token B", "MCKB",1000);


    return { dOApp, tokenA, tokenB, owner, account1, account2, account3, account4 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { dOApp, owner } = await loadFixture(deployDOAppFixture);
      expect(await dOApp.owner()).to.equal(owner.address);
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
