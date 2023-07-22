// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

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

    error MockError(string);
 
    /**
     * @notice  Mock function to simulate AAVE pool supply function
     * @dev     .
     * @param   _asset  Asset to supply
     * @param   _amount  Amount to supply
     * @param   _onBehalfOf  Address to target
     */
    function supply(address _asset, uint256 _amount, address _onBehalfOf, uint16 ) external {

      require (_asset != address(0), "Asset address provided should not be zero address");
      require (_amount > 0, "Amount to supply should be > 0");
      require (_onBehalfOf != address(0), "Address to use on behalf of should not be zero address");

      address aTokenAddress  = tokentoATokenMapping[_asset] ;
      
      // If token was never supplied
      if (aTokenAddress == address(0)) {
        aTokenAddress = createAToken(_asset);
      }

      // supply asset to current contract
      (IERC20(_asset)).safeTransferFrom(_onBehalfOf, address(this), _amount);

      // supply AToken to _onBehalfOf
      MockERC20(aTokenAddress).mint(_onBehalfOf, _amount);
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
      require (_asset != address(0), "Asset address provided should not be zero address");
      require (_amount > 0, "Amount to supply should be > 0");
      require (_to != address(0), "Target address should not be zero address");



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

      // withdraw asset from current contract
      IERC20(_asset).safeTransfer(_to, _amount);
      return (_amount);
    }


  /**
   * @notice  mock function to create aTocken based on given _token
   * @dev     .
   * @param   _asset  source token to create aToken
   */

  function createAToken (address _asset) public returns (address aToken){
    require (_asset != address(0),"Asset should not be a 0 address");
    string memory assetName = string(abi.encodePacked("AMock", IERC20Metadata(_asset).name()));
    string memory symbol = string(abi.encodePacked("A", IERC20Metadata(_asset).symbol()));

    // Create an AToken
    if (tokentoATokenMapping[_asset] == address(0)) {
      tokentoATokenMapping[_asset] = address(new MockERC20(assetName, symbol, 0));
    }
    return tokentoATokenMapping[_asset];
  }

  /**
   * @notice  mock function to get aTocken for a given _token
   * @dev     this function is for test purpose only and should not be used elsewhere as it is not in IPool interface
   * @param   _asset  source token to create aToken
   */
  function getAToken (address _asset) public view returns(address) {
    require (_asset != address(0),"Asset should not be a 0 address");
    return tokentoATokenMapping[_asset];
  }


   /**
   * @notice   Mock function to simulate AAVE pool getReserveData function (to retrieve aToken)
   * @dev     Mock only property 'aTokenAddress'
   * @param   asset  Asset to get reserve Data information
   * @return  DataTypes.ReserveData  .
   */
  function getReserveData(
    address asset
  ) external view virtual override returns (DataTypes.ReserveData memory) {

    if (asset == address(0)) {
      revert MockError("Asset should not be a 0 address");
    }
    if (tokentoATokenMapping[asset] == address(0)) {
      revert MockError("aToken not defined");
    }

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
    address ,
    uint256 ,
    address ,
    uint16 
  ) pure external{
    revert("Not implemented for Mock");
  }

  function backUnbacked(address , uint256 , uint256 ) pure external returns (uint256){
    revert("Not implemented for Mock");
  }

  function supplyWithPermit(
    address ,
    uint256 ,
    address ,
    uint16 ,
    uint256 ,
    uint8 ,
    bytes32 ,
    bytes32 
  ) pure external{
    revert("Not implemented for Mock");
  }


  function borrow(
    address ,
    uint256 ,
    uint256 ,
    uint16 ,
   address 
  ) pure external{
    revert("Not implemented for Mock");
  }

  function repay(
    address ,
    uint256 ,
    uint256 ,
    address 
  ) pure external returns (uint256){
    revert("Not implemented for Mock");
  }

  function repayWithPermit(
    address ,
    uint256 ,
    uint256 ,
    address ,
    uint256 ,
    uint8 ,
    bytes32 ,
    bytes32 
  ) pure external returns (uint256){
    revert("Not implemented for Mock");
  }

  function repayWithATokens(
    address ,
    uint256 ,
    uint256 
  ) pure external returns (uint256){
    revert("Not implemented for Mock");
  }

  function swapBorrowRateMode(address , uint256 ) pure external{
    revert("Not implemented for Mock");
  }

  function rebalanceStableBorrowRate(address , address ) pure external{
    revert("Not implemented for Mock");
  }

  function setUserUseReserveAsCollateral(address , bool ) pure external{
    revert("Not implemented for Mock");
  }

  function liquidationCall(
    address ,
    address ,
    address ,
    uint256 ,
    bool 
  ) pure external{
    revert("Not implemented for Mock");
  }

  function flashLoan(
    address ,
    address[] calldata ,
    uint256[] calldata ,
    uint256[] calldata ,
    address ,
    bytes calldata ,
    uint16 
  ) pure external{
    revert("Not implemented for Mock");
  }

  function flashLoanSimple(
    address ,
    address ,
    uint256 ,
    bytes calldata ,
    uint16 
  ) pure external{
    revert("Not implemented for Mock");
  }

  function getUserAccountData(
    address 
  )
    pure external
    
    returns (
      uint256 ,
      uint256 ,
      uint256 ,
      uint256 ,
      uint256 ,
      uint256 
    ){
    revert("Not implemented for Mock");
  }

  function initReserve(
    address ,
    address ,
    address ,
    address ,
    address 
  ) pure external{
    revert("Not implemented for Mock");
  }

  function dropReserve(address ) pure external{
    revert("Not implemented for Mock");
  }

  function setReserveInterestRateStrategyAddress(
    address ,
    address 
  ) pure external{
    revert("Not implemented for Mock");
  }

  function setConfiguration(
    address ,
    DataTypes.ReserveConfigurationMap calldata 
  ) pure external{
    revert("Not implemented for Mock");
  }

  function getConfiguration(
    address 
  ) pure external returns (DataTypes.ReserveConfigurationMap memory){
    revert("Not implemented for Mock");
  }

  function getUserConfiguration(
    address 
  ) pure external returns (DataTypes.UserConfigurationMap memory){
    revert("Not implemented for Mock");
  }

  function getReserveNormalizedIncome(address ) pure external returns (uint256){
    revert("Not implemented for Mock");
  }

  function getReserveNormalizedVariableDebt(address ) pure external returns (uint256){
    revert("Not implemented for Mock");
  }
