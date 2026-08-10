# Quicknode Solana SDK

A sample TS SDK for interacting optimizing Solana Transactions using Solana Web3.js-2.0 and Quicknode.

## Features

- Automatic compute unit estimation
- Dynamic priority fee calculation using Quicknode's [Solana Priority Fee API](https://www.quicknode.com/add-ons/solana-priority-fee?utm_source=internal&utm_campaign=sample-apps&utm_content=solana-web3.js-2.0-optimized-tx)
- Smart transaction preparation and sending
- Type-safe API
- [Solan Web3.js - 2.0](https://github.com/solana-labs/solana-web3.js)

## Installation

Clone this repo and then navigate to `web3.js-2.0` folder and run `npm install` to install dependencies. 

## Quick Start

- Create or import your keypair (you can generate using `solana-keygen`). 
- Make sure file is saved as secret.json (or update imports accordingly).
- Update `endpoint` in `example.ts` to point to your Quicknode endpoint.
- Run `example.ts` to see the example. Ensure you have the [Solana Priority Fee API](https://www.quicknode.com/add-ons/solana-priority-fee?utm_source=internal&utm_campaign=sample-apps&utm_content=solana-web3.js-2.0-optimized-tx) endpoint add-on enabled in your Quicknode account.
