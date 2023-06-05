const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("DexDCA", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployDexDCA() {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const DexDCA = await ethers.getContractFactory("DexDCA");
    const dexDCA = await DexDCA.deploy();

    return { dexDCA, owner, otherAccount };
  }

  describe("Deployment", function () {

    it("Should set the right owner", async function () {
      const { dexDCA, owner } = await loadFixture(deployDexDCA);

      expect(await dexDCA.owner()).to.equal(owner.address);
    });
  });

  describe("Withdrawals", function () {
  
    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { dexDCA } = await loadFixture(
          deployDexDCA
        );
        await expect(dexDCA.withdrawUSDT(BigInt(100)))
          .to.emit(dexDCA, "Withdrawal")
          .withArgs(BigInt(100), anyValue); // We accept any value as `when` arg

        await expect(dexDCA.withdrawETH(BigInt(100)))
          .to.emit(dexDCA, "Withdrawal")
          .withArgs(BigInt(100), anyValue); // We accept any value as `when` arg

        await expect(dexDCA.executeDCA())
          .to.emit(dexDCA, "DCAExecution")
          .withArgs(anyValue, anyValue); // We accept any value as `when` arg
      });
    });
  });

  describe("ExecuteDCA", function () {
  
    describe("Events", function () {
      it("Should emit an event on DCA Execution", async function () {
        const { dexDCA } = await loadFixture(
          deployDexDCA
        );
        await expect(dexDCA.executeDCA())
          .to.emit(dexDCA, "DCAExecution")
          .withArgs(anyValue, anyValue); // We accept any value as `when` arg
      });
    });
  });



});
