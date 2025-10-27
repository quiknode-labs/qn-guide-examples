# RWA Tokenizer v2 - Product Requirements Document

## Overview

Build **RWA Tokenizer v2** with three pillars:

1. **No-Code RWA Mint Studio** (ERC-721 + IPFS metadata)
2. **LayerZero ONFT v2 bridging** (burn/mint)
3. **Multichain USDC marketplace** with **CCTP-powered** cross-chain settlement (scaffold interface & flow; core same-chain buy works now)

## Technology Stack

### Smart Contracts
- Solidity (0.8.24+)
- **Foundry** (tests)
- LayerZero **ONFT v2** integration
- Circle **CCTP** references (interfaces/hooks)
- OpenZeppelin libs

### Frontend
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- wagmi + viem
- RainbowKit
- web3.storage or Pinata for IPFS
- Permit2 for USDC approvals

### Chains
- Base ↔ Ethereum
- Default to **Base Sepolia** ↔ **Ethereum Sepolia** for demo

### Payments
- USDC (testnet addresses parametric via config)

---

## Features

### 1. No-Code RWA Mint Studio

**Form Fields:**
- `title` - Asset name
- `description` - Asset description
- `location` - Geographic location
- `image (IPFS upload)` - Asset image
- `category (enum)` - Asset type
- `external_url (optional)` - External reference
- `attributes (array of {trait_type, value})` - Custom attributes

**Metadata Schema (Section 2.2):**

Base fields stored as standard ERC-721 metadata JSON keys:
- `name` (== title)
- `description`
- `image`
- `external_url`
- `attributes[]`

**Standard Attributes (auto-added):**
- `Asset Type` - Category value
- `Valuation (USD)` (optional)
- `Issuance Date` - ISO date
- `Country` - From location
- `Verification Status` - "Unverified"
- `Bridge Origin Chain` - "Base" for initial mints
- `Token Standard` - "ERC-721 (ONFT)"

**Category-Specific Attributes (optional):**
- Real Estate: square footage, property type, etc.
- Art: artist, medium, year
- Vehicle: make, model, year
- Commodity: weight, purity, etc.

**Workflow:**
1. User fills form
2. Image uploaded to IPFS
3. Metadata JSON constructed with standard + custom attributes
4. JSON uploaded to IPFS
5. IPFS URI passed to mint() function

---

### 2. LayerZero ONFT v2 Bridging

**Features:**
- Burn and mint model
- Preserves tokenId across chains
- Preserves metadata URI
- Records canonical origin chain
- Trusted remote pattern for security

**User Flow:**
1. User selects NFT to bridge
2. Choose destination chain
3. Estimate LayerZero fees
4. Approve transaction
5. NFT burned on source chain
6. NFT minted on destination chain with same tokenId and metadata

---

### 3. Multichain USDC Marketplace

**Core Features (Implemented):**
- Fixed-price listings in USDC
- Same-chain purchases via Permit2
- Platform fee collection (2.5% default)
- List/cancel/buy functionality

**Cross-Chain Features (Scaffolded):**
- CCTP integration for cross-chain USDC transfers
- Cross-chain purchase flow (UI + contracts prepared)
- Clear TODOs for Circle SDK integration

**User Flow - Same Chain:**
1. List NFT with USDC price
2. Buyer approves via Permit2 (gasless)
3. USDC transferred
4. Platform fee deducted
5. NFT transferred to buyer

---

## RWA Metadata Schema

### Base ERC-721 Fields
```json
{
  "name": "Property Title",
  "description": "Asset description",
  "image": "ipfs://QmImageHash",
  "external_url": "https://example.com",
  "attributes": []
}
```

### Standard Attributes (Always Included)
```json
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
```

### Category-Specific Attributes

**Real Estate:**
- Square Footage
- Property Type
- Bedrooms
- Bathrooms
- Year Built

**Art:**
- Artist
- Medium
- Year Created
- Style
- Dimensions

**Vehicle:**
- Make
- Model
- Year
- VIN
- Mileage

**Commodity:**
- Weight
- Purity
- Origin
- Certification

---

## Frontend Pages

### 1. Mint Page (`/mint`)
- Dynamic form with attribute editor
- IPFS image upload with preview
- Metadata JSON preview
- Mint button
- Transaction status

### 2. Assets Page (`/assets`)
- Grid view of user's NFTs
- Filter by chain
- Show NFT details (image, name, attributes)
- Bridge button per NFT
- Link to view on marketplace

### 3. Market Page (`/market`) - Future
- Grid view of active listings
- Filter by chain, category, price
- Listing card with image, price, chain badge
- Buy button
- Cross-chain purchase option (beta)

---

## Configuration

