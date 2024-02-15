# QuickNode Solana Explorere Demo

## Overview
This is a simple demo of how to use your QuickNode Solana Node Endpoint to query the Solana blockchain for tokens, transactions, and NFTs for a given wallet.

The demo uses [Next.js 14](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).


## Getting Started

### Install Dependencies

First, install the dependencies:

```bash
npm install
# or
yarn
# or
pnpm install
# or
bun install
```

### Set Environment Variables

Rename `.env.example` to `.env.local` and update with your QuickNode Solana Node Endpoint. Enable the DAS API only if you have enabled the DAS add-on for your QuickNode Solana Node Endpoint.

```env
SOLANA_RPC_URL=https://example.solana-mainnet.quiknode.pro/123456/
DAS_API_ENABLED=true 
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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Using the Dapp

Search for a Solana wallet address and press enter. 
The dapp will redirect to `/wallet/[address]` and query the Solana blockchain for the wallet's token balances, transactions, and NFTs. Results are rendered in respective cards.

### Architecture

```bash
| - src
  | - app
  |  | - api
  |     | - wallet
  | - components
     | - explorer
     | - header
```

- `api` - Contains the API routes for the Solana RPC calls. These can be accessed from the client via `/api/wallet/[method]?walletAddress=[address]`. These GET requests utilize the `@solana/web3.js` library and Metaplex Digital Asset Standard framework to handle queries.
- `components` - Contains the React components for the dapp. 
    - The `explorer` component contains client-side components that call the API routes and render the results.
    - The `header` component contains the search bar for the dapp.


## Next.js Documentation

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
