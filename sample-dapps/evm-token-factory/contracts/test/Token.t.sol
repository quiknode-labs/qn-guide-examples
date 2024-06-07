// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/Token.sol";

contract TokenTest is Test {
    Token token;
    address initialOwner;
    uint initialSupply = 1000;
    string name = "TestToken";
    string symbol = "TT";

    function setUp() public {
        initialOwner = address(this);
        token = new Token(initialOwner, initialSupply, name, symbol);
    }

    function testInitialOwner() public view {
        assertEq(token.owner(), initialOwner);
    }

    function testInitialSupply() public view {
        uint expectedSupply = initialSupply * 10 ** token.decimals();
        assertEq(token.totalSupply(), expectedSupply);
        assertEq(token.balanceOf(initialOwner), expectedSupply);
    }

    function testNameAndSymbol() public view {
        assertEq(token.name(), name);
        assertEq(token.symbol(), symbol);
    }
}
