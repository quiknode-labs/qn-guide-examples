# BNB Chain Copytrading Bot with Quicknode Streams

An automated copytrading bot that monitors successful traders on the four.meme platform (BNB Chain's memecoin launchpad) and executes proportional trades in real-time using Quicknode Streams.

## Overview

This bot demonstrates how to build a copytrading system by:

- Monitoring specific wallet addresses for token purchases on BNB Chain
- Receiving instant notifications via Quicknode Streams
- Automatically executing proportional copy trades with configurable parameters
- Implementing safety features like slippage protection and balance reserves

> Read the complete guide: [Building a Copytrading Bot on BNB Chain with Quicknode Streams](https://www.quicknode.com/guides/quicknode-products/streams/copytrading-bot)

## Features

✅ **Real-time Trade Monitoring** - Instant webhook notifications when target wallet makes purchases  
✅ **Intelligent Trade Sizing** - Configurable multiplier (e.g., copy 10% of whale's trade)  
✅ **Safety Limits** - Maximum trade amount, minimum balance reserve, slippage protection  
✅ **HMAC Security** - Webhook signature verification prevents unauthorized requests  
✅ **Transaction Simulation** - Validates trades before execution to prevent failed transactions  

## Prerequisites

Before running this bot, you'll need:

### 1. Node.js and Package Manager

- **Node.js v20.x or higher** - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **pnpm**

Verify installation:
```bash
node --version  # Should show v20.x or higher
npm --version
```

### 2. Quicknode Account and BNB Chain Endpoint

1. **Sign up for Quicknode**
   - Visit [Quicknode](https://www.quicknode.com/signup) and create a free account

2. **Create a BNB Chain Endpoint**
   - Click **"Create Endpoint"** from your dashboard
   - Select **"BNB Smart Chain"** → **"Mainnet"**
   - Choose your desired plan
   - Click **"Create Endpoint"**
   - Copy your **HTTP Provider URL** (e.g., `https://example.bsc.quiknode.pro/abc123/`)

3. **Set Up Stream**
   - Navigate to [Streams Dashboard](https://dashboard.quicknode.com/streams)
   - Click **"New Stream"**
   - Select **"BNB Smart Chain"** → **"Mainnet"**
   - Select **Block with Receipts** as the dataset
   - Click **Customize your payload** to apply a filter and choose the **Write your own filter** option
   - Copy the filter code from `filter.js` in this repository
   - Update `TARGET_WALLET` in the filter to the address you want to monitor (e.g., `0x4262F7B70b81538258EB2C5ECAD3947Ba4e0C8b0`)
   - Test the filter with a block number you want to monitor (e.g., `65392331`)
   - Select **Webhook** as the destination type
   - Save the **Security Token** shown in the settings

   **Note:** Setting destination URL will be done after setting up your public URL in step 4. So, leave it here for now. We will come back to it later.
   
### 3. BNB Chain Wallet with Funds

You need a wallet with BNB for:
- **Trading capital** - BNB to execute copy trades
- **Gas fees** - Network fees for transactions

> ⚠️⚠️⚠️ **Important**: Never commit your private key to version control or share it publicly.

### 4. Public URL for Webhook (Development)

Quicknode needs to send webhooks to a public URL. During development, use **[ngrok](https://ngrok.com/download)** or any similar tunneling service.

You'll use ngrok to expose your local server after starting the bot (see Usage section).

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/webhooks/copytrading-bot-bnb
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
   
Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your values:

```bash
# Quicknode Configuration
QUICKNODE_SECURITY_TOKEN=your_security_token_from_streams_dashboard # 👈 UPDATE HERE
BNB_RPC_URL=https://your-quicknode-bnb-endpoint.quiknode.pro/abc123/ # 👈 UPDATE HERE

# Wallet Configuration (⚠️ KEEP THIS SECURE)
PRIVATE_KEY=0x...your_wallet_private_key # 👈 UPDATE HERE

# Server Configuration
PORT=3000

# Trading Strategy
MIN_COPY_TRADE_AMOUNT=0.01         # Only copy trades >= 0.01 BNB
COPY_TRADE_MULTIPLIER=0.1          # Copy 10% of whale's trade size
MAX_TRADE_AMOUNT=0.5               # Maximum 0.5 BNB per trade
MIN_BALANCE=0.05                   # Keep 0.05 BNB reserve for gas
SLIPPAGE_TOLERANCE=5               # 5% slippage tolerance
```

**Configuration Parameters Explained**:

- `MIN_COPY_TRADE_AMOUNT` - Minimum whale trade size to copy (filters small trades)
- `COPY_TRADE_MULTIPLIER` - Percentage of whale's trade to copy (0.1 = 10%)
- `MAX_TRADE_AMOUNT` - Maximum BNB per trade (risk management)
- `MIN_BALANCE` - Reserve BNB for gas fees (prevents failed transactions)
- `SLIPPAGE_TOLERANCE` - Maximum acceptable price movement (%)

## Usage

### 1. Start the Bot

```bash
npm run dev
```

You should see:
```
🔑 Trading wallet: 0x...

============================================================
🚀 BNB Chain Copytrading Bot Started
============================================================
📡 Webhook URL: http://localhost:3000/webhook
💚 Health Check: http://localhost:3000/health
🎯 Target Contract: 0x5c952063c7fc8610FFDB798152D69F0B9550762b
📊 Copy Multiplier: 10%
⚡ Max Trade Amount: 0.5 BNB
============================================================

💰 Current Balance: 0.523456 BNB
```

### 2. Expose Your Webhook URL (Development)

In a **new terminal window**, start ngrok:

```bash
ngrok http 3000
```

Copy the **HTTPS URL** from ngrok output:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

### 3. Create Your Quicknode Stream

Go back to your [Quicknode Streams Dashboard](https://dashboard.quicknode.com/streams):
1. Fill in the **Destination URL** field with your ngrok URL + `/webhook`
2. Test the webhook destination by sending a test payload
3. If bot is running, you should see that bot acts accordingly since it receives the webhook
4. Save the Stream

### 4. Monitor Bot Activity

The bot will now receive webhooks when your target wallet makes purchases. You'll see output like:

```
============================================================
🚨 New Webhook Received - 2025-01-15T10:30:45.123Z
============================================================

📊 Whale Trade Detected:
├─ Token: 0x76138888158f7ce4bbe14c59e18e880d57ab4444
├─ Whale: 0x4262F7B70b81538258EB2C5ECAD3947Ba4e0C8b0
├─ Amount: 4397.589924 tokens
├─ Cost: 0.000049 BNB
├─ Fee: 0.000000 BNB
├─ Total Spent: 0.000049 BNB
└─ TX: 0x4f4e720a...

💰 Wallet Balance: 0.523456 BNB

🎯 Executing Copy Trade:
├─ Our Amount: 0.000005 BNB
├─ Expected Tokens: 439.758992
├─ Min Tokens: 417.870842
└─ Slippage: 5%

⏳ Sending transaction...
✅ Transaction sent: 0x789abc...
🔍 View on BscScan: https://bscscan.com/tx/0x789abc...
✅ Copy trade successful! Block: 45678901
```

## Project Structure

```
copytrading-bot/
├── src/
│   ├── config.ts           # Configuration and environment variables
│   ├── webhookServer.ts    # Express server for receiving webhooks
│   ├── tradingBot.ts       # Viem-based trading logic
│   └── index.ts            # Entry point
├── filter.js               # Quicknode Stream filter (for reference)
├── .env                    # Your environment variables (DO NOT COMMIT)
├── .env.example            # Template for environment variables
├── package.json            # Node.js project file
└── README.md               # This README file
```

## Troubleshooting

### Bot doesn't receive webhooks

**Check ngrok is running**:
```bash
# In a separate terminal
ngrok http 3000
```

**Verify Quicknode Streams Destination URL**:
- Should be: `https://your-ngrok-url.ngrok.io/webhook` (note the `/webhook` path)

**Check Streams status**:
- Visit [Quicknode Streams Dashboard](https://dashboard.quicknode.com/streams)
- Ensure Streams is **Active** and has recent deliveries

### "Insufficient balance" errors

**Check actual balance**:
```bash
curl http://localhost:3000/health
```

**Reduce trade parameters**:
```bash
# In .env
COPY_TRADE_MULTIPLIER=0.05    # Reduce from 0.1 to 0.05 (5%)
MAX_TRADE_AMOUNT=0.1          # Reduce from 0.5 to 0.1 BNB
```

**Add more BNB**:
- Transfer at least 0.1 BNB to your wallet address
- Keep minimum 0.05 BNB for gas fees

### "Transaction simulation failed"

This means the trade would revert on-chain. Common causes:

**Insufficient slippage tolerance**:
```bash
SLIPPAGE_TOLERANCE=10         # Increase from 5 to 10%
```

**Price moved too quickly**:
- This is expected with fast-moving memecoins
- The bot correctly prevented a bad trade

**Token trading is paused**:
- Check if token graduated to PancakeSwap
- Some tokens pause trading during migrations

### HMAC verification failed

**Check security token**:
```bash
# In .env
QUICKNODE_SECURITY_TOKEN=your_token_here
```

**Get correct token**:
1. Go to Quicknode Streams Dashboard
2. Click on your Stream
3. Copy the "Security Token" shown
4. Update your `.env` file
5. Restart the bot

### Filter not matching trades

**Verify target wallet address**:
- Ensure `TARGET_WALLET` in `filter.js` matches exactly (including case)
- Addresses are case-insensitive but must be valid checksummed format

**Test filter with recent block**:
1. Find recent block on [BscScan](https://bscscan.com/)
2. Look for transactions to 4.meme contract
3. Use "Run Test" feature in Quicknode dashboard with that block number

## Resources

- **[Quicknode Documentation](https://www.quicknode.com/docs)**
- **[Quicknode Streams Documentation](https://www.quicknode.com/docs/streams)**
- **[Viem Documentation](https://viem.sh/)**
- **[BNB Chain Docs](https://docs.bnbchain.org/)**
- **[four.meme Platform](https://four.meme/)**
- **[BscScan Explorer](https://bscscan.com/)**

## Disclaimer

**⚠️ Important**: This bot is for educational purposes only. Cryptocurrency trading carries significant risk. Past performance of traders does not guarantee future results. You may lose all funds. Only trade with money you can afford to lose. The authors and Quicknode are not responsible for any trading losses. Always do your own research (DYOR) before trading.