# Deployment Summary - RWA Tokenizer v2

**Latest Deployment**: January 2025 (V2 with Open Minting)
**Status**: ✅ Successfully Deployed
**Networks**: Base Sepolia & Ethereum Sepolia

## Key Changes in Latest Deployment
- ✅ **Open Minting**: mint() function now accessible by any user (removed onlyOwner)
- ✅ **LayerZero V2**: Full ONFT v2 implementation with tokenURI preservation
- ✅ **Fully Wired**: Peers and enforced options configured on both chains

---

## Deployed Contracts

### Base Sepolia (Chain ID: 84532)

**RWA721ONFTV2** (with Open Minting)
- Address: `0xce2C693E7f87508A4ab587a994659Eb9a3c429e3`
- LayerZero EID: 40245
- Origin Chain ID: 40245
- Explorer: https://sepolia.basescan.org/address/0xce2C693E7f87508A4ab587a994659Eb9a3c429e3

**Marketplace**
- Address: `0x5605CEf208c1BBDCE0ad9E3fDa9f6C53F64b73aE`
- Explorer: https://sepolia.basescan.org/address/0x5605CEf208c1BBDCE0ad9E3fDa9f6C53F64b73aE

### Ethereum Sepolia (Chain ID: 11155111)

**RWA721ONFTV2** (with Open Minting)
- Address: `0x74907F94954c60a60cC93aaE4691C3B5341d514B`
- LayerZero EID: 40161
- Origin Chain ID: 40161
- Explorer: https://sepolia.etherscan.io/address/0x74907F94954c60a60cC93aaE4691C3B5341d514B

**Marketplace**
- Address: `0x7973Da8485Adf37D00A8aD2967d490B7A01e88F4`
- Explorer: https://sepolia.etherscan.io/address/0x7973Da8485Adf37D00A8aD2967d490B7A01e88F4

---

## Configuration

### LayerZero ONFT Bridging
✅ **Wired and Ready**
- Base Sepolia trusts Sepolia ONFT
- Sepolia trusts Base Sepolia ONFT
- Cross-chain bridging is fully functional

### Marketplace Settings
- **Platform Fee**: 2.5% (250 bps)
- **Fee Recipient**: `0x63eb313AD58184F4c25F68d456e8276b77Fdce0f`
- **Payment Token**: USDC (testnet)
- **Approval Method**: Permit2 (gasless)

### USDC Addresses (Testnet)
- Base Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Ethereum Sepolia: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

### Permit2 Address (Universal)
- `0x000000000022D473030F116dDEE9F6B43aC78BA3`

---

## Gas Costs

### Deployment Costs

**Base Sepolia**
- RWA721ONFT: 0.000003051418369424 ETH
- Marketplace: 0.00000149106573868 ETH
- Wire ONFT: 0.000000072177670512 ETH
- **Total**: ~0.000004614661678616 ETH

**Ethereum Sepolia**
- RWA721ONFT: 0.000003097638652622 ETH
- Marketplace: 0.00000149093007042 ETH
- Wire ONFT: 0.000000072171175392 ETH
- **Total**: ~0.000004660739898434 ETH

**Grand Total**: ~0.00000927540157705 ETH (~$0.02 at $2,500/ETH)

---

## Quick Start Guide

### 1. Mint an RWA NFT

```bash
# On Base Sepolia
cast send 0x27F157d70996ecC1eF681477Bde544eed6AB1051 \
  "mint(address,string)(uint256)" \
  <RECIPIENT_ADDRESS> \
  "ipfs://QmYourMetadataHash" \
  --rpc-url base_sepolia \
  --private-key $PRIVATE_KEY
```

### 2. Bridge NFT to Sepolia

```bash
# First, approve the contract
cast send 0x27F157d70996ecC1eF681477Bde544eed6AB1051 \
  "approve(address,uint256)" \
  0x27F157d70996ecC1eF681477Bde544eed6AB1051 \
  <TOKEN_ID> \
  --rpc-url base_sepolia \
  --private-key $PRIVATE_KEY

# Estimate LayerZero fees
cast call 0x27F157d70996ecC1eF681477Bde544eed6AB1051 \
  "estimateSendFee(uint16,bytes,uint256,bool,bytes)(uint256,uint256)" \
  10161 \
  $(cast abi-encode "f(bytes)" $(cast abi-encode "f(address)" <RECIPIENT>)) \
  <TOKEN_ID> \
  false \
  "0x" \
  --rpc-url base_sepolia

# Bridge the NFT (use estimated fee from above)
cast send 0x27F157d70996ecC1eF681477Bde544eed6AB1051 \
  "sendFrom(address,uint16,bytes,uint256,address,address,bytes)" \
  <YOUR_ADDRESS> \
  10161 \
  $(cast abi-encode "f(bytes)" $(cast abi-encode "f(address)" <RECIPIENT>)) \
  <TOKEN_ID> \
  <YOUR_ADDRESS> \
  0x0000000000000000000000000000000000000000 \
  "0x" \
  --value <ESTIMATED_FEE> \
  --rpc-url base_sepolia \
  --private-key $PRIVATE_KEY
```

