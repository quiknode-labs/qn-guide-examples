# RWA Tokenizer v2

A decentralized platform for tokenizing Real World Assets (RWAs) as NFTs with cross-chain bridging and USDC-based marketplace functionality.

## Features

- **No-Code RWA Mint Studio**: Create ERC-721 NFTs with IPFS metadata storage
- **LayerZero ONFT v2 Bridging**: Cross-chain NFT transfers between Base and Ethereum
- **Multichain USDC Marketplace**: Fixed-price listings with Permit2 gasless approvals
- **CCTP Integration** (Scaffolded): Cross-chain USDC settlement via Circle's CCTP

## Architecture

### Smart Contracts

- **RWA721ONFT.sol**: ERC-721 NFT with LayerZero ONFT v2 for cross-chain transfers
- **Marketplace.sol**: Fixed-price marketplace with USDC payments and platform fees
- **Config.sol**: Centralized chain configuration and constants
- **Libraries**: Custom errors and shared types

### Supported Chains

- Base Sepolia (Testnet)
- Ethereum Sepolia (Testnet)

## Quick Start

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Node.js 18+
- Private key for deployment
- [Google Maps API Key](https://developers.google.com/maps/documentation/javascript/get-api-key) (optional, for location features)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd rwa-tokenizer

# Install Foundry dependencies
forge install OpenZeppelin/openzeppelin-contracts

# Copy environment file
cp .env.example .env
# Edit .env and add your PRIVATE_KEY
```

#### Google Maps API Setup (Optional)

For location features in the minting studio:

1. Get a Google Maps API key from the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Maps Static API
3. Add the key to your `frontend/.env.local` file:
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Note:** Without this key, the location picker will show a warning but the mint studio will still work.

### Build & Test

```bash
# Compile contracts
forge build

# Run tests
forge test

# Run tests with gas reporting
forge test --gas-report

# Run tests with verbosity
forge test -vvv
```

### Deploy

Complete deployment guide for fresh contract deployment.

#### Step 1: Deploy RWA721ONFT to Both Chains

Deploy to Ethereum Sepolia:
```bash
forge script script/DeployRWA.s.sol:DeployRWA \
  --rpc-url sepolia \
  --broadcast
```

**Save the deployed address** (shown as "RWA721ONFT deployed at:")

Deploy to Base Sepolia:
```bash
forge script script/DeployRWA.s.sol:DeployRWA \
  --rpc-url base_sepolia \
  --broadcast
```

**Save the deployed address**

#### Step 2: Update WireONFT Script

Edit `script/WireONFT.s.sol` with your deployed addresses:

```solidity
address constant BASE_SEPOLIA_RWA = 0xYourBaseSepolia Address;
address constant SEPOLIA_RWA = 0xYourSepoliaAddress;
```

#### Step 3: Wire ONFT Contracts (Set Trusted Remotes)

**CRITICAL: Must be run on BOTH chains**

Wire Base Sepolia → Sepolia:
```bash
forge script script/WireONFT.s.sol:WireONFT \
  --rpc-url base_sepolia \
  --broadcast
```

Wire Sepolia → Base Sepolia:
```bash
forge script script/WireONFT.s.sol:WireONFT \
  --rpc-url sepolia \
  --broadcast
```

#### Step 4: Deploy Marketplace Contracts

Deploy to Base Sepolia:
```bash
forge script script/DeployMarketplace.s.sol:DeployMarketplace \
  --rpc-url base_sepolia \
  --broadcast
```

**Save the deployed address**

Deploy to Ethereum Sepolia:
```bash
forge script script/DeployMarketplace.s.sol:DeployMarketplace \
  --rpc-url sepolia \
  --broadcast
```

**Save the deployed address**

#### Step 5: Update Frontend Environment Variables

Edit `frontend/.env.local` with your deployed addresses:

```bash
# Contract Addresses (UPDATE THESE)
NEXT_PUBLIC_RWA721_ADDRESS_BASE_SEPOLIA=0xYourBaseSepolia RWA Address
NEXT_PUBLIC_MARKETPLACE_ADDRESS_BASE_SEPOLIA=0xYourBaseSepoliaMarketplaceAddress
NEXT_PUBLIC_RWA721_ADDRESS_SEPOLIA=0xYourSepoliaRWAAddress
NEXT_PUBLIC_MARKETPLACE_ADDRESS_SEPOLIA=0xYourSepoliaMarketplaceAddress

# LayerZero V2 Configuration (DO NOT CHANGE)
NEXT_PUBLIC_LZ_CHAIN_ID_BASE_SEPOLIA=40245
NEXT_PUBLIC_LZ_CHAIN_ID_SEPOLIA=40161

# Other Configuration (from .env.example)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt
NEXT_PUBLIC_PINATA_GATEWAY=gateway.pinata.cloud
NEXT_PUBLIC_USDC_BASE_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_USDC_SEPOLIA=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
NEXT_PUBLIC_PERMIT2_ADDRESS=0x000000000022D473030F116dDEE9F6B43aC78BA3
```

#### Step 6: Verify Deployment

Verify trusted remotes are set correctly:

```bash
# Check Sepolia contract knows about Base Sepolia
cast call 0xYourSepoliaRWAAddress "trustedRemoteLookup(uint32)(bytes)" 40245 \
  --rpc-url sepolia

# Check Base Sepolia contract knows about Sepolia
cast call 0xYourBaseSepoliaRWAAddress "trustedRemoteLookup(uint32)(bytes)" 40161 \
  --rpc-url base_sepolia
```

Both should return non-zero addresses. If they return `0x`, the wiring failed.

#### Step 7: Test the Deployment

1. Mint an NFT on one chain
2. Approve it for bridging
3. Bridge it to the other chain
4. Verify it appears on the destination chain

### Complete Fresh Deployment Checklist

- [ ] Deploy RWA721ONFT to Ethereum Sepolia
- [ ] Deploy RWA721ONFT to Base Sepolia
- [ ] Update WireONFT.s.sol with both addresses
- [ ] Wire Base Sepolia → Sepolia
- [ ] Wire Sepolia → Base Sepolia
- [ ] Verify wiring with `cast call trustedRemoteLookup`
- [ ] Deploy Marketplace to Base Sepolia
- [ ] Deploy Marketplace to Ethereum Sepolia
- [ ] Update frontend/.env.local with all 4 addresses
- [ ] Restart frontend dev server
- [ ] Test mint, bridge, and marketplace functions

## Contract Addresses

### Base Sepolia
- **RWA721ONFTV2**: `0xd85db7a6E816Ef8898e5790767718cA0e6438D7B` ✅ **LayerZero V2 + TokenURI Transfer**
- Marketplace: `0x5605CEf208c1BBDCE0ad9E3fDa9f6C53F64b73aE`
- USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- LayerZero V2 Endpoint: `0x6EDCE65403992e310A62460808c4b910D972f10f`
- LayerZero V2 Endpoint ID: `40245`

### Ethereum Sepolia
- **RWA721ONFTV2**: `0xBa1361556Dd87a05b276963Df9FE3A52CaAd5f17` ✅ **LayerZero V2 + TokenURI Transfer**
- Marketplace: `0x7973Da8485Adf37D00A8aD2967d490B7A01e88F4`
- USDC: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
- LayerZero V2 Endpoint: `0x6EDCE65403992e310A62460808c4b910D972f10f`
- LayerZero V2 Endpoint ID: `40161`

### Universal
- Permit2: `0x000000000022D473030F116dDEE9F6B43aC78BA3`

**Note:** Using LayerZero V2 with `uint32` chain IDs (40245/40161), not V1 `uint16` IDs (10245/10161)

## Usage

### Minting an RWA NFT

```solidity
// Owner mints NFT with IPFS metadata URI
uint256 tokenId = rwa.mint(
    recipient,
    "ipfs://QmYourMetadataHash"
);
```

### Bridging NFT Cross-Chain

```solidity
// Approve ONFT contract
nft.approve(address(rwa), tokenId);

// Estimate fees
(uint256 nativeFee, ) = rwa.estimateSendFee(
    destinationChainId,
    abi.encodePacked(recipient),
    tokenId,
    false,
    ""
);

// Send NFT to destination chain
rwa.sendFrom{value: nativeFee}(
    msg.sender,
    destinationChainId,
    abi.encodePacked(recipient),
    tokenId,
    payable(msg.sender),
    address(0),
    ""
);
```

### Creating a Marketplace Listing

```solidity
// Approve marketplace to transfer NFT
nft.approve(address(marketplace), tokenId);

// Create listing (price in USDC, 6 decimals)
uint256 listingId = marketplace.createListing(
    address(nft),
    tokenId,
    1000 * 1e6  // 1000 USDC
);
```

### Buying from Marketplace

```solidity
// Prepare Permit2 data
IPermit2.PermitTransferFrom memory permit = IPermit2.PermitTransferFrom({
    permitted: IPermit2.TokenPermissions({
        token: address(usdc),
        amount: listingPrice
    }),
    nonce: nonce,
    deadline: block.timestamp + 1 hours
});

// Sign permit off-chain (EIP-712)
bytes memory signature = signPermit(permit);

// Buy NFT (gasless USDC approval)
marketplace.buy(
    listingId,
    msg.sender,
    permit,
    IPermit2.SignatureTransferDetails({
        to: address(marketplace),
        requestedAmount: listingPrice
    }),
    signature
);
```

## RWA Metadata Schema

The metadata follows ERC-721 standard with RWA-specific attributes:

```json
{
  "name": "Property Title",
  "description": "Asset description",
  "image": "ipfs://QmImageHash",
  "external_url": "https://example.com",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060,
    "formatted_address": "New York, NY, USA",
    "place_id": "ChIJOwg_06VPwokRYv534QaPC8g"
  },
  "attributes": [
    {
      "trait_type": "Asset Type",
      "value": "RealEstate"
    },
    {
      "trait_type": "Valuation (USD)",
      "value": "500000"
    },
    {
      "trait_type": "Issuance Date",
      "value": "2025-01-15"
    },
    {
      "trait_type": "Country",
      "value": "United States"
    },
    {
      "trait_type": "Verification Status",
      "value": "Unverified"
    },
    {
      "trait_type": "Bridge Origin Chain",
      "value": "Base"
    },
    {
      "trait_type": "Token Standard",
      "value": "ERC-721 (ONFT)"
    }
  ]
}
```

### Location Data Format

The `location` field is optional and optimized for minimal storage:

- **lat** (number): Latitude coordinate
- **lng** (number): Longitude coordinate
- **formatted_address** (string): Human-readable address from Google Maps
- **place_id** (string, optional): Google Maps Place ID for reference

The location data is powered by Google Maps API and can be set via:
- **Search**: Type an address using Google Maps Autocomplete
- **Current Location**: Use browser geolocation to automatically fetch your current position

## Security Considerations

- All contracts use OpenZeppelin audited libraries
- ReentrancyGuard on marketplace buy functions
- Pausable functionality for emergency stops
- Custom errors for gas-efficient reverts
- Permit2 for gasless USDC approvals
- LayerZero trusted remotes for cross-chain security

## Testing

Test coverage includes:
- RWA721ONFT minting, URI storage, and ownership
- Bridge send/receive with LayerZero simulation
- Marketplace listing, cancellation, and purchases
- Platform fee calculations
- Access control and pause functionality
- Revert conditions and error handling

Run specific test file:
```bash
forge test --match-contract RWATest
forge test --match-contract MarketplaceTest
forge test --match-contract BridgeStubTest
```

## CCTP Integration (TODO)

The marketplace includes scaffolded cross-chain purchase functionality. To complete:

1. Integrate Circle's CCTP TokenMessenger contract
2. Implement attestation fetching from Circle API
3. Add cross-chain message handling for listing settlement
4. Test on CCTP-supported testnets

See `ICCTPScaffold.sol` and `Marketplace.buyCrossChain()` for implementation notes.

## Frontend (Coming Soon)

Next.js application with:
- Mint studio with IPFS upload
- Asset gallery with bridge UI
- Marketplace with Permit2 integration
- WalletConnect/RainbowKit support

## License

MIT

## Resources

- [LayerZero Docs](https://layerzero.gitbook.io/)
- [Circle CCTP](https://developers.circle.com/stablecoins/docs/cctp-getting-started)
- [Uniswap Permit2](https://github.com/Uniswap/permit2)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
