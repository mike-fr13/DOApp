// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {DataTypes} from "@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol";

interface IaToken {
    function balanceOf(address _user) external view returns (uint256);
    function redeem(uint256 _amount) external;
}

interface IAaveLendingPool {
    function deposit(address _reserve, uint256 _amount, uint16 _referralCode) external;
}

contract MockAavePool is IPool {
    IERC20 public dai = IERC20(0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD);
    IaToken public aToken = IaToken(0x58AD4cB396411B691A9AAb6F74545b2C5217FE6a);
    IAaveLendingPool public aaveLendingPool = IAaveLendingPool(0x580D4Fdc4BF8f9b5ae2fb9225D584fED4AD5375c);
    
    mapping(address => uint256) public userDepositedDai;
    
    constructor() {
        dai.approve(address(aaveLendingPool), type(uint256).max);
    }
    
    function userDepositDai(uint256 _amountInDai) external {
        userDepositedDai[msg.sender] = _amountInDai;
        require(dai.transferFrom(msg.sender, address(this), _amountInDai), "DAI Transfer failed!");
        aaveLendingPool.deposit(address(dai), _amountInDai, 0);
    }
    
    function userWithdrawDai(uint256 _amountInDai) external {
        require(userDepositedDai[msg.sender] >= _amountInDai, "You cannot withdraw more than deposited!");

        aToken.redeem(_amountInDai);
        require(dai.transferFrom(address(this), msg.sender, _amountInDai), "DAI Transfer failed!");
        
        userDepositedDai[msg.sender] = userDepositedDai[msg.sender] - _amountInDai;
    }


    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external {

    }

    function withdraw(address asset, uint256 amount, address to) external returns (uint256) {

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
    revert("Not implement for Mock");
  }

  function backUnbacked(address asset, uint256 amount, uint256 fee) external returns (uint256){
    revert("Not implement for Mock");
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
    revert("Not implement for Mock");
  }


  function borrow(
    address asset,
    uint256 amount,
    uint256 interestRateMode,
    uint16 referralCode,
    address onBehalfOf
  ) external{
    revert("Not implement for Mock");
  }

  function repay(
    address asset,
    uint256 amount,
    uint256 interestRateMode,
    address onBehalfOf
  ) external returns (uint256){
    revert("Not implement for Mock");
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
    revert("Not implement for Mock");
  }

  function repayWithATokens(
    address asset,
    uint256 amount,
    uint256 interestRateMode
  ) external returns (uint256){
    revert("Not implement for Mock");
  }

  function swapBorrowRateMode(address asset, uint256 interestRateMode) external{
    revert("Not implement for Mock");
  }

  function rebalanceStableBorrowRate(address asset, address user) external{
    revert("Not implement for Mock");
  }

  function setUserUseReserveAsCollateral(address asset, bool useAsCollateral) external{
    revert("Not implement for Mock");
  }

  function liquidationCall(
    address collateralAsset,
    address debtAsset,
    address user,
    uint256 debtToCover,
    bool receiveAToken
  ) external{
    revert("Not implement for Mock");
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
    revert("Not implement for Mock");
  }

  function flashLoanSimple(
    address receiverAddress,
    address asset,
    uint256 amount,
    bytes calldata params,
    uint16 referralCode
  ) external{
    revert("Not implement for Mock");
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
    revert("Not implement for Mock");
  }

  function initReserve(
    address asset,
    address aTokenAddress,
    address stableDebtAddress,
    address variableDebtAddress,
    address interestRateStrategyAddress
  ) external{
    revert("Not implement for Mock");
  }

  function dropReserve(address asset) external{
    revert("Not implement for Mock");
  }

  function setReserveInterestRateStrategyAddress(
    address asset,
    address rateStrategyAddress
  ) external{
    revert("Not implement for Mock");
  }

  function setConfiguration(
    address asset,
    DataTypes.ReserveConfigurationMap calldata configuration
  ) external{
    revert("Not implement for Mock");
  }

  function getConfiguration(
    address asset
  ) external view returns (DataTypes.ReserveConfigurationMap memory){
    revert("Not implement for Mock");
  }

  function getUserConfiguration(
    address user
  ) external view returns (DataTypes.UserConfigurationMap memory){
    revert("Not implement for Mock");
  }

  function getReserveNormalizedIncome(address asset) external view returns (uint256){
    revert("Not implement for Mock");
  }

  function getReserveNormalizedVariableDebt(address asset) external view returns (uint256){
    revert("Not implement for Mock");
  }

  function getReserveData(address asset) external view returns (DataTypes.ReserveData memory){
    revert("Not implement for Mock");
  }

  function finalizeTransfer(
    address asset,
    address from,
    address to,
    uint256 amount,
    uint256 balanceFromBefore,
    uint256 balanceToBefore
  ) external{
    revert("Not implement for Mock");
  }

  function getReservesList() external view returns (address[] memory){
    revert("Not implement for Mock");
  }

  function getReserveAddressById(uint16 id) external view returns (address){
    revert("Not implement for Mock");
  }

  function ADDRESSES_PROVIDER() external view returns (IPoolAddressesProvider){
    revert("Not implement for Mock");
  }

  function updateBridgeProtocolFee(uint256 bridgeProtocolFee) external{
    revert("Not implement for Mock");
  }

  function updateFlashloanPremiums(
    uint128 flashLoanPremiumTotal,
    uint128 flashLoanPremiumToProtocol
  ) external{
    revert("Not implement for Mock");
  }

  function configureEModeCategory(uint8 id, DataTypes.EModeCategory memory config) external{
    revert("Not implement for Mock");
  }

  function getEModeCategoryData(uint8 id) external view returns (DataTypes.EModeCategory memory){
    revert("Not implement for Mock");
  }

  function setUserEMode(uint8 categoryId) external{
    revert("Not implement for Mock");
  }

  function getUserEMode(address user) external view returns (uint256){
    revert("Not implement for Mock");
  }

  function resetIsolationModeTotalDebt(address asset) external{
    revert("Not implement for Mock");
  }

  function MAX_STABLE_RATE_BORROW_SIZE_PERCENT() external view returns (uint256){
    revert("Not implement for Mock");
  }

  function FLASHLOAN_PREMIUM_TOTAL() external view returns (uint128){
    revert("Not implement for Mock");
  }

  function BRIDGE_PROTOCOL_FEE() external view returns (uint256){
    revert("Not implement for Mock");
  }

  function FLASHLOAN_PREMIUM_TO_PROTOCOL() external view returns (uint128){
    revert("Not implement for Mock");
  }

  function MAX_NUMBER_RESERVES() external view returns (uint16){
    revert("Not implement for Mock");
  }

  function mintToTreasury(address[] calldata assets) external{
    revert("Not implement for Mock");
  }

  function rescueTokens(address token, address to, uint256 amount) external{
    revert("Not implement for Mock");
  }

  function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external{
    revert("Not implement for Mock");
  }

}