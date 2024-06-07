// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Factory.sol";

contract CreateToken is Script {
    function run() public {
        vm.startBroadcast();

        address initialOwner = msg.sender;
        uint256 initialSupply = 1000;
        string memory name = "MyToken";
        string memory symbol = "MTK";

        TokenFactory factory = new TokenFactory();

        address tokenAddress = factory.createToken(initialOwner, initialSupply, name, symbol);
        console.log("Token created at address:", tokenAddress);

        vm.stopBroadcast();
    }
}
