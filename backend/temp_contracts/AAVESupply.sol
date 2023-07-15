// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import "@aave/core-v3/contracts/interfaces/IPool.sol";

contract AAVESupply {

    IERC20 DAI = IERC20(0xF14f9596430931E177469715c591513308244e8F);

    IPoolAddressesProvider provider = IPoolAddressesProvider(
        address(0xeb7A892BB04A8f836bDEeBbf60897A7Af1Bf5d7F)
    );

    IPool public lendingPool = IPool(provider.getPool());

    //deposit DAI from Msg.sender to this contract
    function depositDAItoContract(uint _amount) external {
        DAI.transferFrom(msg.sender, address(this), _amount);
    }

    // approve for transferFrom this contract => lending pool contract
    function approveLendingPool(uint _amount) external {
       DAI.approve(address(lendingPool),_amount);
    }

    // supply to AAVE pool contract onBehalf of this contract (current contract will get AToken)
    function supplyForContract( uint256 _amount) external {
        IPool(lendingPool).supply(address(DAI), _amount, address(this), 0);
    }

    // supply to AAVE pool contract onBehalf of msg.sender (msg.sender will get Atoken)
    function supplyForMsgSender( uint256 _amount) external {
        IPool(lendingPool).supply(address(DAI), _amount, msg.sender, 0);
    }

    //withdraw stacking token from current contract to current contract
    function withdrawFromAAVEToContract (uint256 _amount) external {
        IPool(lendingPool).withdraw(address(DAI), _amount, address(this));
    }

    //Withdraw stacking token from current contact to msg.sender
    function withdrawFromAAVEToMsgSender (uint256 _amount) external {
        IPool(lendingPool).withdraw(address(DAI), _amount, msg.sender);
    }

    function getAllowanceBetweenMsgSenderAndCurrentContract() external view returns (uint) {
        return DAI.allowance(msg.sender, address(this));
    }

    function getAllowanceBetweenCurrentContractAndLendingPool() external view returns (uint) {
        return DAI.allowance(address(this),address(lendingPool));
    }

    /*
    1- call depositDAIToContract
        /!\ First you must externally call approve on the DAI contract, to get allowance for this contract to transferFrom DAI from your account
    2 - call approveLendingPool to get allowance from LendigPool to transferFrom DAI from this contract
    3 - call supplyForContract or SupplyFromMessenger 
        => supplyForContract : corresponding aPolDAI will be transfer to this contract (the contract own the supply)
        => SupplyFromMsgSenger : corresponding aPolDAI will be transfer to this msg.sender (Msg.sender own the supply)
    4 - call withdrawFromAAVEToContract or withdrawFromAAVEToMsgSender
        => withdrawFromAAVEToContract : redeem aPolDAI from currrent contract and get back DAI to current contract
        => withdrawFromAAVEToMsgSender : redeem aPolDAI from currrent contract and get back DAI to msg.sender
    */

}