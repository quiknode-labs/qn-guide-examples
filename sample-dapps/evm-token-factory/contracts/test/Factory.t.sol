// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Factory.sol";
import "../src/Token.sol";

contract TokenFactoryTest is Test {
    TokenFactory factory;
    address initialOwner;
    uint256 initialSupply = 1000;
    string name = "MyToken";
    string symbol = "MTK";

    event TokenCreated(address indexed tokenAddress, address indexed owner, uint256 initialSupply);

    function setUp() public {
        factory = new TokenFactory();
        initialOwner = address(this);
    }

    function testCreateToken() public {
        vm.expectEmit(false, false, false, false);
        emit TokenCreated(address(0), initialOwner, initialSupply);

        address tokenAddr = factory.createToken(initialOwner, initialSupply, name, symbol);
        assertTrue(tokenAddr != address(0), "Token creation failed");

        Token token = Token(tokenAddr);
        assertEq(token.owner(), initialOwner, "Owner is not set correctly");
        assertEq(token.totalSupply(), initialSupply * 10 ** 18, "Initial supply is incorrect");
        assertEq(token.name(), name, "Token name is incorrect");
        assertEq(token.symbol(), symbol, "Token symbol is incorrect");
    }
}
