// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import { Test } from "forge-std/Test.sol";
import { TokenFactory } from "../src/Factory.sol";
import { Token } from "../src/Token.sol";

contract TokenFactoryTest is Test {
    TokenFactory public factory;

    function setUp() public {
        factory = new TokenFactory();
    }

    function test_CreateToken() public {
        address initialOwner = address(this);
        uint256 initialSupply = 1000;
        string memory name = "TestToken";
        string memory symbol = "TTK";
        
        vm.startPrank(initialOwner);
        address tokenAddress = factory.createToken(initialOwner, initialSupply, name, symbol);
        vm.stopPrank();
        
        assertTrue(tokenAddress != address(0), "Token address should not be zero");
        
        Token token = Token(tokenAddress);
        assertEq(token.name(), name, "Token name should match");
        assertEq(token.symbol(), symbol, "Token symbol should match");
        assertEq(token.totalSupply(), initialSupply * 10 ** 18, "Token supply should be adjusted for decimals");
        assertEq(token.balanceOf(initialOwner), initialSupply * 10 ** 18, "Initial owner should hold all tokens");
        assertEq(token.owner(), initialOwner, "Initial owner should be the owner");
    }

}
