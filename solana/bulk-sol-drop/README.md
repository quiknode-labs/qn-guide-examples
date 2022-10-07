# Send Bulk Transactions on Solana

This project is based on the guide, [How to Send Bulk Transactions on Solana](https://www.quicknode.com/guides/solana-development/how-to-send-bulk-transactions-on-solana) by Aaron Milano.

## Clone Example Monorepo

To begin, clone the `qn-guide-examples` repo and navigate to this project's directory.

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/solana/bulk-sol-drop
```

## Add Environment Variables

```bash
cp .env.example .env
```

## Install Dependencies

Either `npm`, `yarn`, or `pnpm` can be used to install the project's dependencies.

```bash
npm i
yarn
pnpm i
```

## File System Wallet Keypair

You will need to create a wallet and airdrop SOL into the wallet. We will create a File System Wallet and save it in a file called `guideSecret.json`. There are two ways to accomplish this:
- The Solana Tool Suite
- The `wallet.ts` script provided by this example

> ***IMPORTANT NOTE: Do not commit your `guideSecret.json` file. Do not remove `guideSecret.json` from the list of ignored files specified in `.gitignore`! If you leak your keypair, [you will get owned and lose your stuff](https://docs.solana.com/wallet-guide/cli#file-system-wallet-security).***

### Solana Tool Suite

Install [the Solana Tool Suite](https://docs.solana.com/cli/install-solana-cli-tools) and run the following command to generate a [File System Wallet Keypair](https://docs.solana.com/wallet-guide/file-system-wallet).

```bash
solana-keygen new --outfile guideSecret.json
```

This will output the following message:

```
Wrote new keypair to guideSecret.json

============================================================================
pubkey: Ajw3ZjeFwiWrkUKkzVTPhKQXvEtyS3wh9uDc14WA6c6B
============================================================================
Save this seed phrase and your BIP39 passphrase to recover your new keypair:

this phrase isnt real dont share seed scripts on the internet silly
============================================================================
```

### Run Wallet Script

Alternatively you can run any of the following commands with your package manager to execute the script in `wallet.ts`.

```bash
npm run kp
yarn kp
pnpm kp
```

This will output the following message:

```
Generated new KeyPair.
Wallet PublicKey: 97U3bpybuN8HtMWUWqBcrdL4Gk5UqrYMDgjSKvHSrEzF

Wrote secret key to guideSecret.json.

Airdrop Transaction Id: 5o4PXDzhPjs8wzGhbm9Qp6iaNLWVVDs699YNoSVWTBM6z5xWhHcPpEreXPRAjPdirknxb8Q5JtV5DoMfUzJVLkyt

https://explorer.solana.com/tx/5o4PXDzhPjs8wzGhbm9Qp6iaNLWVVDs699YNoSVWTBM6z5xWhHcPpEreXPRAjPdirknxb8Q5JtV5DoMfUzJVLkyt?cluster=devnet
```

### Airdrop Funds Into Wallet

Copy the public key provided by whichever of the two previous steps you selected (for example `Ajw3ZjeFwiWrkUKkzVTPhKQXvEtyS3wh9uDc14WA6c6B` or `97U3bpybuN8HtMWUWqBcrdL4Gk5UqrYMDgjSKvHSrEzF` as seen above) and run the following command to airdrop `1` SOL into that wallet.

```bash
solana --url devnet airdrop 1 Ajw3ZjeFwiWrkUKkzVTPhKQXvEtyS3wh9uDc14WA6c6B
```

## Run Script

Run any of the following commands with your package manager to execute the script in `app.ts`.

```bash
npm start
yarn start
pnpm start
```

## Expected Output

```
Initiating SOL drop from Ajw3ZjeFwiWrkUKkzVTPhKQXvEtyS3wh9uDc14WA6c6B

Requesting Transaction 1/5
Requesting Transaction 2/5
Requesting Transaction 3/5
Requesting Transaction 4/5
Requesting Transaction 5/5

[
  {
    status: 'fulfilled',
    value: '3BrErJ4CSmHhePw5PFmP5AxSVEiBiiSmtxTp1SV6hrwSzZmdtrwfrJzjrAwZoJnSPMXpc6ETFxY4brUKMBq43FAC'
  },
  {
    status: 'fulfilled',
    value: '5T7vp8McC85gf8UDt8vjQ8fgbmxPHwzie6fQAGWAZ9EvjSCLtVZiwbQbcSN5YnvKQdgj6J9iVbjzLyoWx7F6mKS'
  },
  {
    status: 'fulfilled',
    value: '59bBpGgKJw1pTV4sDjLq4pediw13B1UbRy7SpDj3qxxEZKM4mSzvJmDQ4ZFEUWcta1bktogoxEwikVteKLNRPHTT'
  },
  {
    status: 'fulfilled',
    value: '3GG3smtjiDnpjkhG5CfC3D8pwVTQeQNuSnrTRtDcFdmxzvYEm4mvtonK1zvwHS91XV7WvtFr7BVb6DuEuKZXu4ma'
  },
  {
    status: 'fulfilled',
    value: '5P3iFRw152exQMt7UJunt66Ga7xYcZrLE3sBe9Zz6NyzNK9NJMRhzTgJ52ZPHk9LTJZBDZwDfGuCrxpNLnfyeJJ5'
  }
]
```