// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../contracts/RWA721ONFTV2.sol";
import "../contracts/Config.sol";

/**
 * @title SetPeersV2
 * @notice Script to set peers for LayerZero V2 ONFT contracts
 * @dev Must be run on BOTH chains after deploying RWA721ONFTV2 to both
 *
 * Usage:
 *   1. Deploy RWA721ONFTV2 on Base Sepolia and Sepolia
 *   2. Update the addresses below
 *   3. Run on Base Sepolia: forge script script/SetPeersV2.s.sol:SetPeersV2 --rpc-url base_sepolia --broadcast
 *   4. Run on Sepolia: forge script script/SetPeersV2.s.sol:SetPeersV2 --rpc-url sepolia --broadcast
 */
contract SetPeersV2 is Script {
    // DEPLOYED ADDRESSES (V2 with tokenURI cross-chain support - UPDATED)
    address constant BASE_SEPOLIA_RWA = 0xce2C693E7f87508A4ab587a994659Eb9a3c429e3;
    address constant SEPOLIA_RWA = 0x74907F94954c60a60cC93aaE4691C3B5341d514B;

    function run() external {
        require(BASE_SEPOLIA_RWA != address(0), "Set BASE_SEPOLIA_RWA address");
        require(SEPOLIA_RWA != address(0), "Set SEPOLIA_RWA address");

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        uint256 chainId = block.chainid;

        vm.startBroadcast(deployerPrivateKey);

        if (chainId == 84532) {
            console.log("Setting peer: Base Sepolia -> Sepolia");
            RWA721ONFTV2 rwa = RWA721ONFTV2(BASE_SEPOLIA_RWA);

            // LayerZero V2 uses setPeer with bytes32 peer address
            bytes32 peerBytes32 = bytes32(uint256(uint160(SEPOLIA_RWA)));
            rwa.setPeer(Config.LZ_CHAIN_ID_SEPOLIA, peerBytes32);

            console.log("Peer set for Sepolia (EID:", Config.LZ_CHAIN_ID_SEPOLIA, ")");
            console.log("Peer address:", SEPOLIA_RWA);
        } else if (chainId == 11155111) {
            console.log("Setting peer: Sepolia -> Base Sepolia");
            RWA721ONFTV2 rwa = RWA721ONFTV2(SEPOLIA_RWA);

            // LayerZero V2 uses setPeer with bytes32 peer address
            bytes32 peerBytes32 = bytes32(uint256(uint160(BASE_SEPOLIA_RWA)));
            rwa.setPeer(Config.LZ_CHAIN_ID_BASE_SEPOLIA, peerBytes32);

            console.log("Peer set for Base Sepolia (EID:", Config.LZ_CHAIN_ID_BASE_SEPOLIA, ")");
            console.log("Peer address:", BASE_SEPOLIA_RWA);
        } else {
            revert("Unsupported chain");
        }

        vm.stopBroadcast();
    }
}
