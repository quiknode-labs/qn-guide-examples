# How To Batch Mint NFTs Using the ERC-721A Implementation

This project is based on the guide, [How To Batch Mint NFTs Using the ERC-721A Implementation](https://www.quicknode.com/guides/smart-contract-development/how-to-batch-mint-nfts-using-the-erc-721a-implementation?utm_source=qn-github&utm_campaign=erc721_a&utm_content=sign-up&utm_medium=generic) by Ferhat Kochan.

### Clone Example Monorepo

To begin, clone the `qn-guide-examples` repo and navigate to this project's directory.

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/polygon/erc721a-implementation
```

### Add Environment Variables

Create a `.env` file and add your environment variables in the following format:

```
PRIVATE_KEY=
RPC_URL=
```

### Install Dependencies

Npm should be used to install project directories:

```bash
npm i
```

### Compile Contracts

To compile the set of smart contracts, run the following command:

```bash
npx hardhat compile
```

### Deploy Contract

To deploy the BatchNFTs contract to Mumbai testnet, run the following command:

```bash
npx hardhat run --network mumbai scripts/deploy.js
```

> As configured in `hardhat.config.js` and `deploy.js`.


### Minting NFTs

To mint NFTs, run the following command:

```bash
npx hardhat run --network mumbai scripts/mint.js
```
