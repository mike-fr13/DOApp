// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {

    constructor(string memory _name, string memory _symbol, uint _initialSupply) ERC20(_name, _symbol){
        _mint(msg.sender, _initialSupply);
    }

    function mint(address _receiver, uint _amount) external {
        _mint(_receiver, _amount);
    }

}
