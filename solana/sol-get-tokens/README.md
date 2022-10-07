# Get All Tokens Held by a Solana Wallet

This project is based on the guide, [How to Get All Tokens Held by a Wallet in Solana](https://www.quicknode.com/guides/web3-sdks/how-to-get-all-tokens-held-by-a-wallet-in-solana) by Aaron Milano.

## Clone Example Monorepo

To begin, clone the `qn-guide-examples` repo and navigate to this project's directory.

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/solana/sol-get-tokens
```

## Add Environment Variables

```bash
cp .env.example .env
```

## Install Dependencies and Run Script

Either `npm` or `pnpm` can be used to install the project's dependencies and run the script.

### npm

```bash
npm i
npm start
```

### pnpm

```bash
pnpm i
pnpm start
```

## Expected Output

If used with the example wallet provided (`vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg`) the result will look like the following:

```
Found 55 token account(s) for wallet vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg.

Token Account No. 1: 5yXaDYUKMvWGcgaUp5G99KizoU2dacAWGBupReC98RkZ
--Token Mint: 34wykniHzkMCW2yjfhKWaTV5rMW6LzY4UGJUV4FNUGJa
--Token Balance: 100

Token Account No. 2: GsufVXTZfr14Pde63ggD75utapmWmHUWnYZkb9kfjN3u
--Token Mint: 559u4Tdr9umKwft3yHMsnAxohhzkFnUBPAFtibwuZD9z
--Token Balance: 1

...
```