/*
  function getReserveData(address asset) pure external view returns (DataTypes.ReserveData memory){
    revert("Not implemented for Mock");
  }
*/
  function finalizeTransfer(
    address ,
    address ,
    address ,
    uint256 ,
    uint256 ,
    uint256 
  ) pure external{
    revert("Not implemented for Mock");
  }

  function getReservesList() pure external returns (address[] memory){
    revert("Not implemented for Mock");
  }

  function getReserveAddressById(uint16 ) pure external returns (address){
    revert("Not implemented for Mock");
  }

  function ADDRESSES_PROVIDER() pure external returns (IPoolAddressesProvider){
    revert("Not implemented for Mock");
  }

  function updateBridgeProtocolFee(uint256 ) pure external{
    revert("Not implemented for Mock");
  }

  function updateFlashloanPremiums(
    uint128 ,
    uint128 
  ) pure external{
    revert("Not implemented for Mock");
  }

  function configureEModeCategory(uint8 , DataTypes.EModeCategory memory ) pure external{
    revert("Not implemented for Mock");
  }

  function getEModeCategoryData(uint8 ) pure external returns (DataTypes.EModeCategory memory){
    revert("Not implemented for Mock");
  }

  function setUserEMode(uint8 ) pure external{
    revert("Not implemented for Mock");
  }

  function getUserEMode(address ) pure external returns (uint256){
    revert("Not implemented for Mock");
  }

  function resetIsolationModeTotalDebt(address ) pure external{
    revert("Not implemented for Mock");
  }

  function MAX_STABLE_RATE_BORROW_SIZE_PERCENT() pure external returns (uint256){
    revert("Not implemented for Mock");
  }

  function FLASHLOAN_PREMIUM_TOTAL() pure external returns (uint128){
    revert("Not implemented for Mock");
  }

  function BRIDGE_PROTOCOL_FEE() pure external returns (uint256){
    revert("Not implemented for Mock");
  }

  function FLASHLOAN_PREMIUM_TO_PROTOCOL() pure external returns (uint128){
    revert("Not implemented for Mock");
  }

  function MAX_NUMBER_RESERVES() pure external returns (uint16){
    revert("Not implemented for Mock");
  }

  function mintToTreasury(address[] calldata ) pure external{
    revert("Not implemented for Mock");
  }

  function rescueTokens(address , address , uint256 ) pure external{
    revert("Not implemented for Mock");
  }

  function deposit(address , uint256 , address , uint16 ) pure external{
    revert("Not implemented for Mock");
  }

}