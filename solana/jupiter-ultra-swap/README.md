# Jupiter Ultra Swap Demo

A single-page Solana swap UI demonstrating token swaps using Jupiter Ultra API, QuickNode RPC, Solana Wallet Adapter, and Solana Kit.

## Features

- Connect Solana wallet (Phantom, Backpack, Solflare)
- Select From and To tokens
- Enter swap amount
- View token balances
- Execute swaps via Jupiter Ultra
- View transaction status and explorer links

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file (copy from `.env.example`):
```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your API keys:
```bash
QUICKNODE_RPC_URL=your_quicknode_rpc_endpoint_here
JUPITER_API_KEY=your_jupiter_api_key_here
```

**Note:** 
- Get your QuickNode RPC endpoint from [QuickNode](https://www.quicknode.com/)
- Get your Jupiter API key from [Jupiter API Portal](https://portal.jup.ag/). The API key is optional but recommended for better rate limits and reliability.
- These API keys are stored server-side and never exposed to the client. They are used in Next.js API routes only.

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** React + Tailwind CSS
- **Wallets:** Solana Wallet Adapter for React
- **Blockchain:** Solana mainnet via QuickNode RPC
- **Swap API:** Jupiter Ultra API
- **Solana SDK:** @solana/kit v5

## Project Structure

```
├── app/
│   ├── api/                # Next.js API routes (server-side)
│   │   ├── tokens/         # Token list endpoint
│   │   ├── balances/       # Token balances endpoint
│   │   ├── quote/          # Swap quote endpoint
│   │   ├── execute/        # Swap execution endpoint
│   │   ├── rpc/            # RPC proxy endpoint
│   │   └── rpc-endpoint/   # RPC URL endpoint
│   ├── layout.tsx          # Root layout with WalletProvider
│   ├── page.tsx            # Main swap page
│   ├── globals.css         # Global styles
│   └── providers/
│       └── WalletProvider.tsx
├── components/
│   ├── SwapCard.tsx        # Main card container
│   ├── WalletButton.tsx    # Wallet connect button
│   ├── TokenSelector.tsx   # Token dropdown
│   ├── TokenInput.tsx      # Token input row
│   ├── SwapButton.tsx      # Swap action button
│   └── StatusMessage.tsx   # Status/error messages
├── hooks/
│   ├── useTokenBalances.ts # Token balance management
│   ├── useTokenList.ts     # Token list fetching
│   └── useSwap.ts          # Swap execution logic
└── lib/
    ├── jupiter.ts          # Jupiter API client (calls API routes)
    ├── solana-client.ts    # Solana Kit RPC client
    └── types.ts            # TypeScript types
```

## Usage

1. Connect your Solana wallet
2. Select a "From" token (default: SOL)
3. Select a "To" token (default: USDC)
4. Enter the amount you want to swap
5. Click "Swap" and approve the transaction in your wallet
6. Wait for confirmation and view the transaction link

## Notes

- This app uses Solana mainnet only
- All RPC calls go through QuickNode endpoint (proxied via API routes)
- Swaps are executed via Jupiter Ultra API (proxied via API routes)
- API keys are stored server-side and never exposed to the client
- Transaction signing uses Solana Wallet Adapter
- Solana Kit is used for RPC operations

## License

ISC