### Chain Configuration
```typescript
const chains = {
  baseSepolia: {
    id: 84532,
    name: 'Base Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_BASE_SEPOLIA,
    rwa721Address: '0x27F157d70996ecC1eF681477Bde544eed6AB1051',
    marketplaceAddress: '0x2Ad095Ba1DC72cbBB677944DfE71666D39E19293',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    lzChainId: 10245
  },
  sepolia: {
    id: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_SEPOLIA,
    rwa721Address: '0xc6af01072d0d674D5c6Eb73A7A346792FF17dDC5',
    marketplaceAddress: '0xAbD3D8CE19eeCDec970d2F464E8eF95018f3c435',
    usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    lzChainId: 10161
  }
}
```

### IPFS Configuration
- Use web3.storage or Pinata
- Store API token in environment
- Upload image first, get CID
- Construct metadata JSON
- Upload JSON, get CID
- Use `ipfs://{CID}` as tokenURI

---

## Security & Quality

- OpenZeppelin audited contracts
- ReentrancyGuard on value transfers
- Pausable for emergency stops
- Permit2 for gasless approvals
- Custom errors for gas efficiency
- Comprehensive input validation
- TypeScript for type safety
- Error boundaries in React

---

## Development Phases

### Phase 1: Smart Contracts ✅
- [x] RWA721ONFT with ONFT v2
- [x] Marketplace with Permit2
- [x] Deployment to testnets
- [x] Cross-chain wiring
- [x] Comprehensive tests

### Phase 2: Frontend MVP (Current)
- [ ] Project setup with Next.js + TypeScript
- [ ] Shadcn UI components
- [ ] wagmi + RainbowKit setup
- [ ] Network switching
- [ ] Mint form with IPFS
- [ ] Token gallery

### Phase 3: Marketplace Frontend
- [ ] Listing creation UI
- [ ] Marketplace browse UI
- [ ] Purchase flow with Permit2
- [ ] Transaction notifications

### Phase 4: Advanced Features
- [ ] CCTP cross-chain purchases
- [ ] Advanced filtering
- [ ] Search functionality
- [ ] User profiles
- [ ] Analytics dashboard

---

## Environment Variables

```env
# RPC URLs
NEXT_PUBLIC_RPC_BASE_SEPOLIA=https://sepolia.base.org
NEXT_PUBLIC_RPC_SEPOLIA=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

# IPFS
WEB3_STORAGE_TOKEN=

# Contract Addresses
NEXT_PUBLIC_RWA721_ADDRESS_BASE_SEPOLIA=0x27F157d70996ecC1eF681477Bde544eed6AB1051
NEXT_PUBLIC_MARKETPLACE_ADDRESS_BASE_SEPOLIA=0x2Ad095Ba1DC72cbBB677944DfE71666D39E19293
NEXT_PUBLIC_RWA721_ADDRESS_SEPOLIA=0xc6af01072d0d674D5c6Eb73A7A346792FF17dDC5
NEXT_PUBLIC_MARKETPLACE_ADDRESS_SEPOLIA=0xAbD3D8CE19eeCDec970d2F464E8eF95018f3c435

# USDC
NEXT_PUBLIC_USDC_BASE_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_USDC_SEPOLIA=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238

# Permit2
NEXT_PUBLIC_PERMIT2_ADDRESS=0x000000000022D473030F116dDEE9F6B43aC78BA3

# LayerZero
NEXT_PUBLIC_LZ_CHAIN_ID_BASE_SEPOLIA=10245
NEXT_PUBLIC_LZ_CHAIN_ID_SEPOLIA=10161
```

---

## Success Criteria

### MVP (Phase 2)
- [x] Users can connect wallet
- [x] Users can switch between Base Sepolia and Ethereum Sepolia
- [x] Users can upload image to IPFS
- [x] Users can add custom attributes
- [x] Users can mint RWA NFT
- [x] Users can view their NFTs
- [x] NFT metadata displays correctly

### Full Product
- [ ] Users can bridge NFTs between chains
- [ ] Users can list NFTs for sale
- [ ] Users can browse marketplace
- [ ] Users can purchase NFTs with USDC
- [ ] Platform fees collected correctly
- [ ] All transactions tracked and displayed

---

## Future Enhancements

1. **Enhanced Verification**
   - KYC integration
   - Document verification
   - Third-party attestations

2. **Fractional Ownership**
   - ERC-1155 support
   - Share trading
   - Dividend distribution

3. **Advanced Marketplace**
   - Auctions
   - Offers system
   - Batch operations

4. **Analytics**
   - Portfolio tracking
   - Price history
   - Market trends

5. **Mobile App**
   - React Native
   - Mobile wallet support
   - Push notifications
