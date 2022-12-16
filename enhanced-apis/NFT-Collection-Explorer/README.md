# QuickNode Sample Wallet App

## Next Local Development

From the root of the project, navigate to `web`, install dependencies, and run the local development server.

```bash
cd web
pnpm i
pnpm dev
```

### Deploy Next Application to Vercel

```bash
pnpm vercel --yes --prod --env NEXT_PUBLIC_QN_URL=YOUR_URL_HERE
```

## Expo Local Development

From the root of the project, navigate to `mobile`, install dependencies, and run the local development server.

```bash
cd mobile
npm i
npm start
```

## Supported Chains

- Ethereum

## QuickNode APIs

- [Token API](https://www.quicknode.com/token-api)
- [NFT API](https://www.quicknode.com/nft-api)

## Features

| Status | Feature                                                         | Route          | Method                            | Documentation                        |
| ------ | --------------------------------------------------------------- | -------------- | --------------------------------- | ------------------------------------ |
| ✅     | See token balances                                              | `/balance`     | `getWalletTokenBalance`           | [qn_getWalletTokenBalance]           |
| ✅     | See NFTs grouped by collection                                  | `/collections` | `fetchNFTsByCollection`           | [qn_fetchNFTsByCollection]           |
| ✅     | NFT detail page with metadata and traits on Etherscan           | `/details`     | `fetchNFTCollectionDetails`       | [qn_fetchNFTCollectionDetails]       |
|        | See historical NFT and Token transactions (with Etherscan link) | `/history`     | `getTransactionReceiptsByAddress` | [qn_getTransactionReceiptsByAddress] |

[qn_getWalletTokenBalance]: https://www.quicknode.com/docs/ethereum/qn_getWalletTokenBalance
[qn_getTransactionReceiptsByAddress]: https://www.quicknode.com/docs/ethereum/qn_getTransactionReceiptsByAddress
[qn_fetchNFTsByCollection]: https://www.quicknode.com/docs/ethereum/qn_fetchNFTsByCollection
[qn_fetchNFTCollectionDetails]: https://www.quicknode.com/docs/ethereum/qn_fetchNFTCollectionDetails

## Future

| Status | Feature                                                    | Route            | Method                                 | Documentation                          |
| ------ | ---------------------------------------------------------- | ---------------- | -------------------------------------- | -------------------------------------- |
|        | `receive` to copy your address to the clipboard            | `/receive`       | `?`                                    | []                                     |
|        | `send` to transfer tokens or NFTs                          | `/send`          | `?`                                    | []                                     |
|        | Fetch NFTs                                                 | `/nfts`          | `qn_fetchNFTs`                         | [qn_fetchNFTs]                         |
|        | Get Token Metadata By Contract Address                     | `/token-address` | `qn_getTokenMetadataByContractAddress` | [qn_getTokenMetadataByContractAddress] |
|        | Get Token Metadata By Symbol                               | `/token-symbol`  | `qn_getTokenMetadataBySymbol`          | [qn_getTokenMetadataBySymbol]          |
|        | Get Transfers By NFT                                       | `/transfers`     | `qn_getTransfersByNFT`                 | [qn_getTransfersByNFT]                 |
|        | Get Wallet Token Transactions                              | `/transactions`  | `qn_getWalletTokenTransactions`        | [qn_getWalletTokenTransactions]        |
|        | Verify NFTs Owner                                          | `/owner`         | `qn_verifyNFTsOwner`                   | [qn_verifyNFTsOwner]                   |

[qn_fetchNFTs]: https://www.quicknode.com/docs/ethereum/qn_fetchNFTs
[qn_getTokenMetadataByContractAddress]: https://www.quicknode.com/docs/ethereum/qn_getTokenMetadataByContractAddress
[qn_getTokenMetadataBySymbol]: https://www.quicknode.com/docs/ethereum/qn_getTokenMetadataBySymbol
[qn_getTransfersByNFT]: https://www.quicknode.com/docs/ethereum/qn_getTransfersByNFT
[qn_getWalletTokenTransactions]: https://www.quicknode.com/docs/ethereum/qn_getWalletTokenTransactions
[qn_verifyNFTsOwner]: https://www.quicknode.com/docs/ethereum/qn_verifyNFTsOwner