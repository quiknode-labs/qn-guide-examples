// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Token.sol";

contract TokenFactory {
    event TokenCreated(address indexed tokenAddress, address indexed owner, uint256 initialSupply);

    function createToken(address initialOwner, uint256 initialSupply, string memory name, string memory symbol) public returns (address) {
    
        Token newToken = new Token(initialOwner, initialSupply, name, symbol);
        emit TokenCreated(address(newToken), initialOwner, initialSupply);
        return address(newToken);
        
    }
}
