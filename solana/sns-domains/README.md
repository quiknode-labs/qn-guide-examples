# Query Solana Naming Service Domains

This project is based on the guide, [How to Query Solana Naming Service Domains (.sol)](https://www.quicknode.com/guides/web3-sdks/how-to-query-solana-naming-service-domains-sol) by Aaron Milano.

## Clone Example Monorepo

To begin, clone the `qn-guide-examples` repo and navigate to this project's directory.

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/solana/sns-domains
```

## Add Environment Variables

```bash
cp .env.example .env
```

## Install Dependencies and Run Script

Either `npm`, `yarn`, or `pnpm` can be used to install the project's dependencies and run the `index.ts` script.

### npm

```bash
npm i
npm start
```

### Yarn

```bash
yarn
yarn start
```

### pnpm

```bash
pnpm i
pnpm start
```

## Expected Output

If used with the example provided, the result will look like the following:

```
The owner of SNS Domain "bonfida" is: ET1ZtHQxL7oii4R4aMqvd2Rqf6cxwwbJZPHJNqSFLWZn

E645TckHQnDcavVv92Etc6xSWQaq8zzPtPRGBheviRAk owns the following SNS domains:
 1. raj
 2. 🖤
 3. gokal
 4. rajgokal
```