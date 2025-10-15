// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title Types
 * @notice Shared type definitions for RWA Tokenizer contracts
 */
library Types {
    struct Listing {
        address nftContract;
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
    }

    struct BridgeInfo {
        uint32 originChainId;
        bool isBridged;
        uint256 bridgeCount;
    }

    enum AssetCategory {
        RealEstate,
        Art,
        Vehicle,
        Commodity,
        Other
    }
}
