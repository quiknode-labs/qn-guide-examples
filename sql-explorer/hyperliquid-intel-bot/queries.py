"""
SQL Explorer query definitions and REST API client.

Each function wraps a SQL query and sends it to the Quicknode SQL Explorer
REST API. The SQL is standard ClickHouse-compatible syntax.
"""

import os

import requests
from dotenv import load_dotenv

load_dotenv()

SQL_EXPLORER_URL = "https://api.quicknode.com/sql/rest/v1/query"
QUICKNODE_API_KEY = os.environ.get("QUICKNODE_API_KEY")
if not QUICKNODE_API_KEY:
    raise ValueError("Set QUICKNODE_API_KEY in your .env file before running the bot.")
CLUSTER_ID = "hyperliquid-core-mainnet"


def run_query(sql: str) -> list[dict]:
    """Send a SQL query to Quicknode SQL Explorer, return the result rows."""
    resp = requests.post(
        SQL_EXPLORER_URL,
        headers={
            "x-api-key": QUICKNODE_API_KEY,
            "Content-Type": "application/json",
        },
        json={"query": sql, "clusterId": CLUSTER_ID},
    )
    resp.raise_for_status()
    result = resp.json()
    print(f"  {result['rows']} rows in {result['statistics']['elapsed']:.2f}s")
    return result["data"]


def get_platform_overview() -> list[dict]:
    """Daily aggregate metrics for the last 7 days."""
    return run_query("""
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
    """)


def get_top_assets() -> list[dict]:
    """Top 10 assets by 24h trading volume."""
    return run_query("""
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
    """)


def get_liquidations() -> list[dict]:
    """Liquidation volume by coin over the last 24h.

    The `user = liquidated_user` filter ensures each liquidation is counted
    once (from the liquidated party's side), avoiding double-counting with
    the counterparty fill.
    """
    return run_query("""
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
    """)


def get_funding_extremes() -> list[dict]:
    """Current funding rate extremes across all perpetual markets.

    The annualized rate is calculated as: funding_rate * 8760 * 100
    (per-hour rate -> yearly percentage).
    """
    return run_query("""
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
    """)
