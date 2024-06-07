// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";

contract Token is ERC20, Ownable {
    constructor(address initialOwner, uint256 initialSupply, string memory 
name, string memory symbol)
        ERC20(name, symbol)
        Ownable(initialOwner)
    {
        _transferOwnership(initialOwner);
        _mint(initialOwner, initialSupply * 10 ** 18);

    }
}
