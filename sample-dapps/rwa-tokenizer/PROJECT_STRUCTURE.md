# RWA Tokenizer v2 - Project Structure

## Directory Layout

```
rwa-tokenizer-v2/
├── contracts/               # Smart contracts
│   ├── interfaces/         # Contract interfaces
│   │   ├── IONFT721.sol           # LayerZero ONFT v2 interface
│   │   ├── IPermit2.sol           # Uniswap Permit2 interface
│   │   ├── IERC20.sol             # Standard ERC20 interface
│   │   ├── ICCTPScaffold.sol      # Circle CCTP scaffold
│   │   └── ILayerZeroEndpoint.sol # LayerZero endpoint interface
│   ├── libraries/          # Shared libraries
│   │   ├── Errors.sol             # Custom error definitions
│   │   └── Types.sol              # Shared type definitions
│   ├── Config.sol                 # Chain configuration constants
│   ├── RWA721ONFT.sol            # Main RWA NFT contract
│   └── Marketplace.sol            # USDC marketplace contract
│
├── script/                  # Deployment scripts
│   ├── DeployRWA.s.sol           # Deploy RWA721ONFT
│   ├── DeployMarketplace.s.sol   # Deploy Marketplace
│   └── WireONFT.s.sol            # Wire cross-chain trust
│
├── test/                    # Foundry tests
│   ├── RWA.t.sol                 # RWA721ONFT tests
│   ├── Marketplace.t.sol         # Marketplace tests
│   └── BridgeStub.t.sol          # Bridge simulation tests
│
├── foundry.toml             # Foundry configuration
├── remappings.txt           # Import remappings
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── install.sh               # Dependency installation script
├── README.md                # Main documentation
└── PROJECT_STRUCTURE.md     # This file
```

## Smart Contract Overview

### RWA721ONFT.sol
- **Purpose**: ERC-721 NFT with LayerZero ONFT v2 bridging
- **Key Features**:
  - Mint RWA NFTs with IPFS metadata URIs
  - Cross-chain NFT transfers via LayerZero
  - Bridge origin tracking
  - ERC-2981 royalty support
  - Pausable and ownable
- **Dependencies**: OpenZeppelin ERC721, ERC2981, Ownable, Pausable

### Marketplace.sol
- **Purpose**: Fixed-price NFT marketplace with USDC payments
- **Key Features**:
  - Create/cancel listings
  - Buy with Permit2 (gasless USDC approvals)
  - Platform fee collection (250 bps default)
  - Scaffolded cross-chain purchases via CCTP
  - ReentrancyGuard protection
- **Dependencies**: OpenZeppelin ReentrancyGuard, Pausable, Ownable

### Config.sol
- **Purpose**: Centralized configuration
- **Contains**:
  - LayerZero endpoint addresses
  - LayerZero chain IDs
  - USDC token addresses (testnet)
  - Permit2 address
  - CCTP domain IDs
  - Platform fee constants

## Test Coverage

### RWA.t.sol
- Minting functionality
- Token URI storage
- Bridge info tracking
- Access control (onlyOwner)
- Pause/unpause functionality
- Trusted remote configuration
- Royalty settings
- Bridge fee estimation

### Marketplace.t.sol
- Listing creation
- Listing cancellation
- Same-chain purchases with Permit2
- Platform fee calculations
- Access control validations
- Pause functionality
- Revert conditions

### BridgeStub.t.sol
- Bridge send operations
- Bridge receive operations
- Token burning on send
- Token minting on receive
- Bridge info updates
- Access control (trusted remotes)
- Full cross-chain flow simulation

## Deployment Flow

1. **Install Dependencies**
   ```bash
   ./install.sh
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with PRIVATE_KEY and RPC URLs
   ```

3. **Deploy to Base Sepolia**
   ```bash
   forge script script/DeployRWA.s.sol --rpc-url base_sepolia --broadcast --verify
   forge script script/DeployMarketplace.s.sol --rpc-url base_sepolia --broadcast --verify
   ```

4. **Deploy to Sepolia**
   ```bash
   forge script script/DeployRWA.s.sol --rpc-url sepolia --broadcast --verify
   forge script script/DeployMarketplace.s.sol --rpc-url sepolia --broadcast --verify
   ```

5. **Wire ONFT Contracts**
   - Update addresses in `script/WireONFT.s.sol`
   - Run on both chains to establish trust

## Key Design Decisions

### 1. LayerZero ONFT v2
- Chosen for mature cross-chain NFT standard
- Burn-and-mint model preserves token IDs
- Trusted remote pattern for security

### 2. Permit2 Integration
- Gasless USDC approvals for better UX
- Industry standard (Uniswap)
- Reduces transaction friction

### 3. CCTP Scaffolding
- Prepared for Circle's CCTP integration
- Clear TODOs for production implementation
- Allows same-chain functionality now

### 4. Custom Errors
- Gas-efficient reverts
- Better developer experience
- Clear error messages

### 5. Modular Design
- Separated concerns (NFT vs Marketplace)
- Reusable libraries
- Clear interfaces

## Security Features

- OpenZeppelin audited contracts
- ReentrancyGuard on value transfers
- Pausable for emergency stops
- Access control (Ownable)
- Checks-Effects-Interactions pattern
- Custom error types
- Comprehensive input validation

## Next Steps

1. **Frontend Development**
   - Next.js app with wagmi/viem
   - IPFS integration (web3.storage/Pinata)
   - Mint studio UI
   - Marketplace UI
   - Bridge UI

2. **CCTP Production Integration**
   - Replace scaffold with Circle SDK
   - Implement attestation fetching
   - Add cross-chain settlement logic
   - Test on supported chains

3. **Advanced Features**
   - Auction functionality
   - Offer system
   - Batch operations
   - Analytics dashboard

## Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [LayerZero Docs](https://layerzero.gitbook.io/)
- [Circle CCTP](https://developers.circle.com/stablecoins/docs/cctp-getting-started)
- [Permit2 Docs](https://github.com/Uniswap/permit2)
