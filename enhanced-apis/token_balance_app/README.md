# ERC-20 Balance App

This React app displays ERC-20 balances from [Quicknode Token API v2](https://www.quicknode.com/docs/ethereum/qn_getWalletTokenBalance_v2). It requires Node.js 22.12 or later and an Ethereum Mainnet endpoint with the **Token and NFT API v2** bundle enabled. See the [guide](https://www.quicknode.com/guides/ethereum-development/dapps/how-to-build-an-erc20-token-balance-app-with-quicknode-token-api).

## Run locally

```sh
npm ci
cp .env.example .env
```

Set `QUICKNODE_RPC_URL` to your endpoint's **Base URL** and `QUICKNODE_RPC_TOKEN` to its **Auth token**. The local API server sends the token in the `x-token` HTTPS header. To use a full HTTPS endpoint URL, leave `QUICKNODE_RPC_TOKEN` blank and set the full URL as `QUICKNODE_RPC_URL`.

Run `npm run start:api` in one terminal and `npm run dev` in another. Open [http://localhost:5173](http://localhost:5173) and enter an Ethereum wallet address.

`npm run build` writes the frontend bundle to `dist/`.
