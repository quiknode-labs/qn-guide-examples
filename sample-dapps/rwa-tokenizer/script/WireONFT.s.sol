// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../contracts/RWA721ONFT.sol";
import "../contracts/Config.sol";

/**
 * @title WireONFT
 * @notice Script to wire ONFT contracts between chains via setTrustedRemote
 * @dev Must be run on BOTH chains after deploying RWA721ONFT to both
 *
 * Usage:
 *   1. Deploy RWA721ONFT on Base Sepolia and Sepolia
 *   2. Update the addresses below
 *   3. Run on Base Sepolia: forge script script/WireONFT.s.sol:WireONFT --rpc-url base_sepolia --broadcast
 *   4. Run on Sepolia: forge script script/WireONFT.s.sol:WireONFT --rpc-url sepolia --broadcast
 */
contract WireONFT is Script {
    address constant BASE_SEPOLIA_RWA = 0xF2d8D81Fd10972405b461F144cc6d2694631b98A;
    address constant SEPOLIA_RWA = 0xdDe7fD2032A22078109ef0EECA5B658b1F058778;

    function run() external {
        require(BASE_SEPOLIA_RWA != address(0), "Set BASE_SEPOLIA_RWA address");
        require(SEPOLIA_RWA != address(0), "Set SEPOLIA_RWA address");

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        uint256 chainId = block.chainid;

        vm.startBroadcast(deployerPrivateKey);

        if (chainId == 84532) {
            console.log("Wiring Base Sepolia -> Sepolia");
            RWA721ONFT rwa = RWA721ONFT(BASE_SEPOLIA_RWA);
            bytes memory remoteAddress = abi.encodePacked(SEPOLIA_RWA);
            rwa.setTrustedRemote(Config.LZ_CHAIN_ID_SEPOLIA, remoteAddress);
            console.log("Trusted remote set for Sepolia");
        } else if (chainId == 11155111) {
            console.log("Wiring Sepolia -> Base Sepolia");
            RWA721ONFT rwa = RWA721ONFT(SEPOLIA_RWA);
            bytes memory remoteAddress = abi.encodePacked(BASE_SEPOLIA_RWA);
            rwa.setTrustedRemote(Config.LZ_CHAIN_ID_BASE_SEPOLIA, remoteAddress);
            console.log("Trusted remote set for Base Sepolia");
        } else {
            revert("Unsupported chain");
        }

        vm.stopBroadcast();
    }
}
