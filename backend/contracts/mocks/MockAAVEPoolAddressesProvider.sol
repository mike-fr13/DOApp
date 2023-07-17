// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IPoolAddressesProvider} from '@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol';

/**
 * @author  Yannick Tison
 * @title   Mock contract AAVEPoolAddressesProvider {
 * @dev     This contract overload xxxx() and yyyy() 
 * @dev     
 * @notice  This contract will be used to test some personal DEFI stuff.
 */

contract MockAAVEPoolAddressesProvider is  IPoolAddressesProvider{

  address private _poolImpl;

 /**
   * @notice Returns the address of the Pool proxy.
   * @return The Pool proxy address
   */
  function getPool() external view returns (address){
    return (_poolImpl);
  }

  /**
   * @notice Updates the implementation of the Pool, or creates a proxy
   * setting the new `pool` implementation when the function is called for the first time.
   * @param newPoolImpl The new Pool implementation
   */
  function setPoolImpl(address newPoolImpl) external{
    _poolImpl = newPoolImpl;
  }


/**
 * @dev None of the functions below are implemented.
 */

//-----------------------------------------------------

  /**
   * @notice Returns the id of the Aave market to which this contract points to.
   * @return The market id
   */
  function getMarketId() pure external returns (string memory) {
    revert("Not implemented for Mock");
  }

  /**
   * @notice Associates an id with a specific PoolAddressesProvider.
   * @dev This can be used to create an onchain registry of PoolAddressesProviders to
   * identify and validate multiple Aave markets.
   */
  function setMarketId(string calldata ) pure external{
    revert("Not implemented for Mock");
  }
  /**
   * @notice Returns an address by its identifier.
   * @dev The returned address might be an EOA or a contract, potentially proxied
   * @dev It returns ZERO if there is no registered address with the given id
   * @return The address of the registered for the specified id
   */
  function getAddress(bytes32 ) pure external returns (address){
    revert("Not implemented for Mock");
  }
  /**
   * @notice General function to update the implementation of a proxy registered with
   * certain `id`. If there is no proxy registered, it will instantiate one and
   * set as implementation the `newImplementationAddress`.
   * @dev IMPORTANT Use this function carefully, only for ids that don't have an explicit
   * setter function, in order to avoid unexpected consequences
   */
  function setAddressAsProxy(bytes32 , address ) pure external{
    revert("Not implemented for Mock");
  }
  /**
   * @notice Sets an address for an id replacing the address saved in the addresses map.
   * @dev IMPORTANT Use this function carefully, as it will do a hard replacement
   */
  function setAddress(bytes32 , address ) pure external{
    revert("Not implemented for Mock");
  }
 
  /**
   * @notice Returns the address of the PoolConfigurator proxy.
   * @return The PoolConfigurator proxy address
   */
  function getPoolConfigurator() pure external returns (address){
    revert("Not implemented for Mock");
  }
  /**
   * @notice Updates the implementation of the PoolConfigurator, or creates a proxy
   * setting the new `PoolConfigurator` implementation when the function is called for the first time.
   */
  function setPoolConfiguratorImpl(address ) pure external{
    revert("Not implemented for Mock");
  }
  /**
   * @notice Returns the address of the price oracle.
   * @return The address of the PriceOracle
   */
  function getPriceOracle() pure external returns (address){
    revert("Not implemented for Mock");
  }
  /**
   * @notice Updates the address of the price oracle.
   */
  function setPriceOracle(address ) pure external{
    revert("Not implemented for Mock");
  }
  /**
   * @notice Returns the address of the ACL manager.
   * @return The address of the ACLManager
   */
  function getACLManager() pure external returns (address){
    revert("Not implemented for Mock");
  }
  /**
   * @notice Updates the address of the ACL manager.
   */
  function setACLManager(address ) pure external{
    revert("Not implemented for Mock");
  }
  /**
   * @notice Returns the address of the ACL admin.
   * @return The address of the ACL admin
   */
  function getACLAdmin() pure external returns (address){
    revert("Not implemented for Mock");
  }
  /**
   * @notice Updates the address of the ACL admin.
   */
  function setACLAdmin(address ) pure external{
    revert("Not implemented for Mock");
  }
  /**
   * @notice Returns the address of the price oracle sentinel.
   * @return The address of the PriceOracleSentinel
   */
  function getPriceOracleSentinel() pure external returns (address){
    revert("Not implemented for Mock");
  }
  /**
   * @notice Updates the address of the price oracle sentinel.
   */
  function setPriceOracleSentinel(address ) pure external{
    revert("Not implemented for Mock");
  }
  /**
   * @notice Returns the address of the data provider.
   * @return The address of the DataProvider
   */
  function getPoolDataProvider() pure external returns (address){
    revert("Not implemented for Mock");
  }
  /**
   * @notice Updates the address of the data provider.
   */
  function setPoolDataProvider(address ) pure external{
     revert("Not implemented for Mock");
 }
}