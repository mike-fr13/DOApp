// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import "@aave/core-v3/contracts/interfaces/IPool.sol";


/**
 * @title AAVE v3 IPool Test: Supply / Withdraw
 * @dev This contract demonstrates the process of supplying and withdrawing funds from AAVE v3 IPool.
 *      See see https://docs.aave.com/developers/core-contracts/pool
 *      See https://github.com/aave/aave-v3-core/blob/27a6d5c83560694210849d4abf09a09dec8da388/contracts/interfaces/IPool.sol
 *      Usage :
 *      1- Call depositDAIToContract.
 *         /!\ First, you must externally call approve on the DAI contract to allow this contract to transferFrom DAI from your account.
 *      2 - Call approveLendingPool to get allowance from LendingPool to transferFrom DAI from this contract.
 *      3 - Call supplyForContract or supplyFromMessenger.
 *         => supplyForContract: Corresponding aPolDAI will be transferred to this contract (the contract owns the supply).
 *         => supplyFromMessenger: Corresponding aPolDAI will be transferred to msg.sender (msg.sender owns the supply).
 *      4 - Call withdrawFromAAVEToContract or withdrawFromAAVEToMsgSender.
 *         => withdrawFromAAVEToContract: Redeem aPolDAI from the current contract and receive DAI back to the current contract.
 *         => withdrawFromAAVEToMsgSender: Redeem aPolDAI from the current contract and receive DAI back to msg.sender.
 * @notice Just for testing purposes!
 *         Hardcoded token (DAI) and IPoolAddressProvider are for the Mumbai configuration.
 *         See: https://docs.aave.com/developers/deployed-contracts/v3-testnet-addresses#polygon-mumbai
 */


pragma solidity >=0.8.0;

/**
 * @title AAVEv3IPoolTest
 * @dev This contract provides functions to interact with the AAVE v3 IPool for testing purposes.
 */
contract AAVEv3IPoolTest {

    IERC20 DAI = IERC20(0xF14f9596430931E177469715c591513308244e8F);

    IPoolAddressesProvider provider = IPoolAddressesProvider(
        address(0xeb7A892BB04A8f836bDEeBbf60897A7Af1Bf5d7F)
    );

    IPool public lendingPool = IPool(provider.getPool());

    /**
     * @dev Deposits DAI from the caller to this contract
     * @param _amount The amount of DAI to deposit
     * @notice To deposit DAI, please externally call the `approve` function 
     * on the DAI contract first to allow this contract to transferFrom DAI 
     * from your account. 
     */
    function depositDAItoContract(uint256 _amount) external {
        DAI.transferFrom(msg.sender, address(this), _amount);
    }

    /**
     * @dev Approves the lending pool to spend DAI from this contract
     * @param _amount The amount of DAI to approve
     * @notice To approve the lending pool, call the `approve` function on 
     * the DAI contract to allow the lending pool to transferFrom DAI from this contract. 
     */
    function approveLendingPool(uint256 _amount) external {
        DAI.approve(address(lendingPool), _amount);
    }

    /**
     * @dev Supplies DAI to the AAVE pool on behalf of this contract (this contract will receive aTokens)
     * @param _amount The amount of DAI to supply
     * @notice To supply DAI, make sure you have approved the lending pool 
     * and this contract has sufficient allowance to transferFrom DAI. Then
     *  call the `supply` function on the lending pool. 
     */
    function supplyForContract(uint256 _amount) external {
        lendingPool.supply(address(DAI), _amount, address(this), 0);
    }

    /**
     * @dev Supplies DAI to the AAVE pool on behalf of the caller (the caller will receive aTokens)
     * @param _amount The amount of DAI to supply
     * @notice To supply DAI, make sure you have approved the lending pool and
     *  this contract has sufficient allowance to transferFrom DAI. Then call 
     * the `supply` function on the lending pool. 
     */
    function supplyForMsgSender(uint256 _amount) external {
        lendingPool.supply(address(DAI), _amount, msg.sender, 0);
    }

    /**
     * @dev Withdraws aTokens from the AAVE pool to this contract
     * @param _amount The amount of aTokens to withdraw
     * @notice To withdraw aTokens, call the `withdraw` function on the 
     * lending pool, specifying the amount of aTokens to withdraw. 
     */
    function withdrawFromAAVEToContract(uint256 _amount) external {
        lendingPool.withdraw(address(DAI), _amount, address(this));
    }

    /**
     * @dev Withdraws aTokens from the AAVE pool to the caller
     * @param _amount The amount of aTokens to withdraw
     * @notice To withdraw aTokens, call the `withdraw` function on the 
     * lending pool, specifying the amount of aTokens to withdraw. 
     */
    function withdrawFromAAVEToMsgSender(uint256 _amount) external {
        lendingPool.withdraw(address(DAI), _amount, msg.sender);
    }

    /**
     * @dev Returns the allowance between the caller and this contract for DAI
     * @return allowance The allowance amount
     * @notice This function retrieves the allowance of the DAI token between
     *  the caller and this contract. 
     */
    function getAllowanceBetweenMsgSenderAndCurrentContract() external view returns (uint256 allowance) {
        return DAI.allowance(msg.sender, address(this));
    }

    /**
     * @dev Returns the allowance between this contract and the lending pool for DAI
     * @return allowance The allowance amount
     * @notice This function retrieves the allowance of the DAI token between 
     * this contract and the lending pool. 
     */
    function getAllowanceBetweenCurrentContractAndLendingPool() external view returns (uint256 allowance) {
        return DAI.allowance(address(this), address(lendingPool));
    }

    /**
     * @dev Returns the ReserveData for the specified asset
     * @param _asset The address of the asset
     * @return reserveData The ReserveData struct
     * @notice This function retrieves the ReserveData for the specified asset from 
     * the lending pool. 
     */
    function getReserveData(address _asset) external view returns (DataTypes.ReserveData memory reserveData) {
        return lendingPool.getReserveData(_asset);
    }

    /**
     * @dev Returns the address of the aToken for the specified asset
     * @param _asset The address of the asset
     * @return aTokenAddress The aToken address
     * @notice This function retrieves the address of the aToken corresponding to the
     *  specified asset from the lending pool. 
     * See https://github.com/aave/aave-v3-core/blob/27a6d5c83560694210849d4abf09a09dec8da388/contracts/interfaces/IPool.sol#L582
     */
    function getAtokenAddress(address _asset) external view returns (address aTokenAddress) {
        return lendingPool.getReserveData(_asset).aTokenAddress;
    }

    /**
     * @dev Returns the user account data from the lending pool
     * @param _user The address of the user
     * @return totalCollateralBase The total collateral of the user
     * @return totalDebtBase The total debt of the user
     * @return availableBorrowsBase The available borrows of the user
     * @return currentLiquidationThreshold The current liquidation threshold of the user
     * @return ltv The loan-to-value ratio of the user
     * @return healthFactor The health factor of the user
     * @notice This function retrieves the user account data from the lending pool. 
     * See https://github.com/aave/aave-v3-core/blob/27a6d5c83560694210849d4abf09a09dec8da388/contracts/interfaces/IPool.sol#L477
     */
    function getUserAccountData(address _user) external view returns (
        uint256 totalCollateralBase,
        uint256 totalDebtBase,
        uint256 availableBorrowsBase,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor
    ) {
        return lendingPool.getUserAccountData(_user);
    }
}
