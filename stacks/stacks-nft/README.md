# Mint an NFT on Stacks

This project is based on the guide, [How to Mint NFTs on the Stacks Blockchain](https://www.quicknode.com/guides/web3-sdks/how-to-mint-nfts-on-the-stacks-blockchain) by Ferhat Kochan.

## Clone Example Monorepo

To begin, clone the `qn-guide-examples` repo and navigate to this project's directory.

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/stacks/stacks-nft
```

## Install Clarinet

Make sure you have [Clarinet](https://github.com/hirosystems/clarinet) installed in order to run the following commands.

## Initialize Clarinet Console

```bash
clarinet console
```

Once the console is initialized, run the following command to call the `claim` function on our smart contract. This will mint an NFT in our local environment.

```bash
(contract-call? .nft-factory claim)
```
