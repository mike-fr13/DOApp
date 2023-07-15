// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import "@aave/core-v3/contracts/interfaces/IPool.sol";


/**
 * @author  Yannick Tison
 * @title   AAVE v3 IPool test : supply / withdraw ...
 * @dev     1- call depositDAIToContract
 * @dev     /!\ First you must externally call approve on the DAI contract, to get allowance for this contract to transferFrom DAI from your account
 * @dev     2 - call approveLendingPool to get allowance from LendigPool to transferFrom DAI from this contract
 * @dev     3 - call supplyForContract or SupplyFromMessenger 
 * @dev         => supplyForContract : corresponding aPolDAI will be transfer to this contract (the contract own the supply)
 * @dev         => SupplyFromMsgSenger : corresponding aPolDAI will be transfer to this msg.sender (Msg.sender own the supply)
 * @dev     4 - call withdrawFromAAVEToContract or withdrawFromAAVEToMsgSender
 * @dev         => withdrawFromAAVEToContract : redeem aPolDAI from currrent contract and get back DAI to current contract
 * @dev         => withdrawFromAAVEToMsgSender : redeem aPolDAI from currrent contract and get back DAI to msg.sender
 * @notice  just test it ! 
 * @notice  hardcoded token (DAI) and IPoolAddressProvider are mumbai configuration
 * @notice  see : https://docs.aave.com/developers/deployed-contracts/v3-testnet-addresses#polygon-mumbai  
 */

contract AAVEv3IPoolTest {

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

    // get ReserveData for specified asset 
    // see https://docs.aave.com/developers/core-contracts/pool#getreservedata
    // https://github.com/aave/aave-v3-core/blob/27a6d5c83560694210849d4abf09a09dec8da388/contracts/interfaces/IPool.sol#L582
    function getReserveData(address _asset) external view returns(DataTypes.ReserveData memory) {
        return IPool(lendingPool).getReserveData(_asset);
    }

    function getAtokenAddress(address _asset) external view returns(address aTokenAddress) {
        return IPool(lendingPool).getReserveData(_asset).aTokenAddress;
    }

    // see 
    // https://github.com/aave/aave-v3-core/blob/27a6d5c83560694210849d4abf09a09dec8da388/contracts/interfaces/IPool.sol#L477
    // https://docs.aave.com/developers/core-contracts/pool#getuseraccountdata
    function getUserAccountData(address _user) external view returns (
      uint256 totalCollateralBase,
      uint256 totalDebtBase,
      uint256 availableBorrowsBase,
      uint256 currentLiquidationThreshold,
      uint256 ltv,
      uint256 healthFactor
    ) {
        return (IPool(lendingPool).getUserAccountData(_user));
    }

}