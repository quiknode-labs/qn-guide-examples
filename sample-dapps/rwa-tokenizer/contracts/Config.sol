// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title Config
 * @notice Centralized configuration constants for RWA Tokenizer
 * @dev Chain-specific addresses and LayerZero configuration
 */
library Config {
    // LayerZero V2 Endpoint IDs
    uint32 public constant LZ_CHAIN_ID_BASE_SEPOLIA = 40245;
    uint32 public constant LZ_CHAIN_ID_SEPOLIA = 40161;

    address public constant LZ_ENDPOINT_BASE_SEPOLIA =
        0x6EDCE65403992e310A62460808c4b910D972f10f;
    address public constant LZ_ENDPOINT_SEPOLIA =
        0x6EDCE65403992e310A62460808c4b910D972f10f;

    address public constant USDC_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    address public constant USDC_SEPOLIA = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;

    address public constant PERMIT2_ADDRESS = 0x000000000022D473030F116dDEE9F6B43aC78BA3;

    uint32 public constant CCTP_DOMAIN_BASE_SEPOLIA = 6;
    uint32 public constant CCTP_DOMAIN_SEPOLIA = 0;

    uint256 public constant DEFAULT_PLATFORM_FEE_BPS = 250;
    uint256 public constant MAX_PLATFORM_FEE_BPS = 1000;
    uint256 public constant BPS_DENOMINATOR = 10000;
}
