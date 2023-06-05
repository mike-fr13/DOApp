// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DexDCA is Ownable {
    uint public unlockTime;

    event Deposit(uint amount, uint when);
    event Withdrawal(uint amount, uint when);
    event DCAExecution(uint amount, uint when);
    
    constructor() payable {

    }

    function depositUSDT(uint _amount) external {

        emit Deposit(_amount, block.timestamp);
    }

    function withdrawUSDT(uint _amount) external {

        emit Withdrawal(_amount, block.timestamp);
    }

    function withdrawETH(uint _amount) external {

        emit Withdrawal(_amount, block.timestamp);
    }

    function addOrUpdateDCAConfig() external  {

    }

    function disableDCAConfig() external  {

    }

    function deleteDCAConfig() external  {

    }

    function executeDCA() external {
        uint amount;

        calculateDCA();
        OTCTransaction();

        emit DCAExecution(amount, block.timestamp);
   }

   function calculateDCA() internal {
   }

   function OTCTransaction() internal {

   }

   function swap() internal {

   }

   function stackUSDT() internal {

   }

   function stackETH() internal {

   }

}