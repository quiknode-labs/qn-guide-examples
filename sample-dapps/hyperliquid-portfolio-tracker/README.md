# QuickNode Hyperliquid Portfolio Tracker

## Overview

A real-time portfolio tracker for Hyperliquid perpetual traders. Monitor positions, profit & loss, margin usage, vault holdings, and spot balances for any wallet address using QuickNode's Hyperliquid endpoint.

This demo uses React + Vite with TypeScript, Tailwind CSS, and Supabase PostgreSQL for real-time data updates.

**Written guide**: [Build a Real-Time Hyperliquid Portfolio Tracker](https://www.quicknode.com/guides/hyperliquid/build-portfolio-tracker-using-hypercore-data)

## Features

- **Live Position Tracking** - Real-time updates on perpetual positions with profit & loss
- **Portfolio Analytics** - Account value, margin usage, and trading metrics
- **Vault Management** - Track vault holdings and lock-up schedules
- **Spot Holdings** - Monitor token balances with USD values
- **Search Any Wallet** - Switch between different wallet accounts

## What You Will Need

- Node.js v20 or higher
- [QuickNode Hyperliquid Endpoint](https://www.quicknode.com/chains/hyperliquid) 
- [Supabase account](https://supabase.com/dashboard/sign-up) 

## Getting Started

### Install Dependencies

Clone the repository and navigate to the project directory:

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/sample-dapps/hyperliquid-portfolio-tracker
```

Then, install the dependencies:

```bash
npm install
```

### Set Environment Variables

Create your `.env` file:

```bash
cp .env.example .env
```

### Configure Supabase Database

1. Create a new Supabase project at [supabase.com](https://supabase.com/dashboard)
2. Click the **Connect** button
3. In the App Frameworks section, select **React** and change `using` to **Vite**
4. Copy `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your `.env` file
5. Navigate to **SQL Editor** in the Supabase dashboard
6. Paste the contents of `supabase/schema.sql` and click **Run**

### Setup QuickNode Endpoint

1. Create a Hyperliquid endpoint at [QuickNode Dashboard](https://dashboard.quicknode.com/endpoints)
2. Copy your endpoint URL
3. **Important**: Remove `/evm` and add `/info` at the end
   - Example: `https://example-name.hyperliquid.quiknode.pro/token-id/info`
4. Add to `.env` as `QUICKNODE_API_URL`

Your `.env` should look like:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
QUICKNODE_API_URL=https://your-endpoint.hyperliquid.quiknode.pro/token-id/info
```

### Run the Application

Run both the frontend and indexer:

```bash
npm run dev:both
```

Or run separately:

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Indexer
npm run indexer
```

Open [http://localhost:5173](http://localhost:5173) with your browser and search for a Hyperliquid wallet address to start tracking.

## Using the Dapp

1. Open [http://localhost:5173](http://localhost:5173) in your browser
2. Click the **Demo Wallet** button to load an example wallet address
3. Or enter any Hyperliquid wallet address (0x format) in the search bar
4. View live position data, profit & loss, margin usage, and vault holdings
5. Search for different wallet addresses to track multiple accounts

The indexer will start fetching data (every 500ms) when you search for your first wallet address. Frontend updates data every 1 second. 

## Architecture

```bash
src/
├── indexer/
│   ├── indexer.ts          # Main indexer orchestration & wallet management
│   └── apicalls.ts         # Hyperliquid info endpoint queries
├── components/
│   ├── ui/                 # UI components (Button, Card, Input, etc.)
│   └── dashboard/          # Dashboard components (WalletHeader, PositionsTable, etc.)
├── shared/
│   ├── types.ts            # TypeScript interfaces
│   ├── utils.ts            # Formatting, calculations & utility functions
│   ├── constants.ts        # UI constants for the dashboard
│   └── supabase.ts         # Supabase client for frontend access
├── Dashboard.tsx           # Main dashboard logic
└── main.tsx
supabase/
└── schema.sql              # Complete Database schema
```

### How It Works

**Data Flow:**
1. User enters wallet address → Frontend stores request in database
2. Indexer detects request (polls every 500ms) → Switches to new wallet
3. Indexer fetches data from QuickNode endpoint → Stores in database
4. Frontend polls database (every 1000ms) → UI updates with live data

**Components:**
- **Indexer** - Node.js process that fetches data from 5 Hyperliquid endpoints (account state, positions, vaults, spot balances, delegations) and stores it in PostgreSQL
- **Database** - Supabase PostgreSQL with 6 tables for storing trading data with financial precision
- **Frontend** - React app that displays trading data from the database in real-time

## Troubleshooting

**Indexer stops responding or no data appears:**

Restart the indexer:
```bash
npm run indexer
```

Then search for a wallet address again in the frontend.

**Database connection errors:**

Verify your Supabase credentials in `.env` are correct and the database schema has been applied using the SQL Editor.

**QuickNode endpoint errors:**

Make sure your endpoint URL ends with `/info` instead of `/evm`. Check your QuickNode dashboard to confirm the endpoint is active.

## Learn More

For detailed technical explanations, see the full guide:

- [Build a Real-Time Hyperliquid Portfolio Tracker](https://www.quicknode.com/guides/other-chains/hyperliquid/build-portfolio-tracker-using-hypercore-data) 
- [QuickNode Hyperliquid Docs](https://www.quicknode.com/docs/hyperliquid) 
- [Hyperliquid Documentation](https://hyperliquid.gitbook.io/hyperliquid-docs)

## Extending the Tracker

You can improve this project with:

- Liquidation warnings when positions approach dangerous margin levels
- Historical performance tracking with charts 
- Multi-wallet comparison views