### 3. Create a Marketplace Listing

```bash
# On Base Sepolia
# First approve marketplace
cast send 0x27F157d70996ecC1eF681477Bde544eed6AB1051 \
  "approve(address,uint256)" \
  0x2Ad095Ba1DC72cbBB677944DfE71666D39E19293 \
  <TOKEN_ID> \
  --rpc-url base_sepolia \
  --private-key $PRIVATE_KEY

# Create listing (price in USDC, 6 decimals)
cast send 0x2Ad095Ba1DC72cbBB677944DfE71666D39E19293 \
  "createListing(address,uint256,uint256)(uint256)" \
  0x27F157d70996ecC1eF681477Bde544eed6AB1051 \
  <TOKEN_ID> \
  1000000000 \
  --rpc-url base_sepolia \
  --private-key $PRIVATE_KEY
```

---

## Frontend Integration

### Contract ABIs

Contract ABIs are available in the `/out` directory:
- `/out/RWA721ONFT.sol/RWA721ONFT.json`
- `/out/Marketplace.sol/Marketplace.json`

### Environment Variables for Frontend

Update your frontend `.env` file with:

```env
# Base Sepolia
NEXT_PUBLIC_RWA721_ADDRESS_BASE_SEPOLIA=0x27F157d70996ecC1eF681477Bde544eed6AB1051
NEXT_PUBLIC_MARKETPLACE_ADDRESS_BASE_SEPOLIA=0x2Ad095Ba1DC72cbBB677944DfE71666D39E19293

# Ethereum Sepolia
NEXT_PUBLIC_RWA721_ADDRESS_SEPOLIA=0xc6af01072d0d674D5c6Eb73A7A346792FF17dDC5
NEXT_PUBLIC_MARKETPLACE_ADDRESS_SEPOLIA=0xAbD3D8CE19eeCDec970d2F464E8eF95018f3c435

# USDC Addresses
NEXT_PUBLIC_USDC_BASE_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_USDC_SEPOLIA=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238

# Permit2
NEXT_PUBLIC_PERMIT2_ADDRESS=0x000000000022D473030F116dDEE9F6B43aC78BA3

# LayerZero
NEXT_PUBLIC_LZ_CHAIN_ID_BASE_SEPOLIA=10245
NEXT_PUBLIC_LZ_CHAIN_ID_SEPOLIA=10161
```

---

## Testnet Faucets

### Get Test ETH
- **Base Sepolia**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- **Ethereum Sepolia**: https://sepoliafaucet.com/

### Get Test USDC
Use Circle's testnet USDC or bridge from faucets:
- Base Sepolia USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Sepolia USDC: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

---

## Verification

All contracts have been verified on their respective block explorers:

### Base Sepolia
- ✅ RWA721ONFT: Verified on Sourcify
- ✅ Marketplace: Verified on Sourcify

### Ethereum Sepolia
- ✅ RWA721ONFT: Verified on Sourcify
- ✅ Marketplace: Verified on Sourcify

---

## Security Notes

### Deployed Configuration
- ✅ Owner: Deployer address
- ✅ Pausable: Yes (emergency stop)
- ✅ Access Control: Owner-only admin functions
- ✅ ReentrancyGuard: Active on value transfers
- ✅ Permit2: Integrated for gasless USDC approvals

### Before Production
1. Transfer ownership to multisig
2. Set up monitoring and alerting
3. Consider timelock for critical operations
4. Audit by professional security firm
5. Bug bounty program

---

## Known Limitations

1. **CCTP Integration**: Scaffolded but not fully implemented
2. **Testnet Only**: Current deployment is on testnets
3. **Gas Fees**: Users pay LayerZero gas fees for bridging
4. **Metadata**: IPFS metadata URIs must be uploaded externally

---

## Support & Resources

- **Documentation**: See README.md
- **Tests**: Run `forge test` for full test suite
- **Coverage**: Run `forge coverage` for code coverage
- **Block Explorers**:
  - Base Sepolia: https://sepolia.basescan.org
  - Ethereum Sepolia: https://sepolia.etherscan.io

---

## Next Steps

1. **Build Frontend**: Use deployed contract addresses
2. **Test Cross-Chain**: Try bridging NFTs between chains
3. **Test Marketplace**: Create listings and make purchases
4. **IPFS Integration**: Set up metadata hosting
5. **Monitoring**: Set up transaction monitoring
6. **Mainnet Planning**: Prepare for production deployment

---

## Deployment Artifacts

Transaction logs and deployment artifacts saved to:
- `/broadcast/DeployRWA.s.sol/`
- `/broadcast/DeployMarketplace.s.sol/`
- `/broadcast/WireONFT.s.sol/`

**Deployment Complete! 🚀**

All contracts are live, verified, and ready to use on Base Sepolia and Ethereum Sepolia testnets.
