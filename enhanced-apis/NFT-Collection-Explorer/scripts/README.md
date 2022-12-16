## Outline

* [Fetch NFT Collection Details](#fetch-nft-collection-details)
* [Fetch NFTs](#fetch-nfts)
* [Fetch NFTs By Collection](#fetch-nfts-by-collection)
* [Get Token Metadata by Contract Address](#get-token-metadata-by-contract-address)
* [Get Token Metadata By Symbol](#get-token-metadata-by-symbol)
* [Get Transaction Receipts By Address](#get-transaction-receipts-by-address)
* [Get Transfers By NFT](#get-transfers-by-nft)
* [Get Wallet Token Balance](#get-wallet-token-balance)
* [Get Wallet Token Transactions](#get-wallet-token-transactions)
* [Verify NFTs Owner](#verify-nfts-owner)

## Fetch NFT Collection Details

```bash
node fetchNFTCollectionDetails.js
```

```js
[
  {
    name: 'MutantApeYachtClub',
    description: 'MutantApeYachtClub',
    address: '0x60E4d786628Fea6478F785A6d7e704777c86a7c6',
    genesisBlock: 13117018,
    genesisTransaction: '0x025f185262da3c52bf9b87f09a1fea815a27fd8c32a363da72cac0c9cae27436',
    erc721: true,
    erc1155: false
  },
  {
    name: 'Meebits',
    description: 'Meebits',
    address: '0x7Bd29408f11D2bFC23c34f18275bBf23bB716Bc7',
    genesisBlock: 12358080,
    genesisTransaction: '0xf2040b9b67193fe8c861a18cff864b9f35c1f69cc8734c724c388c449a1116c4',
    erc721: true,
    erc1155: false
  }
]
```

## Fetch NFTs

```bash
node fetchNFTs.js
```

```js
{
  owner: '0x91b51c173a4bdaa1a60e234fc3f705a16d228740',
  assets: [
    {
      name: 'Loopy Donuts #3643',
      collectionTokenId: '3643',
      collectionName: 'Loopy Donuts',
      collectionAddress: '0x2106C00Ac7dA0A3430aE667879139E832307AeAa',
      chain: 'ETH',
      network: 'mainnet',
      description: 'Loopy Donuts',
      currentOwner: '0x91b51c173a4bDAa1A60e234fC3f705A16D228740'
    }
  ],
  totalItems: 21,
  totalPages: 3,
  pageNumber: 1
}
```

## Fetch NFTs By Collection

```bash
node fetchNFTsByCollection.js
```

```js
{
  collection: '0x60E4d786628Fea6478F785A6d7e704777c86a7c6',
  tokens: [
    {
      collectionName: 'MutantApeYachtClub',
      collectionAddress: '0x60E4d786628Fea6478F785A6d7e704777c86a7c6',
      chain: 'ETH',
      network: 'mainnet',
      collectionTokenId: '0',
      name: 'MutantApeYachtClub #0',
      description: null
    },
    {
      collectionName: 'MutantApeYachtClub',
      collectionAddress: '0x60E4d786628Fea6478F785A6d7e704777c86a7c6',
      chain: 'ETH',
      network: 'mainnet',
      collectionTokenId: '1',
      name: 'MutantApeYachtClub #1',
      description: null
    },
    {...}
  ],
  totalPages: 1943,
  pageNumber: 1,
  totalItems: 19428
}
```

## Get Token Metadata by Contract Address

```bash
node getTokenMetadataByContractAddress.js
```

```js
{
  contract: {
    name: 'ApeCoin',
    symbol: 'APE',
    decimals: 18,
    genesisBlock: 14204533,
    genesisTransaction: '0x2761f74e2f45d981a9d7553cbbcfbcc862cae416eb37a820300d4c19516d6fca'
  }
}
```

## Get Token Metadata By Symbol

```bash
node getTokenMetadataBySymbol.js
```

```js
{
  pageNumber: 1,
  totalPages: 8,
  totalItems: 149,
  tokens: [
    {
      name: 'USD Coal',
      symbol: 'USDC',
      address: '0xd7175EDbb75E6B2EF63B4f1BB4Ea8737432ae7D6',
      decimals: 18,
      genesisBlock: 4377378,
      genesisTransaction: '0x581d9603666fcfc0c3edd93abe8e8668e9d607c1aed6b513790948dcc5da8060'
    },
    {
      name: 'USD Coin',
      symbol: 'USDC',
      address: '0x8D5F4c4FFcdcf2876b89aa01cB21909a2f1f3a75',
      decimals: 18,
      genesisBlock: 4377378,
      genesisTransaction: '0x69fbb3ba7dab1c1421bd7f54e7ead4dc1614088b361b5f3332fca0ef77b8be5f'
    },
    {...}
  ]
}
```

## Get Transaction Receipts By Address

```bash
node getTransactionReceiptsByAddress.js
```

## Get Transfers By NFT

```bash
node getTransfersByNFT.js
```

```js
{
  collection: '0x60E4d786628Fea6478F785A6d7e704777c86a7c6',
  transfers: [
    {
      date: '2022-11-14T10:25:11.000Z',
      from: '0x465092bBE4ca9675C1Cf9c7BF2620b2eefC77E25',
      to: '0xAA87190076675dA8D3496Da24B0C3BbfA1e56396',
      blockNumber: 15967660,
      txHash: '0xfe7a0a805233b0d6a873caf1c4de215cb7d97cab3725269095229c1ad6763720'
    },
    {
      date: '2022-06-11T01:03:40.000Z',
      from: '0x194cC2541EA8696957aCDcF1dc3dd5A687BB5Ca5',
      to: '0x465092bBE4ca9675C1Cf9c7BF2620b2eefC77E25',
      blockNumber: 14941505,
      txHash: '0xe0bea9da688c56127423cddc1c49b706c3c392a7dd246ccbad2ca012a5f6a6d1'
    },
    {
      date: '2022-06-08T09:59:28.000Z',
      from: '0x465092bBE4ca9675C1Cf9c7BF2620b2eefC77E25',
      to: '0x194cC2541EA8696957aCDcF1dc3dd5A687BB5Ca5',
      blockNumber: 14926083,
      txHash: '0xaab28d27b845c4eb7f9e0a95e18521e47e96b3823edb47b24c9b04c0edf803b0'
    },
    {
      date: '2021-12-11T23:49:56.000Z',
      from: '0xfdbFceE097fb7Fe8fFB2fcad88BD3Cb0498b1DA5',
      to: '0x465092bBE4ca9675C1Cf9c7BF2620b2eefC77E25',
      blockNumber: 13786941,
      txHash: '0x468de64812001b53423d15d21366305de94089bac7681e1044a7296e7fd126af'
    },
    {
      date: '2021-09-18T09:31:05.000Z',
      from: '0x194cC2541EA8696957aCDcF1dc3dd5A687BB5Ca5',
      to: '0xfdbFceE097fb7Fe8fFB2fcad88BD3Cb0498b1DA5',
      blockNumber: 13248857,
      txHash: '0xf24b2a526b22295a82f2a34b38a036eccb940e6b4908a035a5cc93439e7e80ac'
    },
    {
      date: '2021-09-03T02:03:48.000Z',
      from: '0x791Bf322bc5E20360D27a2D27e4cc5A0790D329f',
      to: '0x194cC2541EA8696957aCDcF1dc3dd5A687BB5Ca5',
      blockNumber: 13149960,
      txHash: '0x46250b9b4c55d88ba057f26262c206ebb3f21feb17f2811a15d16bfd9017cfd7'
    },
    {
      date: '2021-08-29T00:42:17.000Z',
      from: '0x0000000000000000000000000000000000000000',
      to: '0x791Bf322bc5E20360D27a2D27e4cc5A0790D329f',
      blockNumber: 13117220,
      txHash: '0x33ca60f747363e7f85a2d35c3ca8ab0bf05185de16b5fee12b62996f51066fe4'
    }
  ],
  totalPages: 1,
  pageNumber: 1,
  totalItems: 7
}
```

## Get Wallet Token Balance

```bash
node getWalletTokenBalance.js
```

```js
{
  assets: [
    {
      address: '0xBd9515FF22188EcebaAC76946cc9c7AfcB52b6b3',
      name: 'Kitty Token',
      decimals: 0,
      symbol: 'KITT',
      logoURI: '',
      chain: 'ETH',
      network: 'mainnet',
      amount: '36'
    },
    {
      address: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF',
      name: 'Basic Attention Token',
      decimals: 18,
      symbol: 'BAT',
      logoURI: '',
      chain: 'ETH',
      network: 'mainnet',
      amount: '17467248908296943231'
    },
    {...}
  ],
  owner: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  totalPages: 41,
  totalItems: 815,
  pageNumber: 1
}
```

## Get Wallet Token Transactions

```bash
node getWalletTokenTransactions.js
```

```js
{
  token: {
    address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
    decimals: 18,
    genesisBlock: 10569013,
    genesisTransaction: '0x0a4022e61c49c59b2538b78a6c7c9a0e4bb8c8fce2d1b4a725baef3c55fb7363',
    name: 'SHIBA INU',
    symbol: 'SHIB'
  },
  transfers: [],
  pageNumber: 1,
  totalPages: 0,
  totalItems: 0
}
```

## Verify NFTs Owner

```bash
node verifyNFTsOwner.js
```

```js
{
  owner: '0x91b51c173a4bdaa1a60e234fc3f705a16d228740',
  assets: [
    '0x2106c00ac7da0a3430ae667879139e832307aeaa:3643',
    '0xd07dc4262bcdbf85190c01c996b4c06a461d2430:133803'
  ]
}
```