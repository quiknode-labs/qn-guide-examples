// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/Factory.sol";

contract DeployTokenFactory is Script {
    function run() external {
        vm.startBroadcast();

        TokenFactory tokenFactory = new TokenFactory();
        console.log("TokenFactory deployed at:", address(tokenFactory));

        vm.stopBroadcast();
    }
}
