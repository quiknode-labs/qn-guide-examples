# QuickNode NFT Collection Explorer

## Web Local Development

### Step 1️⃣:
From the root of the project, navigate to `web`, install dependencies, and run the local development server.

```bash
cd web
pnpm i
```

### Step 2️⃣:
Add environment variable.

```bash
cp .env.example .env
```

Open the `.env` file in a code editor and replace **YOUR_URL_HERE** with your [QuickNode Ethereum HTTPS URL](https://www.quicknode.com/?utm_source=qn-github&utm_campaign=nft-collection-explorer&utm_content=sign-up&utm_medium=generic).

### Step 3️⃣:
Start your local server.

```bash
pnpm dev
```
Your app will be serving on [localhost:3000](http://localhost:3000)

## For Mobile Expo Local Development

From the root of the project, navigate to `mobile`, install dependencies, and run the local development server.

```bash
cd mobile
npm i
npm start
```

## Supported Chains

- Ethereum

## QuickNode APIs

- [Token API](https://www.quicknode.com/token-api?utm_source=qn-github&utm_campaign=nft-collection-explorer&utm_content=sign-up&utm_medium=generic)
- [NFT API](https://www.quicknode.com/nft-api?utm_source=qn-github&utm_campaign=nft-collection-explorer&utm_content=sign-up&utm_medium=generic)

## Features

| Status | Feature                                                         | Route          | Method                            | Documentation                        |
| ------ | --------------------------------------------------------------- | -------------- | --------------------------------- | ------------------------------------ |
| ✅     | See token balances                                              | `/balance`     | `getWalletTokenBalance`           | [qn_getWalletTokenBalance]           |
| ✅     | See NFTs grouped by collection                                  | `/collections` | `fetchNFTsByCollection`           | [qn_fetchNFTsByCollection]           |
| ✅     | NFT detail page with metadata and traits on Etherscan           | `/details`     | `fetchNFTCollectionDetails`       | [qn_fetchNFTCollectionDetails]       |


[qn_getWalletTokenBalance]: https://www.quicknode.com/docs/ethereum/qn_getWalletTokenBalance
[qn_getTransactionReceiptsByAddress]: https://www.quicknode.com/docs/ethereum/qn_getTransactionReceiptsByAddress
[qn_fetchNFTsByCollection]: https://www.quicknode.com/docs/ethereum/qn_fetchNFTsByCollection
[qn_fetchNFTCollectionDetails]: https://www.quicknode.com/docs/ethereum/qn_fetchNFTCollectionDetails

