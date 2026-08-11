# Jito Jupiter Swap

A TypeScript utility for executing swaps via Jupiter with Jito MEV bundles.

## Prerequisites

- Node.js & npm
- [Quicknode](https://www.quicknode.com) endpoints with the [Swap API](https://www.quicknode.com/swap-api?utm_source=internal&utm_campaign=sample-apps&utm_content=jupiter-jito)'s Metis (Jupiter Swap) integration and the [Lil' JIT endpoint add-on](https://www.quicknode.com/add-ons/lil-jit-jito-bundles-and-transactions?utm_source=internal&utm_campaign=sample-apps&utm_content=jupiter-jito)
- Solana wallet with SOL
- TypeScript

> _Note: this project utilizes Solana Web3.js v1.95.4_

## Setup

1. Install dependencies:
```bash
npm install @jup-ag/api @solana/web3.js@1 bs58 dotenv 
```

2. Instal dev dependencies:
```bash
npm install -d @types/node
```

3. Create `.env` file and replace with your keys:
```env
METIS_ENDPOINT=https://public.jupiterapi.com
JITO_ENDPOINT=https://jito-mainnet.quiknode.pro/your-key
WALLET_SECRET=21,31,41,51,61,71,81,91  # Your wallet private key as comma-separated numbers
```

## Usage

```typescript
const swapManager = new JitoSwapManager();
swapManager.executeSwap().catch(console.error);
```

## Configuration

Edit `CONFIG` in the script to modify:
- Input/output tokens
- Swap amount
- Tip amount
- Polling intervals

## Safety

- Never commit your `.env` file
- Keep your private keys secure
- Test with small amounts first - mainnet endpoints can result in irreversible loss of funds
