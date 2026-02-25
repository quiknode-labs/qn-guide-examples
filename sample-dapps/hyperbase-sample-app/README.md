# Hyperbase

A no-code analytics and BI tool for Hyperliquid blockchain data, powered by [Quicknode](https://quicknode.com) SQL Explorer.

Build queries visually, write raw SQL, create dashboards, all against Hyperliquid's on-chain data (trades, orders, funding, positions, and 22+ tables).

![Hyperbase](https://img.shields.io/badge/Quicknode-SQL_Explorer-3EE148)

## What it does

- **Visual Query Builder** pick a table, select columns, add filters, group by, sort, no SQL needed
- **SQL Editor** CodeMirror with syntax highlighting and table/column autocomplete
- **Auto Visualization** queries auto-detect the best chart type (line, bar, area, pie, number, table) based on data shape
- **Dashboards** drag-and-drop grid of saved queries with resizable cards
- **Schema Browser** explore all 22 Hyperliquid tables with column types and descriptions
- **Save & Organize** save queries and dashboards into collections

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Data Source | Quicknode SQL Explorer REST API |
| Charts | Nivo (line, bar, area, pie) |
| SQL Editor | CodeMirror 6 + `@codemirror/lang-sql` |
| Local DB | SQLite via Turso (saved queries, dashboards, collections) |
| Dashboards | `react-grid-layout` |

## Run Locally

```bash
# Clone
git clone https://github.com/quiknode-labs/hyperbase-sample-app.git
cd hyperbase-sample-app

# Install
npm install

# Add your Quicknode API key
cp .env.example .env.local
# Edit .env.local with your key from https://dashboard.quicknode.com

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app seeds 14 example queries and 4 dashboards on first run.

## Quicknode SQL Explorer

This app proxies all queries through Quicknode's SQL Explorer API over Hyperliquid blockchain data. You need a Quicknode account with SQL Explorer access.

API endpoints used:
- `POST /sql/rest/v1/query` execute SQL queries
- `GET /sql/rest/v1/schema` fetch table schemas

## Project Structure

```
src/
├── app/                    # Next.js pages + API routes
│   ├── api/                # Proxy routes (query, schema, CRUD)
│   ├── collection/         # Collection browser
│   ├── dashboard/          # Dashboard view/edit
│   ├── question/           # Query builder + saved questions
│   ├── schema/             # Schema browser
│   └── sql/                # SQL editor
├── components/
│   ├── visualization/      # Charts (Nivo), table, chart picker
│   ├── query-builder/      # Visual query builder steps
│   ├── sql-editor/         # CodeMirror wrapper
│   ├── dashboard/          # Grid layout, cards
│   └── shared/             # Badge, Modal, Spinner
└── lib/
    ├── auto-viz.ts         # Smart chart type detection
    ├── sql-generator.ts    # Visual query → SQL
    ├── quicknode.ts        # API client with concurrency control
    ├── db.ts               # SQLite setup + seed data
    └── types.ts            # TypeScript interfaces
```

