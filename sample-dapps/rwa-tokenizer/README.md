# RWA Tokenizer v2

A decentralized platform for tokenizing Real World Assets (RWAs) as NFTs with cross-chain bridging functionality.

## Features

- **No-Code RWA Mint Studio**: Create ERC-721 NFTs with IPFS metadata storage
- **LayerZero ONFT V2 Bridging**: Cross-chain NFT transfers between Base and Ethereum

## ⚠️ Important: Contract Versions

This repository contains **two contract versions**:

- **RWA721ONFTV2.sol** ✅ **RECOMMENDED**: Uses LayerZero V2 (modern, recommended for new deployments)
  - Wiring script: `WireONFTV2.s.sol`
  - Deploy script: `DeployRWAV2.s.sol`
  - Method: `setPeer(uint32 eid, bytes32 peer)`

## Architecture

### Smart Contracts

- **RWA721ONFTV2.sol**: ERC-721 NFT with LayerZero ONFT V2 for cross-chain transfers
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
- Some testnet ETH for gas fees (Use [QuickNode Multi-Chain Faucet](https://faucet.quicknode.com/) to get some testnet ETH)
- WalletConnect Project ID (for frontend wallet connections)
- IPFS Pinata JWT (for frontend IPFS uploads)
- [QuickNode endpoints](https://www.quicknode.com/signup) for Base Sepolia and Ethereum Sepolia (optional, but suggested)
- [Google Maps API Key](https://developers.google.com/maps/documentation/javascript/get-api-key) (optional, for location features)

#### WalletConnect Project ID

To get a WalletConnect Project ID, sign up at [Reown, formerly WalletConnect](https://cloud.reown.com/) and create a new project. You will use this ID in the frontend environment variables to enable wallet connections.

#### IPFS Pinata JWT

To upload NFT metadata to IPFS, you can use Pinata. Sign up at [Pinata](https://pinata.cloud/) and create a JWT (JSON Web Token) for authentication. You will use this JWT in the frontend environment variables to enable IPFS uploads.

#### QuickNode Endpoints (Optional)

While not strictly required, it is highly recommended to use QuickNode endpoints for better reliability and performance.

If you don't have a QuickNode account, you can sign up [here](https://www.quicknode.com/signup). Then, create your endpoints for Base Sepolia and Ethereum Sepolia.

You will use these endpoint URLs in the main project (`.env`) and frontend (`frontend/.env.local`) environment variables.

```bash
# RPC URLs
NEXT_PUBLIC_RPC_BASE_SEPOLIA=
NEXT_PUBLIC_RPC_SEPOLIA=
```

#### Block Explorer API Keys (Optional)

Foundry needs API keys to verify contracts after deployment. You can get a multichain API key (Etherscan V2 API) from [Etherscan](https://etherscan.io).

Since verification is not required for this project, you can leave these keys blank.

```bash
# Etherscan API Keys (for verification)
ETHERSCAN_API_KEY=
BASESCAN_API_KEY=
```

#### Google Maps API Setup (Optional)

For location features in the minting studio:

1. Get a Google Maps API key from the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Maps Static API

You will use this key in the frontend environment variables (`frontend/.env.local`).

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Note:** Without this key, the location picker will show a warning but the mint studio will still work.

### Installation

```bash
# Clone the repository
git clone https://github.com/quiknode-labs/qn-guide-examples.git  
cd qn-guide-examples/sample-dapps/rwa-tokenizer

# Install Foundry dependencies
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std
forge install LayerZero-Labs/LayerZero-v2
forge install https://github.com/LayerZero-Labs/devtools
forge install GNSPS/solidity-bytes-utils

# Copy environment file
cp .env.example .env
```

Then, edit the `.env` file with your private key and other optional settings.

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

#### Deployment Guide

For advanced users who want manual control:

**Step 1: Deploy RWA721ONFTV2 to Both Chains**

Deploy to Ethereum Sepolia:

```bash
forge script script/DeployRWAV2.s.sol:DeployRWAV2 \
  --rpc-url sepolia \
  --broadcast
```

**Save the deployed address** (shown as "RWA721ONFTV2 deployed at:")

Deploy to Base Sepolia:

```bash
forge script script/DeployRWAV2.s.sol:DeployRWAV2 \
  --rpc-url base_sepolia \
  --broadcast
```

**Save the deployed address** (shown as "RWA721ONFTV2 deployed at:")

#### Step 2: Update WireONFTV2 Script

Edit `script/WireONFTV2.s.sol` with your deployed addresses:

```solidity
address constant BASE_SEPOLIA_RWA = 0xYourBaseSepoliaAddress;
address constant SEPOLIA_RWA = 0xYourSepoliaAddress;
```

#### Step 3: Wire ONFT V2 Contracts (Set Peers)

**CRITICAL: Must be run on BOTH chains**

Wire Base Sepolia → Sepolia:

```bash
forge script script/WireONFTV2.s.sol:WireONFTV2 \
  --rpc-url base_sepolia \
  --broadcast
```

Wire Sepolia → Base Sepolia:

```bash
forge script script/WireONFTV2.s.sol:WireONFTV2 \
  --rpc-url sepolia \
  --broadcast
```

#### Step 4: Set Enforced Options (LayerZero V2 Required)

**CRITICAL: Must be run on BOTH chains** - Without this, bridging will fail with `LZ_ULN_InvalidWorkerOptions`

Update addresses in `script/SetEnforcedOptions.s.sol` if not already done, then run:

Set options on Sepolia:

```bash
forge script script/SetEnforcedOptions.s.sol:SetEnforcedOptions \
  --rpc-url sepolia \
  --broadcast
```

Set options on Base Sepolia:

```bash
forge script script/SetEnforcedOptions.s.sol:SetEnforcedOptions \
  --rpc-url base_sepolia \
  --broadcast
```

#### Step 5: Verify Deployment

Verify peers are set correctly (LayerZero V2):

```bash
# Check Sepolia contract knows about Base Sepolia
cast call 0xYourSepoliaRWAAddress "peers(uint32)(bytes32)" 40245 \
  --rpc-url sepolia

# Check Base Sepolia contract knows about Sepolia
cast call 0xYourBaseSepoliaRWAAddress "peers(uint32)(bytes32)" 40161 \
  --rpc-url base_sepolia
```

Both should return non-zero bytes32 values (padded addresses). If they return `0x0000...`, the wiring failed.

#### Step 6: Update Frontend Environment Variables

Create `frontend/.env.local` from the example:

```bash
cp frontend/.env.example frontend/.env.local
```

Then, edit `frontend/.env.local` with your deployed addresses, RPC URLs, WalletConnect Project ID, and Pinata JWT:

```bash
# RPC URLs (UPDATE THESE)
NEXT_PUBLIC_RPC_BASE_SEPOLIA=
NEXT_PUBLIC_RPC_SEPOLIA=

# WalletConnect/Rainbow (UPDATE THIS)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

# IPFS - Pinata (UPDATE THESE)
NEXT_PUBLIC_PINATA_JWT=
NEXT_PUBLIC_PINATA_GATEWAY=gateway.pinata.cloud

# Contract Addresses (UPDATE THESE)
NEXT_PUBLIC_RWA721_ADDRESS_BASE_SEPOLIA=0xYourBaseSepoliaRWAAddress
NEXT_PUBLIC_RWA721_ADDRESS_SEPOLIA=0xYourSepoliaRWAAddress

# LayerZero V2 Configuration (DO NOT CHANGE)
NEXT_PUBLIC_LZ_CHAIN_ID_BASE_SEPOLIA=40245
NEXT_PUBLIC_LZ_CHAIN_ID_SEPOLIA=40161

# USDC Addresses (DO NOT CHANGE)
NEXT_PUBLIC_USDC_BASE_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_USDC_SEPOLIA=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238

# Permit2 Address (Universal)
NEXT_PUBLIC_PERMIT2_ADDRESS=0x000000000022D473030F116dDEE9F6B43aC78BA3

# Google Maps API (OPTIONAL)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

#### Step 7: Start Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Step 8: Test the Deployment

1. Mint an NFT on one chain
2. Approve it for bridging
3. Bridge it to the other chain
4. Verify it appears on the destination chain

## Contract Addresses

### Base Sepolia

- **RWA721ONFTV2**: `0xd85db7a6E816Ef8898e5790767718cA0e6438D7B` ✅ **LayerZero V2 + TokenURI Transfer**

### Ethereum Sepolia

- **RWA721ONFTV2**: `0xAA490D756571F48c7E0Add9056081C9Ae97d4746` ✅ **LayerZero V2 + TokenURI Transfer**

### Universal

- Permit2: `0x000000000022D473030F116dDEE9F6B43aC78BA3`

**Note:** Using LayerZero V2 with `uint32` chain IDs (40245/40161), not V1 `uint16` IDs (10245/10161)

## Usage on Smart Contract Level

### Minting an RWA NFT

```solidity
// Anyone can mint NFT with IPFS metadata URI (V2)
uint256 tokenId = rwa.mint(
    recipient,
    "ipfs://QmYourMetadataHash"
);
```

### Bridging NFT Cross-Chain (LayerZero V2)

```solidity
// Approve ONFT contract
nft.approve(address(rwa), tokenId);

// Prepare send parameters
SendParam memory sendParam = SendParam({
    dstEid: destinationChainId,  // LayerZero V2 endpoint ID
    to: bytes32(uint256(uint160(recipient))),  // bytes32 format
    tokenId: tokenId,
    extraOptions: "",  // Optional: gas settings
    composeMsg: "",    // Optional: composed calls
    onftCmd: ""        // Optional: ONFT specific commands
});

// Quote the fee
MessagingFee memory fee = rwa.quoteSend(sendParam, false);

// Send NFT to destination chain
rwa.send{value: fee.nativeFee}(sendParam, fee, payable(msg.sender));
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
    "lng": -74.006,
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
- Pausable functionality for emergency stops
- Custom errors for gas-efficient reverts
- Permit2 for gasless USDC approvals
- LayerZero trusted remotes for cross-chain security

## Testing

Test coverage includes:

- RWA721ONFT/RWA721ONFTV2 minting, URI storage, and ownership
- TokenID collision prevention after bridging (V2)
- Bridge send/receive with LayerZero simulation
- Access control and pause functionality
- Revert conditions and error handling

Run specific test file:

```bash
forge test --match-contract RWATest              # V1 tests
forge test --match-contract RWA721ONFTV2Test     # V2 tests
```

## Frontend

Next.js application with:

- Mint studio with IPFS upload
- Asset gallery with bridge UI
- WalletConnect/RainbowKit support

## License

MIT

## Resources

- [LayerZero Docs](https://layerzero.gitbook.io/)
- [Uniswap Permit2](https://github.com/Uniswap/permit2)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
