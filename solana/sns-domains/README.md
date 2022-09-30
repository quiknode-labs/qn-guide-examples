# Query Solana Naming Service Domains

This project is based on the guide, [How to Query Solana Naming Service Domains (.sol)](https://www.quicknode.com/guides/web3-sdks/how-to-query-solana-naming-service-domains-sol) by Aaron Milano. To begin, clone the `quicknode-guide-examples` repo and navigate to this project's directory.

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/solana/sns-domains
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
npm run domains
```

### pnpm

```bash
pnpm i
pnpm domains
```

## Expected Output

If used with the example provided the result will look like the following:

```
The owner of SNS Domain: ajcwebdev is: 8MDPDPFFfbRL3s9v8ZjGpXKEfhVCkizxem7LRZrFg3V3

8MDPDPFFfbRL3s9v8ZjGpXKEfhVCkizxem7LRZrFg3V3 owns the following SNS domains:
 1. ajcwebdev
```
