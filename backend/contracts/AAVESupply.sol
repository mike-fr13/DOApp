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

    function getLendingPoolAddress() external view returns (address){
        return address(lendingPool);
    }

    //deposit DAI to this contract
    function depositDAItoContract(uint _amount) external {
        DAI.transferFrom(msg.sender, address(this), _amount);
    }

    // approve for transferFrom this contract => lending pool contract
    function approveLendingPool(uint amount) external {
       DAI.approve(address(lendingPool),amount);
    }

    // supply to AAVE pool contract onBehalf of this contract
    function supplyForContract( uint256 amount) external {
        IPool(lendingPool).supply(address(DAI), amount, address(this), 0);
    }

    // supply to AAVE pool contract onBehalf of msg.sender
    function supplyForMsgSender( uint256 amount) external {
        IPool(lendingPool).supply(address(DAI), amount, msg.sender, 0);
    }

    /*
    1- call depositDAIToContract
        /!\ First you must externally call approve on the DAI contract, to get allowance for this contract to transferFrom DAI from your account
    2 - call approveLendingPool to egt allowance fro LendigPool to transferFrom ADIA from this contract
    3 - call supplyForContract or SupplyFromMessenger 
        => supplyForContract : corresponding aPolDAI will be transfer to this contract (the contract own the supply)
        => SupplyFromMsgSenger : corresponding aPolDAI will be transfer to this msg.sender (Msg.sender own the supply)

    */

}