# Overview

This project contains the example code for the Quicknode guide: [Build a Real-Time SOL Perps Dashboard with the Phoenix API](https://www.quicknode.com/guides/solana-development/3rd-party-integrations/build-a-real-time-perps-dashboard-with-phoenix-api)

[Phoenix](https://phoenix.trade) is a Solana-native perpetuals exchange. This project demonstrates how to build a live SOL-PERP market dashboard in React, covering the full data pipeline: seeding historical candles from REST, subscribing to real-time market data over WebSocket, and rendering an interactive candlestick chart alongside a live order book and a rolling feed of recent trade prints.

## Prerequisites

- Node.js 20+
- A modern browser (Chrome, Firefox, Safari)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser.

No API keys or environment variables are required. The dashboard connects directly to Phoenix's public REST and WebSocket endpoints.

## Project Structure

```text
src/
├── api.ts                          # REST helpers (candles, market config)
├── types.ts                        # Shared TypeScript types
├── App.tsx                         # Root component; seeds REST data on mount
├── ws/
│   └── PhoenixWebSocket.tsx        # WebSocket provider + React context
├── components/
│   ├── ConnectionStatus.tsx        # WS connection state indicator
│   ├── MarketInfo.tsx              # Market config panel (fees, leverage, funding)
│   ├── MarketOverview.tsx          # Header stats bar
│   ├── Orderbook.tsx               # Live bid/ask depth table
│   ├── PriceChart.tsx              # Candlestick chart with funding strip
│   └── TradeFeed.tsx               # Recent trade prints
└── utils/
    ├── format.ts                   # Number formatting helpers
    └── useFundingCountdown.ts      # Countdown hook for next funding settlement
```

## Notes

- Data is sourced from `perp-api.phoenix.trade` (REST and WebSocket). No Quicknode RPC endpoint is required for this project.
- The chart renders OHLC candles with a mark price overlay (green) and oracle price overlay (purple dashed). The spread between the two is shown in the header and highlighted red when it exceeds 10 bps.
- Candles are seeded from REST on load and on every WebSocket reconnect, then kept current via the `candles` channel. The WebSocket connection uses exponential backoff up to 15 seconds.
- The order book displays the top bid and ask levels in real time, sorted by price. Bids and asks are derived from the `orderbook` WebSocket channel.
- The trade feed shows the 25 most recent fills, newest first, with side, price, size, and notional value. Prints arrive via the `trades` WebSocket channel.
- The funding strip below the chart tracks rate history for the current session, displays an annualized APR, and counts down to the next settlement interval.
- Switch candle resolution using the timeframe buttons (1m, 5m, 15m, 1h, 4h, 1d) above the chart. Switching re-seeds candles from REST immediately.
