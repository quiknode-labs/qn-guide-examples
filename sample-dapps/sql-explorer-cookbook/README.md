# SQL Explorer Cookbook

[Quicknode SQL Explorer](https://www.quicknode.com/sql-explorer) lets you query on-chain data with standard SQL — no indexers, no subgraphs, just a REST API and your API key. Write a query, get rows back.

This sample app demonstrates how to integrate SQL Explorer into a frontend. It ships with 40+ ready-to-run queries against Hyperliquid on-chain data across trading, fills, orders, funding, markets, positions, staking, and more — each with table and chart views so you can see the results immediately.

## What you can do with SQL Explorer

- Query blockchain data using familiar SQL syntax
- Access indexed on-chain data (trades, orders, positions, funding, staking, ledger entries) via a single REST endpoint
- Build dashboards, analytics tools, or any data-driven application on top of it

## What this sample app shows

- **Calling the REST API** — a server-side proxy route (`/api/query`) that sends SQL to the SQL Explorer endpoint and returns results
- **40+ query examples** — organized by category (Trading, Fills, Orders, Funding, Markets, Portfolio & Positions, Staking & Rewards, etc.)
- **Parameterized queries** — dynamic inputs for wallet addresses, validators, coin symbols
- **Visualizing results** — tables with sorting/pagination, and bar/line/area/pie charts
- **Code snippets** — copy-paste ready code in SQL, curl, TypeScript, and Python for every query
- **Use-case pages** — deeper implementations for validator rewards, wallet activity, and liquidations

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- A [Quicknode](https://www.quicknode.com/signup) account with an API key that has the **SQL** application enabled ([create one here](https://dashboard.quicknode.com/api-keys))

### Setup

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd sample-dapps/sql-explorer-cookbook
npm install
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```
QUICKNODE_API_KEY=your_api_key_here
QUICKNODE_SQL_ENDPOINT=https://api.quicknode.com/sql/rest/v1/query
QUICKNODE_CLUSTER_ID=hyperliquid-core-mainnet
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Adding Your Own Queries

Add entries to `src/data/queries.ts`:

```typescript
{
  id: "my-query",
  title: "My Custom Query",
  description: "Description of what this query does",
  category: "Trading",
  sql: `SELECT * FROM hyperliquid_trades LIMIT 10`,
  chartConfig: {           // optional
    type: "bar",
    xKey: "coin",
    yKeys: ["volume_usd"],
  },
}
```

## Environment Variables

| Variable | Description |
|---|---|
| `QUICKNODE_API_KEY` | Your Quicknode API key with SQL application enabled |
| `QUICKNODE_SQL_ENDPOINT` | SQL Explorer REST API endpoint |
| `QUICKNODE_CLUSTER_ID` | Cluster ID (e.g., `hyperliquid-core-mainnet`) |

## License

MIT
