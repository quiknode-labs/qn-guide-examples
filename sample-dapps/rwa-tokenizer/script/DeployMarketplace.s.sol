// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../contracts/Marketplace.sol";
import "../contracts/Config.sol";

/**
 * @title DeployMarketplace
 * @notice Deployment script for Marketplace contract
 * @dev Usage:
 *   Base Sepolia: forge script script/DeployMarketplace.s.sol:DeployMarketplace --rpc-url base_sepolia --broadcast --verify
 *   Sepolia: forge script script/DeployMarketplace.s.sol:DeployMarketplace --rpc-url sepolia --broadcast --verify
 */
contract DeployMarketplace is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address feeRecipient = vm.addr(deployerPrivateKey);
        uint256 chainId = block.chainid;

        address usdc;

        if (chainId == 84532) {
            usdc = Config.USDC_BASE_SEPOLIA;
            console.log("Deploying to Base Sepolia");
        } else if (chainId == 11155111) {
            usdc = Config.USDC_SEPOLIA;
            console.log("Deploying to Sepolia");
        } else {
            revert("Unsupported chain");
        }

        vm.startBroadcast(deployerPrivateKey);

        Marketplace marketplace = new Marketplace(
            usdc,
            Config.PERMIT2_ADDRESS,
            feeRecipient,
            Config.DEFAULT_PLATFORM_FEE_BPS
        );

        console.log("Marketplace deployed at:", address(marketplace));
        console.log("USDC address:", usdc);
        console.log("Permit2 address:", Config.PERMIT2_ADDRESS);
        console.log("Fee recipient:", feeRecipient);
        console.log("Platform fee (bps):", Config.DEFAULT_PLATFORM_FEE_BPS);

        vm.stopBroadcast();
    }
}
