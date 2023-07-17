// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {DataTypes} from "@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import './MockERC20.sol';

contract MockAavePool is IPool {
    using SafeERC20 for IERC20;

    mapping (address => address) public tokentoATokenMapping;

    event ATokenCreated(address aToken, string name);
    event ATokenMinted(address aToken, address owner, uint amount);
    event ATokenBurn(address aToken, address owner, uint amount);

    
    /**
     * @notice  Mock function to simulate AAVE pool supply function
     * @dev     .
     * @param   _asset  Asset to supply
     * @param   _amount  Amount to supply
     * @param   _onBehalfOf  Address to target
     */
    function supply(address _asset, uint256 _amount, address _onBehalfOf, uint16 ) external {

      address aTokenAddress  = tokentoATokenMapping[_asset] ;

      // If token was never supplied
      if (aTokenAddress == address(0)) {
          string memory assetName = string(abi.encodePacked("AMock", IERC20Metadata(_asset).name()));
          string memory symbol = string(abi.encodePacked("A", IERC20Metadata(_asset).symbol()));
          // Create an AToken
          aTokenAddress = address(new MockERC20(assetName, symbol, 0));
          tokentoATokenMapping[_asset] = aTokenAddress;

          emit ATokenCreated(aTokenAddress, assetName);
      }

      // supply asset to current contract
      (IERC20(_asset)).safeTransferFrom(_onBehalfOf, address(this), _amount);

      // supply AToken to msg.sender
      MockERC20(aTokenAddress).mint(_onBehalfOf, _amount);

      emit ATokenMinted(aTokenAddress, _onBehalfOf, _amount);

    }

    /**
     * @notice  Mock function to simulate AAVE pool withdraw function
     * @dev     .
     * @param   _asset  asset to withdraw
     * @param   _amount  amount to withdraw
     * @param   _to  target for withdraw
     * @return  uint256  amount withdrawn
     */
    function withdraw(address _asset, uint256 _amount, address _to) external returns (uint256){
//        userTokensBalance[_asset][address(address(_to))] -= _amount;
 
      address aTokenAddress  = tokentoATokenMapping[_asset] ;

      // If token was never supplied
      if (aTokenAddress == address(0)) {
          revert("Asset never supplied");
      }

      if (IERC20(aTokenAddress).balanceOf(msg.sender) < _amount) {
        revert("AToken balance to low");
      }
      
      //burn AToken
      ERC20Burnable(aTokenAddress).burnFrom(msg.sender,_amount);
      emit ATokenBurn(aTokenAddress, msg.sender, _amount);


      // withdraw asset from current contract
      IERC20(_asset).safeTransfer(_to, _amount);
      return (_amount);
    }

   /**
   * @notice   Mock function to simulate AAVE pool withdraw function
   * @dev     Mock only property 'aTokenAddress'
   * @param   asset  Asset to get reserve Data information
   * @return  DataTypes.ReserveData  .
   */
  function getReserveData(
    address asset
  ) external view virtual override returns (DataTypes.ReserveData memory) {
    return DataTypes.ReserveData(
          //stores the reserve configuration
          DataTypes.ReserveConfigurationMap (0),
          //the liquidity index. Expressed in ray
          0,
          //the current supply rate. Expressed in ray
          0,
          //variable borrow index. Expressed in ray
          0,
          //the current variable borrow rate. Expressed in ray
          0,
          //the current stable borrow rate. Expressed in ray
          0,
          //timestamp of last update
          0,
          //the id of the reserve. Represents the position in the list of the active reserves
          0,
          //aTokenAddress : aToken address
          tokentoATokenMapping[asset],
          //stableDebtToken address
          address(0),
          //variableDebtToken address
          address(0),
          //address of the interest rate strategy
          address(0),
          //the current treasury balance, scaled
          0,
          //the outstanding unbacked aTokens minted through the bridging feature
          0,
          //the outstanding debt borrowed against this asset in isolation mode
          0
    );
  }

/**
 * @dev None of the functions below are implemented.
 */

//-----------------------------------------------------

  function mintUnbacked(
    address asset,
    uint256 amount,
    address onBehalfOf,
    uint16 referralCode
  ) external{
    revert("Not implemented for Mock");
  }

  function backUnbacked(address asset, uint256 amount, uint256 fee) external returns (uint256){
    revert("Not implemented for Mock");
  }

  function supplyWithPermit(
    address asset,
    uint256 amount,
    address onBehalfOf,
    uint16 referralCode,
    uint256 deadline,
    uint8 permitV,
    bytes32 permitR,
    bytes32 permitS
  ) external{
    revert("Not implemented for Mock");
  }


  function borrow(
    address asset,
    uint256 amount,
    uint256 interestRateMode,
    uint16 referralCode,
    address onBehalfOf
  ) external{
    revert("Not implemented for Mock");
  }

  function repay(
    address asset,
    uint256 amount,
    uint256 interestRateMode,
    address onBehalfOf
  ) external returns (uint256){
    revert("Not implemented for Mock");
  }

  function repayWithPermit(
    address asset,
    uint256 amount,
    uint256 interestRateMode,
    address onBehalfOf,
    uint256 deadline,
    uint8 permitV,
    bytes32 permitR,
    bytes32 permitS
  ) external returns (uint256){
    revert("Not implemented for Mock");
  }

  function repayWithATokens(
    address asset,
    uint256 amount,
    uint256 interestRateMode
  ) external returns (uint256){
    revert("Not implemented for Mock");
  }

  function swapBorrowRateMode(address asset, uint256 interestRateMode) external{
    revert("Not implemented for Mock");
  }

  function rebalanceStableBorrowRate(address asset, address user) external{
    revert("Not implemented for Mock");
  }

  function setUserUseReserveAsCollateral(address asset, bool useAsCollateral) external{
    revert("Not implemented for Mock");
  }

  function liquidationCall(
    address collateralAsset,
    address debtAsset,
    address user,
    uint256 debtToCover,
    bool receiveAToken
  ) external{
    revert("Not implemented for Mock");
  }

  function flashLoan(
    address receiverAddress,
    address[] calldata assets,
    uint256[] calldata amounts,
    uint256[] calldata interestRateModes,
    address onBehalfOf,
    bytes calldata params,
    uint16 referralCode
  ) external{
    revert("Not implemented for Mock");
  }

  function flashLoanSimple(
    address receiverAddress,
    address asset,
    uint256 amount,
    bytes calldata params,
    uint16 referralCode
  ) external{
    revert("Not implemented for Mock");
  }

  function getUserAccountData(
    address user
  )
    external
    view
    returns (
      uint256 totalCollateralBase,
      uint256 totalDebtBase,
      uint256 availableBorrowsBase,
      uint256 currentLiquidationThreshold,
      uint256 ltv,
      uint256 healthFactor
    ){
    revert("Not implemented for Mock");
  }

  function initReserve(
    address asset,
    address aTokenAddress,
    address stableDebtAddress,
    address variableDebtAddress,
    address interestRateStrategyAddress
  ) external{
    revert("Not implemented for Mock");
  }

  function dropReserve(address asset) external{
    revert("Not implemented for Mock");
  }

  function setReserveInterestRateStrategyAddress(
    address asset,
    address rateStrategyAddress
  ) external{
    revert("Not implemented for Mock");
  }

  function setConfiguration(
    address asset,
    DataTypes.ReserveConfigurationMap calldata configuration
  ) external{
    revert("Not implemented for Mock");
  }

  function getConfiguration(
    address asset
  ) external view returns (DataTypes.ReserveConfigurationMap memory){
    revert("Not implemented for Mock");
  }

  function getUserConfiguration(
    address user
  ) external view returns (DataTypes.UserConfigurationMap memory){
    revert("Not implemented for Mock");
  }

  function getReserveNormalizedIncome(address asset) external view returns (uint256){
    revert("Not implemented for Mock");
  }

  function getReserveNormalizedVariableDebt(address asset) external view returns (uint256){
    revert("Not implemented for Mock");
  }
/*
  function getReserveData(address asset) external view returns (DataTypes.ReserveData memory){
    revert("Not implemented for Mock");
  }
*/
  function finalizeTransfer(
    address asset,
    address from,
    address to,
    uint256 amount,
    uint256 balanceFromBefore,
    uint256 balanceToBefore
  ) external{
    revert("Not implemented for Mock");
  }

  function getReservesList() external view returns (address[] memory){
    revert("Not implemented for Mock");
  }

  function getReserveAddressById(uint16 id) external view returns (address){
    revert("Not implemented for Mock");
  }

  function ADDRESSES_PROVIDER() external view returns (IPoolAddressesProvider){
    revert("Not implemented for Mock");
  }

  function updateBridgeProtocolFee(uint256 bridgeProtocolFee) external{
    revert("Not implemented for Mock");
  }

  function updateFlashloanPremiums(
    uint128 flashLoanPremiumTotal,
    uint128 flashLoanPremiumToProtocol
  ) external{
    revert("Not implemented for Mock");
  }

  function configureEModeCategory(uint8 id, DataTypes.EModeCategory memory config) external{
    revert("Not implemented for Mock");
  }

  function getEModeCategoryData(uint8 id) external view returns (DataTypes.EModeCategory memory){
    revert("Not implemented for Mock");
  }

  function setUserEMode(uint8 categoryId) external{
    revert("Not implemented for Mock");
  }

  function getUserEMode(address user) external view returns (uint256){
    revert("Not implemented for Mock");
  }

  function resetIsolationModeTotalDebt(address asset) external{
    revert("Not implemented for Mock");
  }

  function MAX_STABLE_RATE_BORROW_SIZE_PERCENT() external view returns (uint256){
    revert("Not implemented for Mock");
  }

  function FLASHLOAN_PREMIUM_TOTAL() external view returns (uint128){
    revert("Not implemented for Mock");
  }

  function BRIDGE_PROTOCOL_FEE() external view returns (uint256){
    revert("Not implemented for Mock");
  }

  function FLASHLOAN_PREMIUM_TO_PROTOCOL() external view returns (uint128){
    revert("Not implemented for Mock");
  }

  function MAX_NUMBER_RESERVES() external view returns (uint16){
    revert("Not implemented for Mock");
  }

  function mintToTreasury(address[] calldata assets) external{
    revert("Not implemented for Mock");
  }

  function rescueTokens(address token, address to, uint256 amount) external{
    revert("Not implemented for Mock");
  }

  function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external{
    revert("Not implemented for Mock");
  }

}