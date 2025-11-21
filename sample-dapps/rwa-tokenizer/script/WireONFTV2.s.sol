// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../contracts/RWA721ONFTV2.sol";
import "../contracts/Config.sol";

/**
 * @title WireONFTV2
 * @notice Script to wire ONFT V2 contracts between chains via setPeer
 * @dev Must be run on BOTH chains after deploying RWA721ONFTV2 to both
 *
 * Usage:
 *   1. Deploy RWA721ONFTV2 on Base Sepolia and Sepolia
 *   2. Update the addresses below
 *   3. Run on Base Sepolia: forge script script/WireONFTV2.s.sol:WireONFTV2 --rpc-url base_sepolia --broadcast
 *   4. Run on Sepolia: forge script script/WireONFTV2.s.sol:WireONFTV2 --rpc-url sepolia --broadcast
 */
contract WireONFTV2 is Script {
    // 👇 UPDATE THE PLACEHOLDER WITH THE RWA CONTRACT YOU DEPLOYED ON BASE SEPOLIA
    address constant BASE_SEPOLIA_RWA = YOUR_RWA721ONFTV2_CONTRACT_ON_BASE_SEPOLIA;

    // 👇 UPDATE THE PLACEHOLDER WITH THE RWA CONTRACT YOU DEPLOYED ON SEPOLIA
    address constant SEPOLIA_RWA = YOUR_RWA721ONFTV2_CONTRACT_ON_SEPOLIA;

    function run() external {
        require(BASE_SEPOLIA_RWA != address(0), "Set BASE_SEPOLIA_RWA address");
        require(SEPOLIA_RWA != address(0), "Set SEPOLIA_RWA address");

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        uint256 chainId = block.chainid;

        vm.startBroadcast(deployerPrivateKey);

        if (chainId == 84532) {
            console.log("Wiring Base Sepolia -> Sepolia");
            RWA721ONFTV2 rwa = RWA721ONFTV2(BASE_SEPOLIA_RWA);

            // LayerZero V2 uses bytes32 for peer addresses (padded to 32 bytes)
            bytes32 peerAddress = bytes32(uint256(uint160(SEPOLIA_RWA)));

            // Set peer with LayerZero V2 endpoint ID
            rwa.setPeer(Config.LZ_CHAIN_ID_SEPOLIA, peerAddress);

            console.log("Peer set for Sepolia");
            console.log("Peer address (bytes32):", vm.toString(peerAddress));
        } else if (chainId == 11155111) {
            console.log("Wiring Sepolia -> Base Sepolia");
            RWA721ONFTV2 rwa = RWA721ONFTV2(SEPOLIA_RWA);

            // LayerZero V2 uses bytes32 for peer addresses (padded to 32 bytes)
            bytes32 peerAddress = bytes32(uint256(uint160(BASE_SEPOLIA_RWA)));

            // Set peer with LayerZero V2 endpoint ID
            rwa.setPeer(Config.LZ_CHAIN_ID_BASE_SEPOLIA, peerAddress);

            console.log("Peer set for Base Sepolia");
            console.log("Peer address (bytes32):", vm.toString(peerAddress));
        } else {
            revert("Unsupported chain");
        }

        vm.stopBroadcast();
    }
}
