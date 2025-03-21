// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "../src/RiskBasedStaking.sol";

contract RiskBasedStakingScript is Script {
    function run() external {
        vm.startBroadcast();

        // Chain-specific Chainlink Functions Router addresses
        address router = 0xf9B8fc078197181C841c296C876945aaa425B278;

        // Deploy the RiskBasedStaking contract
        RiskBasedStaking staking = new RiskBasedStaking(router);
        console.log("RiskBasedStaking deployed at:", address(staking));

        vm.stopBroadcast();
    }
}