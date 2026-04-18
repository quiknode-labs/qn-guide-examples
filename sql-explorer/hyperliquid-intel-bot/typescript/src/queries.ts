/**
 * SQL Explorer query definitions and REST API client.
 *
 * Each function wraps a SQL query and sends it to the Quicknode SQL Explorer
 * REST API. The SQL is standard ClickHouse-compatible syntax.
 */

const SQL_EXPLORER_URL = "https://api.quicknode.com/sql/rest/v1/query";
const QUICKNODE_API_KEY = process.env.QUICKNODE_API_KEY;
if (!QUICKNODE_API_KEY) {
  throw new Error("Set QUICKNODE_API_KEY in your .env file before running the bot.");
}
const CLUSTER_ID = "hyperliquid-core-mainnet";

interface QueryResult<T = Record<string, string>> {
  data: T[];
  meta: { name: string; type: string }[];
  rows: number;
  statistics: { elapsed: number; rows_read: number; bytes_read: number };
}

/** Send a SQL query to Quicknode SQL Explorer, return the result rows. */
export async function runQuery<T = Record<string, string>>(
  sql: string
): Promise<T[]> {
  const resp = await fetch(SQL_EXPLORER_URL, {
    method: "POST",
    headers: {
      "x-api-key": QUICKNODE_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql, clusterId: CLUSTER_ID }),
  });

  if (!resp.ok) {
    throw new Error(`SQL Explorer error: ${resp.status} ${resp.statusText}`);
  }

  const result: QueryResult<T> = await resp.json();
  console.log(`  ${result.rows} rows in ${result.statistics.elapsed.toFixed(2)}s`);
  return result.data;
}

/** Daily aggregate metrics for the last 7 days. */
export async function getPlatformOverview() {
  return runQuery(`
    SELECT
      day,
      total_volume_usd,
      total_fills,
      active_traders,
      total_fees,
      liquidation_count,
      liquidation_volume_usd
    FROM hyperliquid_metrics_overview
    WHERE day >= today() - INTERVAL 7 DAY
    ORDER BY day ASC
  `);
}

/** Top 10 assets by 24h trading volume. */
export async function getTopAssets() {
  return runQuery(`
    SELECT
      coin,
      count() AS trades,
      round(sum(toFloat64(price) * toFloat64(size)), 2) AS volume_usd,
      countDistinct(buyer_address) AS unique_buyers
    FROM hyperliquid_trades
    WHERE timestamp >= now() - INTERVAL 24 HOUR
    GROUP BY coin
    ORDER BY volume_usd DESC
    LIMIT 10
  `);
}

/**
 * Liquidation volume by coin over the last 24h.
 *
 * The `user = liquidated_user` filter ensures each liquidation is counted
 * once (from the liquidated party's side), avoiding double-counting with
 * the counterparty fill.
 */
export async function getLiquidations() {
  return runQuery(`
    SELECT
      coin,
      countDistinct(liquidated_user) AS users_rekt,
      count() AS liq_count,
      round(sum(toFloat64(price) * toFloat64(size)), 2) AS liq_volume_usd
    FROM hyperliquid_fills
    WHERE is_liquidation = 1
      AND user = liquidated_user
      AND time >= now() - INTERVAL 24 HOUR
    GROUP BY coin
    ORDER BY liq_volume_usd DESC
    LIMIT 10
  `);
}

/**
 * Current funding rate extremes across all perpetual markets.
 *
 * The annualized rate is calculated as: funding_rate * 8760 * 100
 * (per-hour rate -> yearly percentage).
 */
export async function getFundingExtremes() {
  return runQuery(`
    SELECT
      coin,
      round(toFloat64(funding) * 8760 * 100, 2) AS annualized_rate_pct,
      round(toFloat64(open_interest) * toFloat64(mark_px), 2) AS oi_usd,
      round(toFloat64(mark_px), 4) AS mark_price
    FROM hyperliquid_perpetual_market_contexts
    WHERE polled_at = (
      SELECT max(polled_at)
      FROM hyperliquid_perpetual_market_contexts
    )
    ORDER BY abs(toFloat64(funding)) DESC
    LIMIT 10
  `);
}
