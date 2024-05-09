# QuickNode EVM Token Factory Demo

## Overview

This simple demo lets you create an ERC-20 token on any EVM-compatible blockchain. The demo will allow you to set an ERC-20 token's `name`, `symbol`, and `initial supply`. Current supported networks include Sepolia and Holesky (feel free to add more!)

![Preview](public/preview.png)

![Preview](public/preview2.png)

The demo uses [Next.js 14](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

### Install Dependencies

Open the project directory:

```bash
cd sample-dapps/evm-token-factory
```

Then, install the dependencies:

```bash
npm install
# or
yarn
# or
pnpm install
# or
bun install
```

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## Using the Dapp

**Prerequisites**

- Ensure your WalletConnect Project ID is set up in `src/context/web3modal.tsx`.
- Put the RPC url of each chain you want to support in the `rpcUrl` variable. Chains you don't want to support should be commented out in the code.


1. Connect your wallet
    - Make sure you have enough ETH (or other native EVM gas token) in your wallet to cover the create token transaction
    - If you are using Testnet, you can get free ETH from the [QuickNode Faucet](https://faucet.quicknode.com/)
2. Click "Create Token" and confirm the transaction to create the ERC-2O token!

### Architecture

```bash
src/
├── app/
│   ├── page.tsx # Main page for Token Factory
│   └── layout.tsx # Import the Web3Modal component
│   └── api/
│       └── evm/
│           └── createToken/route.ts   # Create New ERC-20 Transaction
└── components/
|    ├── Connect.tsx     # Web3Modal Component
|    ├── Navbar.tsx              # Navbar component
     └── Footer.tsx      # Footer Component
└── context/
    ├── web3modal.tsx     # Wallet Adapter Context providers 
└── smart_contracts/
│   └── abi/
│       └── factory.json  # Factory ABI
│   └── Factory.sol       # Token Factory 
│   └── Token.sol         # Token Details
```

## WalletConnect Configuration

This app utilizes WalletConnect's Web3Modal SDK. Ensure that you are properly filled in the `projectId` variable in the `src/context/web3modal.tsx` file. You can retrieve a project ID [here](https://cloud.walletconnect.com/).

## RPC Configuration

This app requires a valid RPC URL for each blockchain you want to support. Please follow these steps to configure your RPC URL:

- In `src/context/web3modal.tsx`, update the `rpcUrl` for each chain with a valid RPC url. This will ensure that WalletConnect (in the Navbar) can properly load balances. Failing to input a valid RPC will return an error and zero balance. You can retrieve an RPC url on [QuickNode](https://quicknode.com).

- In `page.tsx` (the main page for the Token Factory), it utilizes `ethers` and its `BrowserProvider` class to wrap an injected provider (e.g., MetaMask, Rabby, Coinbase Wallet). Therefore, users interacting with the app should have the network they're creating tokens on added to their wallet and switched to that network. Failing to do so will result in the app displaying a "This app doesn’t support your current network. Switch to an available option following to continue." message.

## Smart Contracts

The ERC-20 Token Factory backend built on smart contracts with Solidity can be deployed on any EVM-compatible blockchain. For demonstration purposes, we have deployed the Token Factory to the Sepolia and Holesky testnet. It has not been deployed to any mainnet or L2 chains yet due to gas fee constraints but feel free to deploy it and open a PR in this repo.

The ERC-20 Token Factory is built with two smart contracts:

- **Factory**: The Factory contract (`smart-contracts/Factory.sol`) inherits the Token.sol smart contract and acts as a Factory for creating and tracking new ERC-20 tokens.

- **Token**: This is an ERC-20 smart contract (`smart-contracts/Token.sol`) defined by the OpenZeppelin standard and includes a `mint` and `transferOwnership` function call in the constructor upon deployment.

**Supported Chains & Addresses**:

- **Sepolia**: 0x28D99a0A1B430B3669B8A2799dCDd7d332ceDb1C
- **Holesky**: 0x5fCCa8dCeD28B13f2924CB78B934Ab0AF445542A

To deploy the Factory contract on a new chain, follow these steps:

1. Ensure [Foundry](https://book.getfoundry.sh/) is installed and navigate inside the `smart-contracts` directory. Install the required dependencies with the following commands:

```sh
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge install foundry-rs/forge-std --no-commit
```

2. Build (compile) the smart contracts using the `forge build` command.

3. Run tests using the `forge test` command.

4. To deploy, run the command and input the proper variables:

```sh
forge create --rpc-url QUICKNODE_HTTP_URL \
--private-key YOUR_PRIVATE_KEY \
src/Factory.sol:Factory
```

5. Edit the `src/context/web3modal.tsx` file and add a new chain object with its chain ID (find a list [here](https://chainlist.org/)), name, native gas token currency, explorer URL, and RPC URL (e.g., QuickNode)

```javascript
export const mainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'MAINNET_RPC_URL'
}
```

6. Add the Factory address and explorer URL to the `CHAINS` object in `app/utils/ethereum.ts`. For example:

```javascript
    1: { // Ethereum Mainnet
        factoryAddress: "The Factory Address",
        explorerUrl: "https://etherscan.io", 
    },
```

If you would like to learn more about creating and deploying smart contracts, check out these resources:

- [How to Create and Deploy a Smart Contract with Hardhat](https://www.quicknode.com/guides/ethereum-development/smart-contracts/how-to-create-and-deploy-a-smart-contract-with-hardhat)
- [https://www.quicknode.com/guides/ethereum-development/smart-contracts/intro-to-foundry](https://www.quicknode.com/guides/ethereum-development/smart-contracts/intro-to-foundry)
- [Different Ways to Verify Your Smart Contract Code](https://www.quicknode.com/guides/ethereum-development/smart-contracts/different-ways-to-verify-smart-contract-code)
- [How to Create and Deploy an ERC20 Token](https://www.quicknode.com/guides/ethereum-development/smart-contracts/how-to-create-and-deploy-an-erc20-token)

## Next.js Documentation

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!