
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { IPool } from "@aave/core-v3/contracts/interfaces/IPool.sol";
import { IPoolAddressesProvider } from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import { IAToken } from "@aave/core-v3/contracts/interfaces/IAToken.sol";

contract Deposit {

    constructor() {} 
 
    function setDeposit() public returns(uint256) {
        IPoolAddressesProvider provider = IPoolAddressesProvider(address(0xC911B590248d127aD18546B186cC6B324e99F02c));
        IPool pool = IPool(provider.getPool());
        IERC20(0xe9c4393a23246293a8D31BF7ab68c17d4CF90A29).transferFrom(msg.sender, address(this), 1*10**10);
        IERC20(0xe9c4393a23246293a8D31BF7ab68c17d4CF90A29).approve(address(pool), type(uint256).max);
        pool.deposit(0xe9c4393a23246293a8D31BF7ab68c17d4CF90A29, 100, 0x158deb9F418f6800c57808eBcB5506517361eEFc, 0);
        return IERC20(0xe9c4393a23246293a8D31BF7ab68c17d4CF90A29).allowance(address(this), address(pool));
    }
} 

interface IERC20 {
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}