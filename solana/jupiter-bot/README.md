# Jupiter Trading Bot Example

## Overview
This is a simple demo uses Jupiter's v6 API and Quicknode's Metis add-on to create a simple Solana trading bot. The bot monitors price differences between token pairs and executes trades when profitable opportunities arise.

_This example is for educational purposes only. Quicknode does not provide financial advice or endorse any trading strategies. Always do your own research and consult with a financial advisor before making any investment decisions._

The demo uses:
- [Solana Web3.js - 1.x](https://github.com/solana-labs/solana-web3.js/)
- [SPL Token SDK](https://www.npmjs.com/package/@solana/spl-token)
- [Jupiter API SDK](https://www.npmjs.com/package/@jup-ag/api)

Supporting resources:
- [Written Guide - Create a Solana Trading Bot Using Jupiter API](https://www.quicknode.com/guides/solana-development/3rd-party-integrations/jupiter-api-trading-bot)
- [Video Guide - How to Create a Solana Trading Bot](https://www.youtube.com/watch?v=u8Qr1JI3pUM)


## Getting Started

### Install Dependencies

Open the project dictory: 

```bash
cd solana/jupiter-bot
```
Then, install the dependencies:

```bash
npm install
# or
yarn
# or
pnpm install
# or
bun install
```

### Set Environment Variables

Make sure you have a Quicknode endpoint handy--you can get one free [here](https://www.quicknode.com/signup?utm_source=internal&utm_campaign=dapp-examples&utm_content=solana-staking-ui).

- Rename `.env.example` to `.env` and update with your Quicknode Solana Node Endpoint.
- Specify your `SECRET_KEY` (the private key of the wallet you want to use for the bot) -- you can generate a new one with `solana-keygen new` command using the Solana CLI.
- Specify your `SOLANA_ENDPOINT` (get one [here](https://www.quicknode.com/signup?utm_source=internal&utm_campaign=sample-apps&utm_content=jupiter-api-trading-bot)) and `METIS_ENDPOINT` (get one [here](https://marketplace.quicknode.com/add-on/metis-jupiter-v6-swap-api?_gl=1*jztoq8*_gcl_au*NTA3NDE0ODY0LjE3MzY0NDI2MDA.*_ga*MTY4NjIxODQzMi4xNjkwNjY3NjQ5*_ga_DYE4XLEMH3*MTc0MzQ0NDYyOC43LjEuMTc0MzQ0NTgwMC40OS4wLjA)) or use the public endpoint, `https://public.jupiterapi.com`.


```sh
SECRET_KEY=[00, 00, 00, ... 00, 00, 00]
SOLANA_ENDPOINT=https://example.solana-mainnet.quiknode.pro/x123456/
METIS_ENDPOINT=https://public.jupiterapi.com
```

Ensure your wallet is funded and modify the trading strategy in `bot.ts` to suit your needs.

First, run the development server:

```bash
npm run start
# or
yarn start
# or
pnpm start
# or
bun start
```


## How it Works

### Architecture

```bash
- bot.ts # Main bot logic
- index.ts # Entry point
- .env # Environment variables
- package.json # Dependencies
```

### ArbBot Class

The main class that handles all trading logic:

- **constructor**: Sets up the bot with configuration parameters including RPC endpoints, wallet details, and trading parameters
- **init**: Initializes the bot by checking wallet balances and starting the price monitoring
- **initiatePriceWatch**: Creates an interval to regularly check for arbitrage opportunities
- **getQuote**: Fetches current price quotes from Jupiter Exchange
- **evaluateQuoteAndSwap**: Analyzes quotes to determine if they meet profit thresholds
- **executeSwap**: Handles the creation and submission of swap transactions
- **refreshBalances**: Updates the current SOL and USDC balances
- **logSwap**: Records successful trades to a JSON file
- **updateNextTrade**: Prepares for the next trade after a successful swap
- **terminateSession**: Safely shuts down the bot when conditions require it
- **instructionDataToTransactionInstruction**: Converts Jupiter API instruction format to Solana transaction instructions
- **getAdressLookupTableAccounts**: Fetches address lookup tables for optimized transactions
- **postTransactionProcessing**: Handles tasks after a successful transaction
### Main Application

A simple runner script that:
- Loads environment variables
- Creates an instance of the ArbBot with configuration
- Initializes and starts the bot

## Example Trading Strategy

The bot uses a simple arbitrage strategy:
1. Start with an initial token (USDC or SOL)
2. Execute a trade when the price exceeds the target threshold
3. Update parameters for the reverse trade with a profit margin
4. Continue the cycle as long as profitable opportunities exist

_This example is for educational purposes only. Quicknode does not provide financial advice or endorse any trading strategies. Always do your own research and consult with a financial advisor before making any investment decisions._
