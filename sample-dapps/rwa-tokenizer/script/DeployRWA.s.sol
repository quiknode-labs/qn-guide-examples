// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../contracts/RWA721ONFTV2.sol";
import "../contracts/Config.sol";

/**
 * @title DeployRWA
 * @notice Deployment script for RWA721ONFTV2 contract with tokenURI support
 * @dev Usage:
 *   Base Sepolia: forge script script/DeployRWA.s.sol:DeployRWA --rpc-url base_sepolia --broadcast --verify
 *   Sepolia: forge script script/DeployRWA.s.sol:DeployRWA --rpc-url sepolia --broadcast --verify
 */
contract DeployRWA is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 chainId = block.chainid;

        address lzEndpoint;
        uint32 lzChainId;

        if (chainId == 84532) {
            lzEndpoint = Config.LZ_ENDPOINT_BASE_SEPOLIA;
            lzChainId = Config.LZ_CHAIN_ID_BASE_SEPOLIA;
            console.log("Deploying to Base Sepolia");
        } else if (chainId == 11155111) {
            lzEndpoint = Config.LZ_ENDPOINT_SEPOLIA;
            lzChainId = Config.LZ_CHAIN_ID_SEPOLIA;
            console.log("Deploying to Sepolia");
        } else {
            revert("Unsupported chain");
        }

        vm.startBroadcast(deployerPrivateKey);

        RWA721ONFTV2 rwa = new RWA721ONFTV2(
            "RWA Tokenizer",
            "RWA",
            lzEndpoint,
            deployer, // delegate for OApp configuration
            lzChainId
        );

        console.log("RWA721ONFTV2 deployed at:", address(rwa));
        console.log("LayerZero Endpoint:", lzEndpoint);
        console.log("Origin Chain ID:", lzChainId);
        console.log("Delegate:", deployer);

        vm.stopBroadcast();
    }
}
