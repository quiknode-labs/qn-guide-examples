# Jupiter Ultra Swap Demo

A single-page Solana swap UI demonstrating token swaps using Jupiter Ultra API, Quicknode RPC, Solana Wallet Adapter, and Solana Kit.

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
QUICKNODE_RPC_URL=https://your-endpoint.solana-mainnet.quiknode.pro/
QUICKNODE_RPC_TOKEN=your-auth-token
JUPITER_API_KEY=your_jupiter_api_key_here
```

Copy **Base URL** and **Auth token** from the same Solana mainnet endpoint. The server sends the token in the `x-token` header. Keep the Jupiter API key in its own setting.

> [!NOTE]
> We recommend sending the **Auth token** in the `x-token` header for HTTPS requests. This reduces the risk of exposing credentials through URL logging and monitoring systems.
>
> Quicknode supports both header and URL-path authentication. Open **How to authenticate** on your endpoint overview to see the HTTPS examples. Keep the endpoint credentials in the server environment.

**Note:**

- **QUICKNODE_RPC_URL** (required) is the Base URL of your Quicknode Solana endpoint. You can also supply a public RPC URL.
- **QUICKNODE_RPC_TOKEN** is the Auth token from that endpoint. Leave it unset for a public or already authenticated URL.
- **JUPITER_API_KEY** (required for full functionality): Get your Jupiter API key from [Jupiter API Portal](https://portal.jup.ag/).

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

``` text
├── app/
│   ├── api/                # Next.js API routes (server-side)
│   │   ├── tokens/         # Token list endpoint
│   │   ├── balances/       # Token balances endpoint
│   │   ├── quote/          # Swap quote endpoint
│   │   ├── execute/        # Swap execution endpoint
│   │   ├── rpc/            # RPC proxy endpoint
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
│   ├── useQuote.ts         # Swap quote fetching
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
