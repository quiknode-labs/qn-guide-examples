# RWA Tokenizer v2 - Quickstart Guide

Get up and running with RWA Tokenizer v2 in under 5 minutes.

## Prerequisites

Ensure you have the following installed:
- [Foundry](https://book.getfoundry.sh/getting-started/installation) - `curl -L https://foundry.paradigm.xyz | bash && foundryup`
- Git

## Setup

### 1. Install Dependencies

```bash
# Make install script executable (if not already)
chmod +x install.sh

# Run installation
./install.sh
```

This will install:
- OpenZeppelin Contracts v5.0.0
- Forge Standard Library

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
# Required: PRIVATE_KEY
# Optional: RPC URLs (defaults provided)
```

### 3. Build Contracts

```bash
forge build
```

Expected output: `Compiling X files...`

### 4. Run Tests

```bash
# Run all tests
forge test

# Run with gas reporting
forge test --gas-report

# Run with verbose output
forge test -vvv

# Run specific test file
forge test --match-contract RWATest
```

Expected: All tests passing ✓

## Deploy (Testnet)

### Option A: Base Sepolia

```bash
# Deploy RWA721ONFT
forge script script/DeployRWA.s.sol:DeployRWA \
  --rpc-url base_sepolia \
  --broadcast \
  --verify
```

### Option B: Ethereum Sepolia

```bash
# Deploy RWA721ONFT
forge script script/DeployRWA.s.sol:DeployRWA \
  --rpc-url sepolia \
  --broadcast \
  --verify
```

### Wire Cross-Chain (Both Chains)

After deploying to both chains:

1. Update addresses in `script/WireONFT.s.sol`:
   ```solidity
   address constant BASE_SEPOLIA_RWA = 0x...;  // Your Base deployment
   address constant SEPOLIA_RWA = 0x...;       // Your Sepolia deployment
   ```

2. Wire on Base Sepolia:
   ```bash
   forge script script/WireONFT.s.sol:WireONFT \
     --rpc-url base_sepolia \
     --broadcast
   ```

3. Wire on Sepolia:
   ```bash
   forge script script/WireONFT.s.sol:WireONFT \
     --rpc-url sepolia \
     --broadcast
   ```

## Verify Deployment

### Check RWA721ONFT

```bash
# Using cast (Foundry)
cast call <RWA_ADDRESS> "name()(string)" --rpc-url <RPC_URL>
# Expected: "RWA Tokenizer"

cast call <RWA_ADDRESS> "symbol()(string)" --rpc-url <RPC_URL>
# Expected: "RWA"

cast call <RWA_ADDRESS> "originChainId()(uint16)" --rpc-url <RPC_URL>
# Expected: 10245 (Base Sepolia) or 10161 (Sepolia)
```

## Interact with Contracts

### Mint an NFT

```bash
# Prepare metadata URI (upload to IPFS first)
METADATA_URI="ipfs://QmYourHash"
RECIPIENT="0xYourAddress"

# Mint (must be contract owner)
cast send <RWA_ADDRESS> \
  "mint(address,string)(uint256)" \
  $RECIPIENT \
  $METADATA_URI \
  --rpc-url <RPC_URL> \
  --private-key $PRIVATE_KEY
```

### Bridge NFT

```bash
DST_CHAIN_ID="10161"  # Sepolia (or 10245 for Base)
RECIPIENT="0xYourAddress"
TOKEN_ID="1"

# Estimate fee
cast call <RWA_ADDRESS> \
  "estimateSendFee(uint16,bytes,uint256,bool,bytes)(uint256,uint256)" \
  $DST_CHAIN_ID \
  $(cast abi-encode "f(bytes)" $(cast to-bytes32 $RECIPIENT)) \
  $TOKEN_ID \
  false \
  "0x" \
  --rpc-url <RPC_URL>

# Send (replace FEE with estimated value)
cast send <RWA_ADDRESS> \
  "sendFrom(address,uint16,bytes,uint256,address,address,bytes)" \
  $FROM_ADDRESS \
  $DST_CHAIN_ID \
  $(cast abi-encode "f(bytes)" $(cast to-bytes32 $RECIPIENT)) \
  $TOKEN_ID \
  $FROM_ADDRESS \
  "0x0000000000000000000000000000000000000000" \
  "0x" \
  --value <FEE> \
  --rpc-url <RPC_URL> \
  --private-key $PRIVATE_KEY
```

## Get Testnet Tokens

Use Quicknode's [multi-chain faucet](https://faucet.quicknode.com/drip) to get testnet ETH.

## Troubleshooting

### "Compiler version not found"
```bash
foundryup
forge build --force
```

### "RPC URL not configured"
Edit `.env` and ensure RPC URLs are set, or use public RPCs:
```
NEXT_PUBLIC_RPC_BASE_SEPOLIA=https://sepolia.base.org
NEXT_PUBLIC_RPC_SEPOLIA=https://rpc.sepolia.org
```

### "Transaction reverted"
Run with verbose output:
```bash
cast send ... --rpc-url <URL> --private-key $PRIVATE_KEY -vvvv
```

### Tests failing
Ensure dependencies are installed:
```bash
./install.sh
forge build
forge test
```

## Next Steps

1. **Explore Tests**: Read test files to understand contract behavior
2. **Customize Metadata**: Update RWA metadata schema in frontend
3. **Build Frontend**: Use Next.js template (coming soon)
4. **Integrate CCTP**: Complete cross-chain purchases
5. **Deploy Mainnet**: Follow same steps with mainnet configs

## Resources

- [Full Documentation](./README.md)
- [Project Structure](./PROJECT_STRUCTURE.md)
- [Foundry Book](https://book.getfoundry.sh/)
- [LayerZero Docs](https://layerzero.gitbook.io/)

## Support

- GitHub Issues: [Create an issue](https://github.com/yourusername/rwa-tokenizer-v2/issues)
- Documentation: See README.md for detailed guides
