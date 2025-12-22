# Quicknode Sample Apps and Guide Code Examples

> The official code repository for Quicknode Sample Apps and Guide Code Examples.

[![GitHub Stars](https://img.shields.io/github/stars/quiknode-labs/qn-guide-examples?logo=github&style=for-the-badge)](https://github.com/quiknode-labs/qn-guide-examples/stargazers)
[![License](https://img.shields.io/github/license/quiknode-labs/qn-guide-examples?style=for-the-badge)](LICENSE)
[![Follow on X](https://img.shields.io/twitter/follow/quicknode?label=Follow%20Quicknode&style=for-the-badge)](https://x.com/quicknode)

If this repo helps you ship faster, please ⭐ it to support the community.

## Quick Links

- [Sample App Library](https://www.quicknode.com/sample-app-library) (deployable apps)
- [Quicknode Guides](https://www.quicknode.com/guides) (step-by-step tutorials)

## Table of Contents

- [Quick Links](#quick-links)
- [What’s in This Repo](#whats-in-this-repo)
- [How to Use This Repo](#how-to-use-this-repo)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [Community & Support](#community--support)
- [Project Directory (auto-generated)](#project-directory-auto-generated)

## What’s in This Repo

This repository powers Quicknode’s technical guides and tutorials. It includes:

- **Sample App Library**: Full-stack, deployable apps (Next.js, React, etc.) that mirror what you see in the Sample App Library. Look for folders like `sample-dapps/` and other framework-specific directories.
- **Guide Examples**: Smaller, focused examples, backend scripts, and snippets that pair with Quicknode Guides (e.g., `ethereum/`, `solana/`, `binance/`, `webhooks/`, and more).

Each sub-folder has its own README with framework/runtime details, env vars, and run commands tailored to that example.

## How to Use This Repo

1. Pick the folder that matches the guide or demo you’re following.
2. Open that folder’s `README.md` for exact setup and runtime instructions.
3. Copy the required environment variables into a local `.env` file.
4. Run the example locally, adapt it for your stack, or use it as a starting point for your own app.

## Getting Started

General steps (specifics live in each example’s README):

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/<example-folder>
# Install dependencies for the chosen runtime (e.g., npm install, yarn, pip, go mod download)
cp .env.example .env    # if provided
# Update .env with your Quicknode endpoint keys and any required secrets
```

## Contributing

We welcome fixes, new examples, and improvements! See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

**Quick start:**
1. Fork and clone the repo
2. Add your example in the appropriate category folder
3. Include a `README.md` (use [TEMPLATE_README.md](./TEMPLATE_README.md)) and `package.json` (if applicable) with a description
4. Commit and open a PR

## Community & Support

- Join the Quicknode Discord for questions and collaboration: https://discord.gg/quicknode
- Repo-specific bugs or requests: open a GitHub issue so we can track it.
- Need help with Quicknode products? Reach out via support: https://support.quicknode.com/

## Project Directory (auto-generated)

Auto-generated via `node scripts/generate-directory.js`. After adding or moving projects, run:

```bash
node scripts/generate-directory.js
```

Optional: install a pre-commit hook to enforce updates locally:

```bash
ln -s ../../scripts/pre-commit-tree.sh .git/hooks/pre-commit
```

<!-- PROJECT-DIRECTORY:START -->

### AI
- [Base AI Agent](./AI/coinbase-ai-agent)
- [EVM MCP Server](./AI/evm-mcp-server) - *A console-based MCP-compliant server for EVM blockchain data access*
- [Solana MCP Example](./AI/solana-mcp) - *MCP Server for Solana blockchain interactions*

### Base
- [Base MEV-Protected Telegram Trading Bot](./base/telegram-trading-bot)

### Binance
- [Create a BEP20 Token](./binance/bep20)

### Bitcoin
- [Bitcoin Transaction Report Generator](./bitcoin/transaction-report-generator)

### Console API
- [Quicknode Grafana Dashboard Example](./console-api/grafana-dashboard)

### Courses
- [solana-basics](./courses/solana-basics)

### DeFi
- [uniswap-v3-swaps](./defi/uniswap-v3-swaps)

### Enhanced APIs
- [Quicknode NFT Collection Explorer](./enhanced-apis/NFT-Collection-Explorer)
- [Getting Started with Create React App](./enhanced-apis/token_balance_app)

### Ethereum
- [Make a Flash Loan using Aave V3](./ethereum/aave-flash-loan)
- [How to get ABI of a smart contract](./ethereum/ABI)
- [Audit ERC20, ERC721, and ERC1155 Token Activity using Quicknode SDK](./ethereum/audit-token-activity)
- [audit-wallet-activity](./ethereum/audit-wallet-activity)
- [Blinks NFT Minter for Monad](./ethereum/blink-starter-monad)
- [BatchCallAndSponsor](./ethereum/eip-7702)
- [Create and Deploy an ERC20 Token](./ethereum/erc-20)
- [Get the balance of an ERC-20 token](./ethereum/erc-20_balance)
- [How to Create an NFT Bound Account (ERC-6551)](./ethereum/erc-6551)
- [Create a Block Explorer with Quicknode](./ethereum/explorer)
- [Project Name](./ethereum/farcaster-frames)
- [Ethereum Staking Options](./ethereum/staking)
- [wave-portal-svelte](./ethereum/wave-portal-svelte)
- [The Web3 Developer Stack](./ethereum/web3-stack)

### Polygon
- [How To Batch Mint NFTs Using the ERC-721A Implementation](./polygon/erc721a-implementation)
- [Mint an NFT on Polygon with Ethers.js](./polygon/polygon-ethers) - *How to mint an NFT on Polygon with Ethers*
- [polygon-hello-world](./polygon/polygon-hello-world)
- [Create and Deploy a Factory ERC-1155 Contract on Polygon using Truffle](./polygon/polygon-truffle)

### Rails
- [x402-rails Test Application](./rails/x402-micropayments)

### Sample dApps
- [AI-Powered DeFi Yield Optimizer for Aerodrome Finance](./sample-dapps/ai-powered-defi-yield-optimizer)
- [AML and CFT Compliant dApp](./sample-dapps/aml-and-cft-compliant-dapp)
- [Base DEX Aggregator App](./sample-dapps/base-dex-aggregator)
- [Bitcoin Transaction Report Application](./sample-dapps/bitcoin-transaction-report-generator)
- [x402 Video Paywall Demo](./sample-dapps/coinbase-x402) - *A demo application showing how to implement a video paywall using the x402 payment protocol*
- [Crypto Portfolio Tracker](./sample-dapps/crypto-portfolio-tracker-with-the-crypto-market-data-api)
- [Aave V3 Liquidation Tracker](./sample-dapps/ethereum-aave-liquidation-tracker)
- [DEX Trade Performance Analyzer](./sample-dapps/ethereum-dex-trade-performance-analyzer)
- [Ethereum Transaction Report Application](./sample-dapps/ethereum-transaction-report-generator)
- [Quicknode Ethereum Explorer Demo](./sample-dapps/ethereum-wallet-explorer)
- [Quicknode EVM Token Factory Demo](./sample-dapps/evm-token-factory)
- [Flashblocks Base App](./sample-dapps/flashblocks-base)
- [Quicknode Hyperliquid Portfolio Tracker](./sample-dapps/hyperliquid-portfolio-tracker)
- [RWA Tokenizer v2](./sample-dapps/rwa-tokenizer)
- [Quicknode Solana Action Blinker](./sample-dapps/solana-action-blinker)
- [Quicknode Solana Staking UI](./sample-dapps/solana-staking-ui)
- [Quicknode Solana Token-Minter Demo](./sample-dapps/solana-token-maker)
- [Quicknode Solana Explorer Demo](./sample-dapps/solana-wallet-explorer)
- [Token Sweeper 🧹](./sample-dapps/token-sweeper-eip-7702)

### Solana
- [account-deserialization](./solana/account-deserialization)
- [How to Integrate SSO Authentication with a Solana Wallet](./solana/authentication) - *An example project for NextAuth.js with Next.js*
- [Send Bulk Transactions on Solana](./solana/bulk-sol-drop) - *How to Send Bulk Transactions on Solana*
- [candy-machine](./solana/candy-machine)
- [compressed-nfts](./solana/compressed-nfts)
- [explorer-clone-part-1](./solana/explorer-clone-part-1)
- [explorer-clone-part-2](./solana/explorer-clone-part-2)
- [explorer-clone-part-3](./solana/explorer-clone-part-3)
- [functions](./solana/functions)
- [fungible-SPL-token](./solana/fungible-SPL-token)
- [Jupiter Trading Bot Example](./solana/jupiter-bot) - *Example trading bot for Solana using Quicknode and Metis API*
- [Jito Jupiter Swap](./solana/jupiter-jito)
- [mint-nft](./solana/mint-nft)
- [new-wallet-airdrop](./solana/new-wallet-airdrop)
- [priority-fees-addon](./solana/priority-fees-addon)
- [pump-fun-api](./solana/pump-fun-api)
- [pump-yellowstone-copy-trader](./solana/pump-yellowstone-copy-trader)
- [raydium-swap-ts](./solana/raydium-swap-ts)
- [Query Solana Naming Service Domains](./solana/sns-domains) - *How to get a .sol domain from a given Solana wallet address and vice versa*
- [Get All Tokens Held by a Solana Wallet](./solana/sol-get-tokens) - *How to get all tokens held by a Solana wallet*
- [Solana Mobile App](./solana/solana-mobile-app)
- [solana-pay](./solana/solana-pay)
- [solang](./solana/solang)
- [token-extensions](./solana/token-extensions)
- [versioned-tx](./solana/versioned-tx)
- [web3.js-2.0](./solana/web3.js-2.0)
- [websockets](./solana/websockets)
- [yellowstone](./solana/yellowstone)

### Stacks
- [Mint an NFT on Stacks](./stacks/stacks-nft)
- [Deploy a Clarity Smart Contract on Stacks](./stacks/stacks-smart-contract)

### Streams
- [ai-bot-discord](./Streams/ai-bot-discord)
- [Getting Started with Create React App](./Streams/qs-react-app)
- [Getting Started with Create React App](./Streams/wallet-allowance-checker-app)

### Tron
- [Tron gRPC Project Setup Guide](./tron/tron-grpc)

### Webhooks
- [BNB Chain Copytrading Bot with Quicknode Webhooks](./webhooks/copytrading-bot-bnb) - *A copytrading bot for memecoins launched on four.meme platform on BNB Chain using Quicknode Webhooks.*

<!-- PROJECT-DIRECTORY:END -->

Thanks for building with Quicknode and don’t forget to ⭐ the repo if it’s useful!
