// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import {RWA721ONFTV2} from "../contracts/RWA721ONFTV2.sol";
import {Config} from "../contracts/Config.sol";
import {OptionsBuilder} from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OptionsBuilder.sol";

contract SetEnforcedOptions is Script {
    using OptionsBuilder for bytes;

    // Struct definition to match the one expected by setEnforcedOptions
    struct EnforcedOptionParam {
        uint32 eid;
        uint16 msgType;
        bytes options;
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address rwaAddress;
        uint32 dstEid;

        if (block.chainid == 11155111) {
            // Sepolia -> Base Sepolia
            rwaAddress = 0x74907F94954c60a60cC93aaE4691C3B5341d514B;
            dstEid = Config.LZ_CHAIN_ID_BASE_SEPOLIA;
        } else if (block.chainid == 84532) {
            // Base Sepolia -> Sepolia
            rwaAddress = 0xce2C693E7f87508A4ab587a994659Eb9a3c429e3;
            dstEid = Config.LZ_CHAIN_ID_SEPOLIA;
        } else {
            revert("Unsupported chain");
        }

        console.log("Setting enforced options for RWA721ONFTV2 at:", rwaAddress);
        console.log("Destination chain ID:", dstEid);

        // Build options using LayerZero's OptionsBuilder
        // SEND type (1) with 200,000 gas for lzReceive
        bytes memory options = OptionsBuilder.newOptions().addExecutorLzReceiveOption(
            200000, // gas limit for lzReceive
            0       // msg.value
        );

        console.log("Options:");
        console.logBytes(options);

        // Create EnforcedOptionParam array
        EnforcedOptionParam[] memory params = new EnforcedOptionParam[](1);
        params[0] = EnforcedOptionParam({
            eid: dstEid,
            msgType: 1, // SEND
            options: options
        });

        vm.startBroadcast(deployerPrivateKey);

        RWA721ONFTV2 rwa = RWA721ONFTV2(rwaAddress);

        // Call setEnforcedOptions via low-level call to avoid struct compatibility issues
        bytes memory data = abi.encodeWithSignature(
            "setEnforcedOptions((uint32,uint16,bytes)[])",
            params
        );
        (bool success, ) = rwaAddress.call(data);
        require(success, "setEnforcedOptions failed");

        console.log("Enforced options set successfully!");

        vm.stopBroadcast();
    }
}
