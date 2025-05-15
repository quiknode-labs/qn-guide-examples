# Solana Scaled UI Amount Extension Demo

A demonstration of the Solana Token-2022 Scaled UI Amount extension that allows token issuers to define a multiplier for how token balances are displayed without changing underlying raw amounts.

## What's Included

- **Web3.js (Legacy)**: Implementation using `@solana/web3.js` and `@solana/spl-token`
- **Solana Kit**: Modern implementation using `@solana/kit` and related packages

## Features Demonstrated

- Creating tokens with the Scaled UI Amount extension
- Minting and transferring tokens
- Updating the UI multiplier
- Observing the effects on raw vs. UI amounts

## Requirements

- Node.js v22+
- Solana CLI v2.2+
- Local Solana test validator

## Quick Start

1. Clone this repository
2. Change to the `web3` or `kit` directory
3. Install dependencies: `npm install`
4. Create necessary private keys:

```sh
solana-keygen new -s --no-bip39-passphrase -o keys/payer.json && \
solana-keygen new -s --no-bip39-passphrase -o keys/mint-authority.json && \
solana-keygen new -s --no-bip39-passphrase -o keys/holder.json && \
solana-keygen new -s --no-bip39-passphrase -o keys/mint.json
```

5. In a seperate terminal start a local validator: `solana-test-validator -r`
6. In your original terminal, run the demo: `npm start`

## How It Works

The demo performs a sequence of operations showing how the UI amount scales with the multiplier while raw amounts remain unchanged. After running, view the summary table showing the relationship between raw balances and UI amounts throughout the process.

## Learn More

For detailed implementation steps and explanations, visit the full guide:
[Using Scaled UI Amount Token Extension on Solana](https://www.quicknode.com/guides/solana-development/spl-tokens/token-2022/scaled-ui-amount)
