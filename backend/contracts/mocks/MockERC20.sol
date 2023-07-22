// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract MockERC20 is ERC20, ERC20Burnable {

    event TokenCreated(address aToken, string name, string  symbol,uint initialSupply);
    event TokenMinted(address aToken, address owner, uint amount);
    event TokenBurn(address aToken, address owner, uint amount);

    constructor(string memory _name, string memory _symbol, uint _initialSupply) ERC20(_name, _symbol){
        _mint(msg.sender, _initialSupply);
        emit TokenCreated(address(this),_name, _symbol,_initialSupply);
    }

    function mint(address _receiver, uint _amount) public {
        _mint(_receiver, _amount);
        emit TokenMinted(address(this),_receiver, _amount);
    }

    function burnFrom(address _account, uint256 _amount) override public {
        super.burnFrom(_account, _amount);
        emit TokenBurn(address(this),_account, _amount);
    }

}
