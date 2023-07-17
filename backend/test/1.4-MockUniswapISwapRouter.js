const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { expect } = require('chai')
const { BigNumber } = require("ethers")
const Constant = require("./lib/Constants.js")


describe("MockUniswapISwapRouter", function () {

  async function deployMockUniswapISwapRouter_Fixture () {
    const [owner, account1, account2, account3, account4] = await ethers.getSigners()
    const MockUniswapISwapRouter = await ethers.getContractFactory("MockUniswapISwapRouter")
    const mockUniswapISwapRouter = await MockUniswapISwapRouter.deploy()

    const TokenA = await ethers.getContractFactory('MockERC20');
    const tokenA = await TokenA.deploy(Constant.MCKA_NAME,Constant.MCKA_SYMBOL,Constant.TOKEN_INITIAL_SUPPLY);
    await tokenA.mint(account1.address,Constant.TOKEN_INITIAL_SUPPLY)

    const TokenB = await ethers.getContractFactory('MockERC20');
    const tokenB = await TokenB.deploy(Constant.MCKB_NAME,Constant.MCKB_SYMBOL,Constant.TOKEN_INITIAL_SUPPLY);

    return { mockUniswapISwapRouter, tokenA, tokenB, owner, account1, account2, account3, account4 }

  }

  describe("exactInputSingle() tests", function () {
    it("Should return an empty address after contract init", async function () {
      const  { mockUniswapISwapRouter, tokenA, tokenB, account1 } 
          = await loadFixture(deployMockUniswapISwapRouter_Fixture);

      const UNISWAP_FEE_TIERS = BigNumber.from(3000);
      const exactInputSingleParams = {
            tokenIn: tokenA.address,
            tokenOut: tokenB.address,
            fee: UNISWAP_FEE_TIERS,
            recipient: account1.address,
            deadline: Date.now() + 15,
            amountIn: Constant.TOKENA_WITHDRAW_AMOUNT,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
      }



      // Approve the router to spend WETH9.
      console.log("account1 tockenA balance : ", await(tokenA.balanceOf(account1.address)))
      console.log("account1 tockenB balance : ", await(tokenB.balanceOf(account1.address)))
      console.log("allowance account1 => mockUniswapISwapRouter : ", await(tokenA.allowance(account1.address,mockUniswapISwapRouter.address)))

      await(tokenA.connect(account1).approve(mockUniswapISwapRouter.address,Constant.TOKENA_WITHDRAW_AMOUNT))

      console.log("allowance account1 => mockUniswapISwapRouter : ", await(tokenA.allowance(account1.address,mockUniswapISwapRouter.address)))

      amountOut = await mockUniswapISwapRouter.exactInputSingle(exactInputSingleParams)

      console.log("account1 tockenA balance : ", await(tokenA.balanceOf(account1.address)))
      
      tokenBbalance = await(tokenB.balanceOf(account1.address));
      console.log("account1 tockenB balance : ", tokenBbalance)

      theoricalAmount = 
        Constant.TOKENA_WITHDRAW_AMOUNT.mul(
          BigNumber.from(
            BigNumber.from(1000000)
            .sub(UNISWAP_FEE_TIERS)
            )
          )
        .div(BigNumber.from(1000000))

      console.log(" theoricalAmount : ", theoricalAmount)
      expect (tokenBbalance).to.equal(theoricalAmount);

    })
  })

  describe ("Non Mock function tests", function (){
    it("Should revert if calling a non monck function", async function () {
      const { mockUniswapISwapRouter, tokenA, tokenB, account1 } = await loadFixture(deployMockUniswapISwapRouter_Fixture);

      const b32 = ethers.utils.formatBytes32String("This is a mock")

      const exactInputParams = {
        path : b32,
        recipient : account1.address,
        deadline : 0,
        amountIn : 0,
        amountOutMinimum :0
      }

      await expect(mockUniswapISwapRouter.exactInput(exactInputParams))
      .to.revertedWith("Not implemented for Mock")
      
      const exactOutputSingleParams = {
        tokenIn: tokenA.address ,
        tokenOut: tokenB.address ,
        fee :0,
        recipient: account1.address ,
        deadline: 0,
        amountOut: 0,
        amountInMaximum: 0,
        sqrtPriceLimitX96: 0
      }

      await expect(mockUniswapISwapRouter.exactOutputSingle(exactOutputSingleParams))
      .to.revertedWith("Not implemented for Mock")

      const exactOutputParams = {
        path : b32,
        recipient : account1.address ,
        deadline:0,
        amountOut:0,
        amountInMaximum:0
      }
      await expect(mockUniswapISwapRouter.exactOutput(exactOutputParams))
      .to.revertedWith("Not implemented for Mock")

      await expect(mockUniswapISwapRouter.uniswapV3SwapCallback(
        0 ,
        0 ,
        b32 ))
        .to.revertedWith("Not implemented for Mock")
        
   })
  })
})
