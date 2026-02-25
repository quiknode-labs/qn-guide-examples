import { createClient, type Client } from "@libsql/client";

let _client: Client | null = null;
let _initialized = false;

export function getClient(): Client {
  if (!_client) {
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL || "file:./data/hyperbase.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _client;
}

export async function getDb(): Promise<Client> {
  const client = getClient();
  if (!_initialized) {
    await runMigrations(client);
    await seedExamples(client);
    _initialized = true;
  }
  return client;
}

async function runMigrations(client: Client) {
  await client.batch(
    [
      `CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        parent_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL,
        query_type TEXT NOT NULL CHECK(query_type IN ('builder', 'sql')),
        query_json TEXT,
        sql_text TEXT,
        viz_type TEXT NOT NULL DEFAULT 'table',
        viz_settings TEXT,
        public_token TEXT UNIQUE,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS dashboards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL,
        filters_json TEXT,
        public_token TEXT UNIQUE,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS dashboard_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dashboard_id INTEGER NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
        question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
        pos_x INTEGER NOT NULL DEFAULT 0,
        pos_y INTEGER NOT NULL DEFAULT 0,
        width INTEGER NOT NULL DEFAULT 6,
        height INTEGER NOT NULL DEFAULT 4,
        card_type TEXT NOT NULL DEFAULT 'question' CHECK(card_type IN ('question', 'text', 'heading')),
        text_content TEXT,
        filter_mapping TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS snippets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        sql_text TEXT NOT NULL,
        description TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `INSERT OR IGNORE INTO collections (id, name, description) VALUES (1, 'Our analytics', 'Root collection for all saved questions and dashboards')`,
    ],
    "write"
  );
}

async function seedExamples(client: Client) {
  const count = await client.execute("SELECT COUNT(*) as c FROM questions");
  if (Number(count.rows[0].c) > 0) return;

  const queries = [
    {
      name: "Hourly Trading Volume (7d)",
      description: "Aggregated USD trading volume per hour over the last 7 days",
      sql: `SELECT\n  toStartOfHour(timestamp) AS hour,\n  round(sum(abs(toFloat64(price) * toFloat64(size))), 2) AS volume_usd\nFROM hyperliquid_trades\nWHERE timestamp > now() - INTERVAL 7 DAY\nGROUP BY hour\nORDER BY hour`,
      viz: "area",
    },
    {
      name: "Top 10 Coins by Volume",
      description: "Most traded coins ranked by total USD volume in the last 7 days",
      sql: `SELECT\n  coin,\n  count() AS trades,\n  round(sum(abs(toFloat64(price) * toFloat64(size))), 2) AS volume_usd\nFROM hyperliquid_trades\nWHERE timestamp > now() - INTERVAL 7 DAY\nGROUP BY coin\nORDER BY volume_usd DESC\nLIMIT 10`,
      viz: "bar",
    },
    {
      name: "Daily Active Traders (30d)",
      description: "Unique buyer addresses per day over the last month",
      sql: `SELECT\n  toDate(timestamp) AS day,\n  uniqExact(buyer_address) AS unique_traders\nFROM hyperliquid_trades\nWHERE timestamp > now() - INTERVAL 30 DAY\nGROUP BY day\nORDER BY day`,
      viz: "line",
    },
    {
      name: "Total Trades (7d)",
      description: "Total number of trades executed in the last 7 days",
      sql: `SELECT count() AS total_trades\nFROM hyperliquid_trades\nWHERE timestamp > now() - INTERVAL 7 DAY`,
      viz: "number",
    },
    {
      name: "BTC Price Trend (7d)",
      description: "Average BTC price per hour over the last 7 days",
      sql: `SELECT\n  toStartOfHour(timestamp) AS hour,\n  round(avg(toFloat64(price)), 2) AS avg_price\nFROM hyperliquid_trades\nWHERE coin = 'BTC'\n  AND timestamp > now() - INTERVAL 7 DAY\nGROUP BY hour\nORDER BY hour`,
      viz: "line",
    },
    {
      name: "ETH vs BTC Volume Comparison",
      description: "Hourly volume comparison between ETH and BTC over 7 days",
      sql: `SELECT\n  toStartOfHour(timestamp) AS hour,\n  round(sumIf(abs(toFloat64(price) * toFloat64(size)), coin = 'BTC'), 2) AS btc_volume,\n  round(sumIf(abs(toFloat64(price) * toFloat64(size)), coin = 'ETH'), 2) AS eth_volume\nFROM hyperliquid_trades\nWHERE coin IN ('BTC', 'ETH')\n  AND timestamp > now() - INTERVAL 7 DAY\nGROUP BY hour\nORDER BY hour`,
      viz: "line",
    },
    {
      name: "Hourly Trade Count (7d)",
      description: "Number of trades executed per hour over the last 7 days",
      sql: `SELECT\n  toStartOfHour(timestamp) AS hour,\n  count() AS trade_count\nFROM hyperliquid_trades\nWHERE timestamp > now() - INTERVAL 7 DAY\nGROUP BY hour\nORDER BY hour`,
      viz: "area",
    },
    {
      name: "Average Trade Size (Top Coins)",
      description: "Average notional trade size in USD for the top 10 coins by volume",
      sql: `SELECT\n  coin,\n  round(avg(abs(toFloat64(price) * toFloat64(size))), 2) AS avg_trade_usd,\n  count() AS trades\nFROM hyperliquid_trades\nWHERE timestamp > now() - INTERVAL 7 DAY\nGROUP BY coin\nORDER BY sum(abs(toFloat64(price) * toFloat64(size))) DESC\nLIMIT 10`,
      viz: "bar",
    },
    {
      name: "Largest Trades (24h)",
      description: "The 20 biggest individual trades by notional value in the last 24 hours",
      sql: `SELECT\n  timestamp,\n  coin,\n  round(toFloat64(price), 2) AS price,\n  round(toFloat64(size), 4) AS size,\n  round(abs(toFloat64(price) * toFloat64(size)), 2) AS notional_usd,\n  buyer_address\nFROM hyperliquid_trades\nWHERE timestamp > now() - INTERVAL 1 DAY\nORDER BY abs(toFloat64(price) * toFloat64(size)) DESC\nLIMIT 20`,
      viz: "table",
    },
    {
      name: "Most Active Buyers (7d)",
      description: "Top 10 buyer addresses by number of trades in the last 7 days",
      sql: `SELECT\n  substring(buyer_address, 1, 8) || '...' || substring(buyer_address, -4) AS buyer,\n  count() AS trades,\n  round(sum(abs(toFloat64(price) * toFloat64(size))), 2) AS total_volume\nFROM hyperliquid_trades\nWHERE timestamp > now() - INTERVAL 7 DAY\nGROUP BY buyer_address\nORDER BY trades DESC\nLIMIT 10`,
      viz: "bar",
    },
    {
      name: "SOL Price Trend (7d)",
      description: "Average SOL price per hour over the last 7 days",
      sql: `SELECT\n  toStartOfHour(timestamp) AS hour,\n  round(avg(toFloat64(price)), 2) AS avg_price\nFROM hyperliquid_trades\nWHERE coin = 'SOL'\n  AND timestamp > now() - INTERVAL 7 DAY\nGROUP BY hour\nORDER BY hour`,
      viz: "line",
    },
    {
      name: "Daily Volume (30d)",
      description: "Total USD trading volume per day over the last month",
      sql: `SELECT\n  toDate(timestamp) AS day,\n  round(sum(abs(toFloat64(price) * toFloat64(size))), 2) AS volume_usd\nFROM hyperliquid_trades\nWHERE timestamp > now() - INTERVAL 30 DAY\nGROUP BY day\nORDER BY day`,
      viz: "bar",
    },
    {
      name: "Volume Share by Coin",
      description: "Proportion of trading volume by coin over the last 7 days",
      sql: `SELECT\n  coin,\n  round(sum(abs(toFloat64(price) * toFloat64(size))), 2) AS volume_usd\nFROM hyperliquid_trades\nWHERE timestamp > now() - INTERVAL 7 DAY\nGROUP BY coin\nORDER BY volume_usd DESC\nLIMIT 8`,
      viz: "pie",
    },
    {
      name: "Total Volume USD (7d)",
      description: "Total notional trading volume in the last 7 days",
      sql: `SELECT round(sum(abs(toFloat64(price) * toFloat64(size))), 0) AS total_volume_usd\nFROM hyperliquid_trades\nWHERE timestamp > now() - INTERVAL 7 DAY`,
      viz: "number",
    },
  ];

  // Insert all questions
  const insertStatements = queries.map((q) => ({
    sql: "INSERT INTO questions (name, description, collection_id, query_type, sql_text, viz_type) VALUES (?, ?, 1, 'sql', ?, ?)",
    args: [q.name, q.description, q.sql, q.viz],
  }));

  const results = await client.batch(insertStatements, "write");
  const questionIds = results.map((r) => Number(r.lastInsertRowid));

  // Create dashboards and cards
  const dashboardStatements = [
    // Dashboard 1: Trading Overview
    {
      sql: "INSERT INTO dashboards (name, description, collection_id) VALUES (?, ?, 1)",
      args: ["Hyperliquid Trading Overview", "Key trading metrics and volume analysis"],
    },
    // Dashboard 2: Market Comparison
    {
      sql: "INSERT INTO dashboards (name, description, collection_id) VALUES (?, ?, 1)",
      args: ["Market Comparison", "ETH vs BTC trading activity and volume trends"],
    },
    // Dashboard 3: Trader Activity
    {
      sql: "INSERT INTO dashboards (name, description, collection_id) VALUES (?, ?, 1)",
      args: ["Trader Activity", "Who is trading, how often, and how big"],
    },
    // Dashboard 4: Volume Deep Dive
    {
      sql: "INSERT INTO dashboards (name, description, collection_id) VALUES (?, ?, 1)",
      args: ["Volume Deep Dive", "Detailed volume analysis across timeframes and coins"],
    },
  ];

  const dashResults = await client.batch(dashboardStatements, "write");
  const dashIds = dashResults.map((r) => Number(r.lastInsertRowid));

  const cardSql =
    "INSERT INTO dashboard_cards (dashboard_id, question_id, pos_x, pos_y, width, height, card_type, text_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

  const cardStatements = [
    // Dashboard 1: Hyperliquid Trading Overview
    { sql: cardSql, args: [dashIds[0], null, 0, 0, 12, 1, "heading", "Trading Overview"] },
    { sql: cardSql, args: [dashIds[0], questionIds[3], 0, 1, 3, 3, "question", null] },
    { sql: cardSql, args: [dashIds[0], questionIds[13], 3, 1, 3, 3, "question", null] },
    { sql: cardSql, args: [dashIds[0], questionIds[4], 6, 1, 6, 3, "question", null] },
    { sql: cardSql, args: [dashIds[0], questionIds[0], 0, 4, 12, 4, "question", null] },
    { sql: cardSql, args: [dashIds[0], questionIds[1], 0, 8, 6, 4, "question", null] },
    { sql: cardSql, args: [dashIds[0], questionIds[2], 6, 8, 6, 4, "question", null] },
    // Dashboard 2: Market Comparison
    { sql: cardSql, args: [dashIds[1], null, 0, 0, 12, 1, "heading", "ETH vs BTC Analysis"] },
    { sql: cardSql, args: [dashIds[1], questionIds[5], 0, 1, 12, 5, "question", null] },
    { sql: cardSql, args: [dashIds[1], null, 0, 6, 12, 2, "text", "**Volume comparison** tracks the relative trading activity between the two largest assets on Hyperliquid. Large divergences may signal market sentiment shifts or arbitrage opportunities."] },
    { sql: cardSql, args: [dashIds[1], questionIds[4], 0, 8, 6, 4, "question", null] },
    { sql: cardSql, args: [dashIds[1], questionIds[10], 6, 8, 6, 4, "question", null] },
    // Dashboard 3: Trader Activity
    { sql: cardSql, args: [dashIds[2], null, 0, 0, 12, 1, "heading", "Trader Activity Analysis"] },
    { sql: cardSql, args: [dashIds[2], questionIds[3], 0, 1, 4, 3, "question", null] },
    { sql: cardSql, args: [dashIds[2], questionIds[13], 4, 1, 4, 3, "question", null] },
    { sql: cardSql, args: [dashIds[2], questionIds[12], 8, 1, 4, 3, "question", null] },
    { sql: cardSql, args: [dashIds[2], questionIds[6], 0, 4, 12, 4, "question", null] },
    { sql: cardSql, args: [dashIds[2], questionIds[9], 0, 8, 6, 4, "question", null] },
    { sql: cardSql, args: [dashIds[2], questionIds[7], 6, 8, 6, 4, "question", null] },
    // Dashboard 4: Volume Deep Dive
    { sql: cardSql, args: [dashIds[3], null, 0, 0, 12, 1, "heading", "Volume Analysis"] },
    { sql: cardSql, args: [dashIds[3], questionIds[13], 0, 1, 4, 3, "question", null] },
    { sql: cardSql, args: [dashIds[3], questionIds[12], 4, 1, 8, 3, "question", null] },
    { sql: cardSql, args: [dashIds[3], questionIds[11], 0, 4, 12, 4, "question", null] },
    { sql: cardSql, args: [dashIds[3], questionIds[0], 0, 8, 12, 4, "question", null] },
    { sql: cardSql, args: [dashIds[3], null, 0, 12, 12, 2, "text", "**Daily vs Hourly**: The daily view (30d) shows macro trends and weekly patterns. The hourly view (7d) reveals intraday activity peaks — typically around US market open and Asian market hours."] },
    { sql: cardSql, args: [dashIds[3], questionIds[8], 0, 14, 12, 5, "question", null] },
  ];

  await client.batch(cardStatements, "write");
}
