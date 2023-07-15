// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";


contract Uniswap {


    constructor () payable {
    }
   
    function getBalance() public view returns (uint) {
        return address(this).balance;    
    }
   
   
   // calculate price based on pair reserves
   function getTokenPrice(address pairAddress, uint amount) public payable returns(uint)
   {
    IUniswapV2Pair pair = IUniswapV2Pair(pairAddress);
    IERC20 token1 = IERC20(pair.token1());
   
   
    (uint Res0, uint Res1,) = pair.getReserves();

    // decimals
    uint res0 = Res0*(10**pair.decimals());
    return((amount*res0)/Res1); // return amount of token0 needed to buy token1
   }
   
}