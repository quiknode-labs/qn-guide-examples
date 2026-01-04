# Flashblocks Base App

A decentralized application demonstrating Base Flashblocks capabilities with side-by-side comparison of transaction confirmations: Flashblocks vs Traditional blocks.

## Features

- **Side-by-Side Comparison**: Live comparison of Flashblocks vs Traditional transaction confirmations
- **Transaction Tracking**: Send test transactions and monitor confirmation times by fetching block transactions with `getBlock` and checking for transaction inclusion
- **Live Metrics Dashboard**: Balances, and transaction status
- **Wallet Integration**: RainbowKit wallet connection with Wagmi

## Quick Start

### Prerequisites

You will need the following:

- A [Quicknode](http://dashboard.quicknode.com/) account with Base Sepolia endpoint (optional)
- Project ID from [Reown, formerly WalletConnect](https://cloud.reown.com/) - required for wallet connection

#### Setting Up Quicknode

1. **Create Endpoints**: Log in to your [Quicknode account](http://dashboard.quicknode.com/) and create a new endpoint for Base Sepolia testnet.

2. **Get Endpoint Key**: After creating the endpoint, go to the endpoint dashboard and copy the HTTPS endpoint URL. You will need this key to configure your application.

#### Setting Up Reown (formerly, WalletConnect)

1. **Create a Reown (formerly, WalletConnect) Project**: Head to the [Reown Cloud](https://cloud.reown.com/) and create a new project. You can name it whatever you want.

2. **Get Project ID**: After creating the project, you will be redirected to the project dashboard. Here, you can find your Project ID, which you'll need to use in your application.

### Project Setup

1. **Clone and Install**
   
```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/sample-dapps/flashblocks-base
```

2. **Install Dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Configure Environment**

Copy the `.env.example` file to `.env.local`.

```bash
cp .env.example .env.local
```

Then, fill in the following variables:

```bash
`NEXT_PUBLIC_QUICKNODE_ENDPOINT`: Your Quicknode endpoint
`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Your WalletConnect project ID
```

4. **Run Development Server**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. **Open Application**

Navigate to `http://localhost:3000`

## Technology Stack

- **Framework**: Next.js
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Web3**: Viem, Wagmi, RainbowKit for wallet connections
- **State Management**: React hooks with custom state management

## Key Components

- **ComparisonPanel** (`components/comparison-panel.tsx`): Main orchestrator for side-by-side comparison view
- **MetricsDisplay** (`components/metrics-display.tsx`): Individual metrics display for each chain type
- **CTASection** (`components/cta-section.tsx`): Quicknode marketing integration and signup links
- **Header** (`components/header.tsx`): Application header with branding
- **Providers** (`components/providers.tsx`): Context providers for theme and Web3

## Custom Hooks Architecture

### Current Hooks
- **use-transaction-tracking.ts**: Manages transaction lifecycle, sending, and confirmation tracking
- **use-balance-tracker.ts**: Tracks wallet balances

### Implementation Details

#### Transaction Confirmation Strategy
- Uses Viem's `getBlock` with different client configurations, polling recent blocks every 100ms until the transaction is included

> Note: This implementation is not optimized for production use, but is suitable for demonstration purposes of the Flashblocks. In a production application, you would need to use `waitForTransactionReceipt` or a similar method to ensure transaction confirmation.

- **Flashblocks**: Uses `baseSepoliaPreconf` chain
- **Traditional**: Uses `baseSepolia` chain

> Note: The default block tag for **Base Sepolia Preconf** is `pending`. The `pending` tag is required for Flashblocks support.

- Dual client architecture for simultaneous transaction monitoring

#### Client Configuration
```typescript
// Flashblocks client
export const flashblocksClient = createPublicClient({
  chain: baseSepoliaPreconf, // Auto-uses "pending" for supported actions
  transport: http(process.env.QUICKNODE_ENDPOINT),
})

// Traditional client
export const traditionalClient = createPublicClient({
  chain: baseSepolia, // Uses "latest" by default
  transport: http(process.env.QUICKNODE_ENDPOINT),
})
```

## Development Commands

```bash
# Development
pnpm dev          # Start Next.js development server on port 3000
pnpm build        # Build production application
pnpm start        # Start production server
pnpm lint         # Run ESLint on codebase

# Package management
pnpm install      # Install dependencies
```

## Project Structure

```
/app/              # Next.js App Router pages and layouts
/components/       # React components (main UI + shadcn/ui)
  /ui/             # shadcn/ui component library
/hooks/            # Custom React hooks for blockchain interactions
/lib/              # Utilities, constants, client configs, and mock data
/types/            # TypeScript type definitions
/public/           # Static assets
/styles/           # Global CSS files
```

## Key Configuration Files

- **`lib/constants.ts`**: Centralized configuration including polling intervals and mock mode toggle
- **`lib/clients.ts`**: Viem client configurations for Flashblocks and traditional chains
- **`lib/wagmi.ts`**: Wagmi configuration with RainbowKit integration