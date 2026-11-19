# Flashblocks Base App (Historical)

This app recorded how preconfirmed and canonical transaction inclusion differed on Base Sepolia before Denim. Flashblocks were retired on Base Sepolia and Mainnet. For current integrations, use the standard Base or Base Sepolia Viem chain and read canonical state. See the [Denim migration guide](https://www.quicknode.com/docs/base/flashblocks/overview).

## Features

- **Side-by-Side Comparison**: Live comparison of Flashblocks vs Traditional transaction confirmations
- **Transaction Tracking**: Send test transactions and monitor confirmation times by fetching block transactions with `getBlock` and checking for transaction inclusion
- **Live Metrics Dashboard**: Balances, and transaction status
- **Wallet Integration**: RainbowKit wallet connection with Wagmi

## Archived Setup

### Prerequisites

You will need the following:

- A pre-Denim Base Sepolia RPC that served Flashblocks preconfirmations
- Project ID from [Reown, formerly WalletConnect](https://cloud.reown.com/) - required for wallet connection

#### Base Sepolia RPC Configuration

The original comparison used public endpoints for preconfirmation and canonical state. Base Sepolia no longer serves preconfirmations for `pending`.

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

The original browser configuration used these variables:

- `NEXT_PUBLIC_FLASHBLOCKS_RPC_URL` held the former public Base Sepolia preconfirmation URL.
- `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL` holds the operator-configured URL for canonical Base Sepolia reads.
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` holds the WalletConnect project ID.

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
import { createPublicClient, custom, http } from 'viem'
import { baseSepolia, baseSepoliaPreconf } from 'viem/chains'

const flashblocksRpc = process.env.NEXT_PUBLIC_FLASHBLOCKS_RPC_URL;
const canonicalRpc = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL;

function historicalTransport(url: string | undefined, name: string) {
  return url ? http(url) : custom({
    request: async () => { throw new Error(`Set ${name} to a browser-facing RPC URL.`); },
  }, { retryCount: 0 });
}

export const flashblocksClient = createPublicClient({
  chain: baseSepoliaPreconf, // Auto-uses "pending" for supported actions
  transport: historicalTransport(flashblocksRpc, "NEXT_PUBLIC_FLASHBLOCKS_RPC_URL"),
})

// Traditional client with 2s polling
export const traditionalClient = createPublicClient({
  chain: baseSepolia, // Uses "latest" by default
  transport: historicalTransport(canonicalRpc, "NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL"),
});
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