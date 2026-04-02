import type { PrebuiltQuery } from "@/types";

export const QUERIES: PrebuiltQuery[] = [
  // ============================================
  // TRADING (4 queries)
  // ============================================
  {
    id: "recent-trades",
    title: "Recent trades",
    description: "Latest trades with buyer/seller details and fees",
    category: "Trading",
    sql: `SELECT
  timestamp,
  coin,
  side,
  price,
  size,
  toFloat64(price) * toFloat64(size) AS notional_usd,
  buyer_address,
  seller_address,
  buyer_fee,
  seller_fee,
  fee_token
FROM hyperliquid_trades
WHERE block_time > now() - INTERVAL 1 HOUR
ORDER BY block_number DESC, trade_id DESC
LIMIT 100`,
    chartConfig: {
      type: "bar",
      xKey: "coin",
      yKeys: ["notional_usd"],
      xLabel: "Coin",
      yLabel: "Notional (USD)",
    },
  },
  {
    id: "volume-by-coin-24h",
    title: "Volume by coin (24h)",
    description: "Top coins by trading volume, trade count, and price range",
    category: "Trading",
    sql: `SELECT
  coin,
  count() AS trade_count,
  sum(toFloat64(price) * toFloat64(size)) AS volume_usd,
  min(toFloat64(price)) AS low,
  max(toFloat64(price)) AS high,
  avg(toFloat64(price)) AS avg_price
FROM hyperliquid_trades
WHERE timestamp > now() - INTERVAL 24 HOUR
GROUP BY coin
ORDER BY volume_usd DESC
LIMIT 50`,
    chartConfig: {
      type: "bar",
      xKey: "coin",
      yKeys: ["volume_usd"],
      xLabel: "Coin",
      yLabel: "Volume (USD)",
    },
  },
  {
    id: "whale-trades-24h",
    title: "Whale trades (24h)",
    description: "Trades over $100K in the last 24 hours sorted by size",
    category: "Trading",
    sql: `SELECT
  timestamp,
  coin,
  side,
  price,
  size,
  toFloat64(price) * toFloat64(size) AS notional_usd,
  buyer_address,
  seller_address
FROM hyperliquid_trades
WHERE block_time > now() - INTERVAL 24 HOUR
  AND toFloat64(price) * toFloat64(size) > 100000
ORDER BY notional_usd DESC
LIMIT 100`,
    chartConfig: {
      type: "bar",
      xKey: "coin",
      yKeys: ["notional_usd"],
      xLabel: "Coin",
      yLabel: "Notional (USD)",
    },
  },
  {
    id: "dex-trades-enriched",
    title: "DEX trades (enriched view)",
    description: "Trades with market type (perpetual vs spot) details",
    category: "Trading",
    sql: `SELECT
  timestamp,
  coin,
  market_type,
  side,
  price,
  size,
  usd_amount,
  buyer_address,
  seller_address
FROM hyperliquid_dex_trades
WHERE block_time > now() - INTERVAL 1 HOUR
ORDER BY block_number DESC, trade_id DESC
LIMIT 100`,
    chartConfig: {
      type: "bar",
      xKey: "coin",
      yKeys: ["usd_amount"],
      xLabel: "Coin",
      yLabel: "USD Amount",
    },
  },

  // ============================================
  // ACTIVITY (3 queries)
  // ============================================
  {
    id: "hourly-volume",
    title: "Hourly volume",
    description: "Trading volume and trade count aggregated by hour over 7 days",
    category: "Activity",
    sql: `SELECT
  toStartOfHour(timestamp) AS hour,
  count() AS trades,
  sum(toFloat64(price) * toFloat64(size)) AS volume_usd
FROM hyperliquid_trades
WHERE timestamp > now() - INTERVAL 7 DAY
GROUP BY hour
ORDER BY hour DESC`,
    chartConfig: {
      type: "area",
      xKey: "hour",
      yKeys: ["volume_usd"],
      xLabel: "Hour",
      yLabel: "Volume (USD)",
    },
  },
  {
    id: "daily-volume",
    title: "Daily volume",
    description: "Daily trading volume, trade count, and unique traders over 30 days",
    category: "Activity",
    sql: `SELECT
  toStartOfDay(timestamp) AS day,
  count() AS trades,
  sum(toFloat64(price) * toFloat64(size)) AS volume_usd,
  uniqExact(arrayJoin([buyer_address, seller_address])) AS unique_traders
FROM hyperliquid_trades
WHERE timestamp > now() - INTERVAL 30 DAY
GROUP BY day
ORDER BY day DESC`,
    chartConfig: {
      type: "area",
      xKey: "day",
      yKeys: ["volume_usd", "unique_traders"],
      xLabel: "Date",
      yLabel: "Volume (USD)",
    },
  },
  {
    id: "top-traders-7d",
    title: "Top traders by volume",
    description: "Most active traders by volume over the last 7 days",
    category: "Activity",
    sql: `SELECT
  trader,
  count() AS trade_count,
  sum(volume) AS total_volume,
  uniqExact(coin) AS coins_traded
FROM (
  SELECT buyer_address AS trader, toFloat64(price) * toFloat64(size) AS volume, coin
  FROM hyperliquid_trades WHERE timestamp > now() - INTERVAL 7 DAY
  UNION ALL
  SELECT seller_address AS trader, toFloat64(price) * toFloat64(size) AS volume, coin
  FROM hyperliquid_trades WHERE timestamp > now() - INTERVAL 7 DAY
)
GROUP BY trader
ORDER BY total_volume DESC
LIMIT 50`,
    chartConfig: {
      type: "bar",
      xKey: "trader",
      yKeys: ["total_volume"],
      xLabel: "Trader",
      yLabel: "Volume (USD)",
    },
  },

  // ============================================
  // FILLS (3 queries)
  // ============================================
  {
    id: "recent-fills",
    title: "Recent fills",
    description: "Latest individual fill events with PnL and fee details",
    category: "Fills",
    sql: `SELECT
  time,
  coin,
  side,
  price,
  size,
  fee,
  fee_token,
  closed_pnl,
  dir,
  user,
  hash
FROM hyperliquid_fills
WHERE block_time > now() - INTERVAL 1 HOUR
ORDER BY block_number DESC, tid DESC
LIMIT 100`,
    chartConfig: {
      type: "bar",
      xKey: "coin",
      yKeys: ["closed_pnl"],
      xLabel: "Coin",
      yLabel: "Closed PnL",
    },
  },
  {
    id: "wallet-fill-activity",
    title: "Trading activity for specific wallets",
    description: "Query fill history, volume, and execution patterns for any wallet address",
    category: "Fills",
    featured: true,
    useCaseSlug: "wallet-activity",
    parameterizable: true,
    parameters: [
      {
        name: "address",
        label: "Wallet Address",
        type: "string",
        default: "",
        placeholder: "Enter a wallet address or click 'Try sample'",
        sampleQuery: "SELECT DISTINCT user FROM hyperliquid_fills WHERE block_time > now() - INTERVAL 1 HOUR LIMIT 1",
      },
    ],
    sql: `SELECT
  time,
  coin,
  side,
  price,
  size,
  toFloat64(price) * toFloat64(size) AS notional,
  fee,
  fee_token,
  closed_pnl,
  dir
FROM hyperliquid_fills
WHERE user = lower('{{address}}')
  AND block_time > now() - INTERVAL 7 DAY
ORDER BY block_number DESC, tid DESC
LIMIT 100`,
    chartConfig: {
      type: "bar",
      xKey: "time",
      yKeys: ["notional"],
      xLabel: "Time",
      yLabel: "Notional (USD)",
    },
  },
  {
    id: "recent-liquidations",
    title: "Liquidations over the last 24 hours",
    description: "Monitor liquidation notional by asset across any time range",
    category: "Fills",
    featured: true,
    useCaseSlug: "liquidations",
    sql: `SELECT
  time,
  coin,
  side,
  price,
  size,
  toFloat64(price) * toFloat64(size) AS notional,
  liquidated_user,
  liquidation_mark_price,
  liquidation_method,
  user
FROM hyperliquid_fills
WHERE block_time > now() - INTERVAL 24 HOUR
  AND is_liquidation = 1
ORDER BY block_number DESC, tid DESC
LIMIT 100`,
    chartConfig: {
      type: "bar",
      xKey: "time",
      yKeys: ["notional"],
      xLabel: "Time",
      yLabel: "Notional (USD)",
    },
  },

  // ============================================
  // ORDERS (2 queries)
  // ============================================
  {
    id: "recent-orders",
    title: "Recent orders",
    description: "Latest 100 order events with status and type details",
    category: "Orders",
    sql: `SELECT
  status_time,
  coin,
  side,
  order_type,
  limit_price,
  size,
  orig_size,
  status,
  tif,
  user
FROM hyperliquid_orders
WHERE block_time > now() - INTERVAL 1 HOUR
ORDER BY block_number DESC, oid DESC
LIMIT 100`,
    chartConfig: {
      type: "bar",
      xKey: "coin",
      yKeys: ["limit_price"],
      xLabel: "Coin",
      yLabel: "Limit Price",
    },
  },
  {
    id: "order-type-distribution-1h",
    title: "Order type distribution (1h)",
    description: "Breakdown of order types in the last hour",
    category: "Orders",
    sql: `SELECT
  order_type,
  side,
  status,
  count() AS order_count,
  uniqExact(user) AS unique_users
FROM hyperliquid_orders
WHERE block_time > now() - INTERVAL 1 HOUR
GROUP BY order_type, side, status
ORDER BY order_count DESC`,
    chartConfig: {
      type: "bar",
      xKey: "order_type",
      yKeys: ["order_count"],
      xLabel: "Order Type",
      yLabel: "Count",
    },
  },

  // ============================================
  // FUNDING (2 queries)
  // ============================================
  {
    id: "latest-funding-payments",
    title: "Latest funding payments",
    description: "Most recent funding payments by coin with position sizes",
    category: "Funding",
    sql: `SELECT
  coin,
  funding_rate,
  count() AS payments,
  sum(toFloat64(funding_amount)) AS total_funding,
  avg(toFloat64(szi)) AS avg_position_size
FROM hyperliquid_funding
WHERE time > now() - INTERVAL 8 HOUR
GROUP BY coin, funding_rate
ORDER BY abs(total_funding) DESC
LIMIT 50`,
    chartConfig: {
      type: "bar",
      xKey: "coin",
      yKeys: ["total_funding", "funding_rate"],
      xLabel: "Coin",
      yLabel: "Total Funding",
    },
  },
  {
    id: "funding-rate-history",
    title: "Funding rate history by coin",
    description: "Hourly funding rates for top coins over 7 days",
    category: "Funding",
    sql: `SELECT
  toStartOfHour(time) AS hour,
  coin,
  avg(toFloat64(funding_rate)) AS avg_funding_rate,
  count() AS payment_count,
  sum(toFloat64(funding_amount)) AS total_funding
FROM hyperliquid_funding
WHERE time > now() - INTERVAL 7 DAY
  AND coin IN ('BTC', 'ETH', 'SOL')
GROUP BY hour, coin
ORDER BY hour DESC, coin
LIMIT 500`,
    chartConfig: {
      type: "line",
      xKey: "hour",
      yKeys: ["avg_funding_rate"],
      xLabel: "Time",
      yLabel: "Avg Funding Rate",
    },
  },

  // ============================================
  // INFRASTRUCTURE (3 queries)
  // ============================================
  {
    id: "block-activity",
    title: "Block activity",
    description: "Event counts per block for recent blocks",
    category: "Infrastructure",
    sql: `SELECT
  block_number,
  block_time,
  fills_count,
  orders_count,
  misc_events_count,
  book_diffs_count,
  twap_statuses_count,
  writer_actions_count
FROM hyperliquid_blocks
ORDER BY block_number DESC
LIMIT 100`,
    chartConfig: {
      type: "line",
      xKey: "block_number",
      yKeys: ["fills_count", "orders_count"],
      xLabel: "Block",
      yLabel: "Events",
    },
  },
  {
    id: "recent-transactions",
    title: "Recent transactions",
    description: "Latest L1 transactions with action types",
    category: "Infrastructure",
    sql: `SELECT
  block_time,
  round,
  tx_hash,
  user,
  action_type,
  is_success,
  error
FROM hyperliquid_transactions
ORDER BY round DESC
LIMIT 100`,
    chartConfig: {
      type: "bar",
      xKey: "action_type",
      yKeys: ["round"],
      xLabel: "Action Type",
      yLabel: "Count",
    },
  },
  {
    id: "action-type-breakdown-24h",
    title: "Action type breakdown (24h)",
    description: "Distribution of transaction types with success rates",
    category: "Infrastructure",
    sql: `SELECT
  action_type,
  count() AS tx_count,
  countIf(is_success = 1) AS success_count,
  countIf(is_success = 0) AS failed_count,
  round(countIf(is_success = 1) / count() * 100, 2) AS success_rate
FROM hyperliquid_transactions
WHERE block_time > now() - INTERVAL 24 HOUR
GROUP BY action_type
ORDER BY tx_count DESC`,
    chartConfig: {
      type: "bar",
      xKey: "action_type",
      yKeys: ["success_count", "failed_count"],
      xLabel: "Action Type",
      yLabel: "Transaction Count",
    },
  },

  // ============================================
  // LEDGER (4 queries)
  // ============================================
  {
    id: "recent-asset-transfers",
    title: "Recent asset transfers",
    description: "Latest deposits, withdrawals, and internal transfers",
    category: "Ledger",
    sql: `SELECT
  time,
  transfer_type,
  user,
  destination,
  token,
  amount,
  usdc_amount,
  fee,
  tx_hash
FROM hyperliquid_asset_transfers
ORDER BY block_number DESC
LIMIT 100`,
    chartConfig: {
      type: "bar",
      xKey: "transfer_type",
      yKeys: ["usdc_amount"],
      xLabel: "Type",
      yLabel: "USDC Amount",
    },
  },
  {
    id: "transfer-volume-by-type-7d",
    title: "Transfer volume by type (7d)",
    description: "Aggregate transfer volumes grouped by type",
    category: "Ledger",
    sql: `SELECT
  transfer_type,
  count() AS transfer_count,
  sum(toFloat64(usdc_amount)) AS total_usdc,
  uniqExact(user) AS unique_users
FROM hyperliquid_asset_transfers
WHERE time > now() - INTERVAL 7 DAY
GROUP BY transfer_type
ORDER BY total_usdc DESC`,
    chartConfig: {
      type: "bar",
      xKey: "transfer_type",
      yKeys: ["total_usdc", "transfer_count"],
      xLabel: "Transfer Type",
      yLabel: "Total USDC",
    },
  },
  {
    id: "recent-ledger-updates",
    title: "Recent ledger updates",
    description: "Raw ledger deltas (deposits, withdrawals, liquidations, etc.)",
    category: "Ledger",
    sql: `SELECT
  time,
  delta_type,
  user,
  usdc_amount,
  token,
  amount,
  destination,
  fee,
  hash
FROM hyperliquid_ledger_updates
ORDER BY block_number DESC
LIMIT 100`,
    chartConfig: {
      type: "bar",
      xKey: "delta_type",
      yKeys: ["usdc_amount"],
      xLabel: "Delta Type",
      yLabel: "USDC Amount",
    },
  },
  {
    id: "bridge-deposits-withdrawals",
    title: "Bridge deposits & withdrawals",
    description: "L1 bridge activity from the latest ABCI snapshot",
    category: "Ledger",
    sql: `SELECT
  bridge_type,
  user,
  amount_wei,
  tx_hash,
  eth_block_number,
  event_time,
  snapshot_time
FROM hyperliquid_bridge
WHERE block_number = (SELECT max(block_number) FROM hyperliquid_bridge)
ORDER BY toFloat64(amount_wei) DESC
LIMIT 100`,
    chartConfig: {
      type: "bar",
      xKey: "bridge_type",
      yKeys: ["amount_wei"],
      xLabel: "Bridge Type",
      yLabel: "Amount (Wei)",
    },
  },

  // ============================================
  // MARKETS (4 queries)
  // ============================================
  {
    id: "perpetual-markets",
    title: "Perpetual markets",
    description: "All perpetual markets with leverage and decimals",
    category: "Markets",
    sql: `SELECT
  coin,
  market_index,
  sz_decimals,
  max_leverage,
  only_isolated
FROM hyperliquid_perpetual_markets
ORDER BY coin
LIMIT 500`,
    chartConfig: {
      type: "bar",
      xKey: "coin",
      yKeys: ["max_leverage"],
      xLabel: "Coin",
      yLabel: "Max Leverage",
    },
  },
  {
    id: "spot-markets",
    title: "Spot markets",
    description: "All spot tokens with metadata",
    category: "Markets",
    sql: `SELECT
  token_index,
  token,
  token_id,
  full_name,
  sz_decimals,
  wei_decimals,
  is_canonical,
  evm_contract
FROM hyperliquid_spot_markets
ORDER BY token_index
LIMIT 500`,
    chartConfig: {
      type: "bar",
      xKey: "token",
      yKeys: ["sz_decimals"],
      xLabel: "Token",
      yLabel: "Size Decimals",
    },
  },
  {
    id: "market-context-latest",
    title: "Market context (latest)",
    description: "Current funding rates, open interest, and prices",
    category: "Markets",
    sql: `SELECT
  coin,
  funding,
  open_interest,
  mark_px,
  oracle_px,
  mid_px,
  premium,
  day_ntl_vlm,
  prev_day_px
FROM hyperliquid_perpetual_market_contexts
WHERE polled_at > now() - INTERVAL 5 MINUTE
ORDER BY toFloat64(day_ntl_vlm) DESC
LIMIT 100`,
    chartConfig: {
      type: "bar",
      xKey: "coin",
      yKeys: ["day_ntl_vlm", "open_interest"],
      xLabel: "Coin",
      yLabel: "Daily Notional Volume",
    },
  },
  {
    id: "oracle-prices-all-dexes",
    title: "Oracle prices (all DEXes)",
    description: "Mark and daily prices for all assets at the latest snapshot",
    category: "Markets",
    sql: `SELECT
  clearinghouse,
  coin,
  mark_px,
  daily_px,
  snapshot_time
FROM hyperliquid_oracle_prices
WHERE block_number = (SELECT max(block_number) FROM hyperliquid_oracle_prices)
ORDER BY clearinghouse, asset_idx`,
    chartConfig: {
      type: "bar",
      xKey: "coin",
      yKeys: ["mark_px", "daily_px"],
      xLabel: "Coin",
      yLabel: "Price",
    },
  },

  // ============================================
  // PORTFOLIO & POSITIONS (7 queries)
  // ============================================
  {
    id: "largest-open-positions",
    title: "Largest open positions (all DEXes)",
    description: "Top perp positions by entry notional across all 8 clearinghouses",
    category: "Portfolio & Positions",
    sql: `SELECT
  user,
  clearinghouse,
  coin,
  size,
  entry_notional,
  margin,
  funding_alltime,
  snapshot_time
FROM hyperliquid_clearinghouse_states
WHERE block_number = (SELECT max(block_number) FROM hyperliquid_clearinghouse_states)
  AND toFloat64(size) != 0
ORDER BY abs(toFloat64(entry_notional)) DESC
LIMIT 100`,
    chartConfig: {
      type: "bar",
      xKey: "coin",
      yKeys: ["entry_notional"],
      xLabel: "Coin",
      yLabel: "Entry Notional",
    },
  },
  {
    id: "spot-balances-for-address",
    title: "Spot balances for address",
    description: "Token balances from the latest ABCI snapshot (replace address)",
    category: "Portfolio & Positions",
    parameterizable: true,
    parameters: [
      {
        name: "address",
        label: "Wallet Address",
        type: "string",
        default: "",
        placeholder: "Enter a wallet address or click Try sample",
        sampleQuery: "SELECT DISTINCT user FROM hyperliquid_spot_clearinghouse_states WHERE block_number = (SELECT max(block_number) FROM hyperliquid_spot_clearinghouse_states) AND toFloat64(total) != 0 LIMIT 1",
      },
    ],
    sql: `-- Replace address below
SELECT
  token,
  token_idx,
  total,
  escrowed,
  snapshot_time
FROM hyperliquid_spot_clearinghouse_states
WHERE user = lower('{{address}}')
  AND block_number = (SELECT max(block_number) FROM hyperliquid_spot_clearinghouse_states)
  AND toFloat64(total) != 0
ORDER BY abs(toFloat64(total)) DESC`,
    chartConfig: {
      type: "bar",
      xKey: "token",
      yKeys: ["total", "escrowed"],
      xLabel: "Token",
      yLabel: "Balance",
    },
  },
  {
    id: "vault-depositor-equity",
    title: "Vault depositor equity",
    description: "Top vault depositors by ownership fraction",
    category: "Portfolio & Positions",
    sql: `SELECT
  vault_name,
  depositor,
  ownership_fraction,
  net_deposits,
  leader,
  leader_commission,
  snapshot_time
FROM hyperliquid_vault_equities
WHERE block_number = (SELECT max(block_number) FROM hyperliquid_vault_equities)
ORDER BY toFloat64(ownership_fraction) DESC
LIMIT 100`,
    chartConfig: {
      type: "bar",
      xKey: "vault_name",
      yKeys: ["ownership_fraction"],
      xLabel: "Vault",
      yLabel: "Ownership %",
    },
  },
  {
    id: "sub-account-mappings",
    title: "Sub-account mappings",
    description: "Sub-account to master-account relationships",
    category: "Portfolio & Positions",
    parameterizable: true,
    parameters: [
      {
        name: "address",
        label: "Master Account Address",
        type: "string",
        default: "",
        placeholder: "Enter an address or click 'Try sample'",
        sampleQuery: "SELECT DISTINCT master_account FROM hyperliquid_sub_accounts WHERE block_number = (SELECT max(block_number) FROM hyperliquid_sub_accounts) LIMIT 1",
      },
    ],
    sql: `-- Replace address to find sub-accounts for a specific master
SELECT
  sub_account,
  master_account,
  name,
  snapshot_time
FROM hyperliquid_sub_accounts
WHERE master_account = lower('{{address}}')
  AND block_number = (SELECT max(block_number) FROM hyperliquid_sub_accounts)
ORDER BY name`,
    chartConfig: {
      type: "bar",
      xKey: "name",
      yKeys: [],
      xLabel: "Sub-account",
      yLabel: "Count",
    },
  },
  {
    id: "bot-agent-lookups",
    title: "Bot/agent lookups",
    description: "Find which bot or app submitted trades for a user",
    category: "Portfolio & Positions",
    parameterizable: true,
    parameters: [
      {
        name: "address",
        label: "User Address",
        type: "string",
        default: "",
        placeholder: "Enter an address or click 'Try sample'",
        sampleQuery: "SELECT DISTINCT user FROM hyperliquid_agents WHERE block_number = (SELECT max(block_number) FROM hyperliquid_agents) LIMIT 1",
      },
    ],
    sql: `-- Replace address to find agents for a specific user
SELECT
  agent,
  user,
  name,
  valid_until,
  snapshot_time
FROM hyperliquid_agents
WHERE user = lower('{{address}}')
  AND block_number = (SELECT max(block_number) FROM hyperliquid_agents)
ORDER BY name`,
  },
  {
    id: "display-name-lookups",
    title: "Display name lookups",
    description: "Resolve addresses to human-readable display names",
    category: "Portfolio & Positions",
    sql: `SELECT
  user,
  display_name,
  snapshot_time
FROM hyperliquid_display_names
WHERE block_number = (SELECT max(block_number) FROM hyperliquid_display_names)
ORDER BY display_name
LIMIT 100`,
  },
  {
    id: "full-portfolio-view",
    title: "Full portfolio view",
    description: "Unified portfolio across perps, spot, vaults, and staking (replace address)",
    category: "Portfolio & Positions",
    parameterizable: true,
    parameters: [
      {
        name: "address",
        label: "Wallet Address",
        type: "string",
        default: "",
        placeholder: "Enter a wallet address or click Try sample",
        sampleQuery: "SELECT DISTINCT user FROM hyperliquid_clearinghouse_states WHERE block_number = (SELECT max(block_number) FROM hyperliquid_clearinghouse_states) AND toFloat64(size) != 0 LIMIT 1",
      },
    ],
    sql: `-- Replace address below for full portfolio snapshot
SELECT 'perps' AS type, coin AS asset, toFloat64(size) AS amount, toFloat64(entry_notional) AS extra
FROM hyperliquid_clearinghouse_states
WHERE user = lower('{{address}}')
  AND block_number = (SELECT max(block_number) FROM hyperliquid_clearinghouse_states)
  AND toFloat64(size) != 0
UNION ALL
SELECT 'spot', token, toFloat64(total), toFloat64(escrowed)
FROM hyperliquid_spot_clearinghouse_states
WHERE user = lower('{{address}}')
  AND block_number = (SELECT max(block_number) FROM hyperliquid_spot_clearinghouse_states)
  AND toFloat64(total) != 0
UNION ALL
SELECT 'vault', vault_name, toFloat64(ownership_fraction) * 1000000, toFloat64(net_deposits)
FROM hyperliquid_vault_equities
WHERE depositor = lower('{{address}}')
  AND block_number = (SELECT max(block_number) FROM hyperliquid_vault_equities)
UNION ALL
SELECT 'delegation', validator, toFloat64(reward), toFloat64(commission_bps)
FROM hyperliquid_delegator_rewards
WHERE delegator = lower('{{address}}')
  AND block_number = (SELECT max(block_number) FROM hyperliquid_delegator_rewards)`,
    chartConfig: {
      type: "bar",
      xKey: "type",
      yKeys: ["amount"],
      xLabel: "Type",
      yLabel: "Amount",
    },
  },

  // ============================================
  // STAKING & REWARDS (2 queries)
  // ============================================
  {
    id: "delegator-rewards",
    title: "Validator rewards by address",
    description: "Track reward distribution across validators over any time window",
    category: "Staking & Rewards",
    featured: true,
    useCaseSlug: "validator-rewards",
    parameterizable: true,
    parameters: [
      {
        name: "address",
        label: "Delegator Address",
        type: "string",
        default: "",
        placeholder: "Enter an address or click 'Try sample'",
        sampleQuery: "SELECT DISTINCT delegator FROM hyperliquid_delegator_rewards WHERE block_number = (SELECT max(block_number) FROM hyperliquid_delegator_rewards) LIMIT 1",
      },
    ],
    sql: `-- Replace address below
SELECT
  delegator,
  validator,
  reward,
  commission_bps,
  snapshot_time,
  block_number
FROM hyperliquid_delegator_rewards
WHERE delegator = lower('{{address}}')
  AND block_number = (SELECT max(block_number) FROM hyperliquid_delegator_rewards)
ORDER BY toFloat64(reward) DESC`,
    chartConfig: {
      type: "bar",
      xKey: "validator",
      yKeys: ["reward"],
      xLabel: "Validator",
      yLabel: "Reward",
    },
  },
  {
    id: "validator-commission-history",
    title: "Validator commission history",
    description: "Track commission rates over time for a validator",
    category: "Staking & Rewards",
    parameterizable: true,
    parameters: [
      {
        name: "validator",
        label: "Validator Address",
        type: "string",
        default: "",
        placeholder: "Enter an address or click 'Try sample'",
        sampleQuery: "SELECT DISTINCT validator FROM hyperliquid_delegator_rewards WHERE block_number = (SELECT max(block_number) FROM hyperliquid_delegator_rewards) LIMIT 1",
      },
    ],
    sql: `SELECT
  block_number,
  snapshot_time,
  commission_bps,
  count() AS delegator_count,
  sum(reward) AS total_pending_rewards
FROM hyperliquid_delegator_rewards
WHERE validator = lower('{{validator}}')
GROUP BY block_number, snapshot_time, commission_bps
ORDER BY block_number DESC
LIMIT 50`,
    chartConfig: {
      type: "line",
      xKey: "snapshot_time",
      yKeys: ["commission_bps", "total_pending_rewards"],
      xLabel: "Time",
      yLabel: "Commission (bps)",
    },
  },

  // ============================================
  // BUILDERS (2 queries)
  // ============================================
  {
    id: "builder-activity-24h",
    title: "Builder activity (24h)",
    description: "Builder (frontend) transaction volume and fees",
    category: "Builders",
    sql: `SELECT
  b.builder,
  l.builder_name,
  count() AS tx_count,
  sum(toFloat64(b.builder_fee)) AS total_fees,
  uniqExact(b.user) AS unique_users
FROM hyperliquid_builder_transactions b
LEFT JOIN hyperliquid_builder_labels l ON b.builder = l.builder_address
WHERE b.block_time > now() - INTERVAL 24 HOUR
GROUP BY b.builder, l.builder_name
ORDER BY total_fees DESC
LIMIT 50`,
    chartConfig: {
      type: "bar",
      xKey: "builder_name",
      yKeys: ["total_fees", "unique_users"],
      xLabel: "Builder",
      yLabel: "Total Fees",
    },
  },
  {
    id: "builder-fill-volume-24h",
    title: "Builder fill volume (24h)",
    description: "Trading volume routed through builder apps (Phantom, Based, etc.)",
    category: "Builders",
    sql: `SELECT
  builder_address,
  count() AS fills,
  sum(toFloat64(price) * toFloat64(size)) AS volume_usd,
  sum(toFloat64(builder_fee)) AS total_builder_fees,
  uniqExact(user) AS unique_users
FROM hyperliquid_builder_fills
WHERE block_time > now() - INTERVAL 24 HOUR
GROUP BY builder_address
ORDER BY volume_usd DESC
LIMIT 50`,
    chartConfig: {
      type: "bar",
      xKey: "builder_address",
      yKeys: ["volume_usd", "total_builder_fees"],
      xLabel: "Builder",
      yLabel: "Volume (USD)",
    },
  },

  // ============================================
  // ANALYTICS (5 queries)
  // ============================================
  {
    id: "funding-rate-summary-hourly",
    title: "Funding rate summary (hourly)",
    description: "Pre-aggregated hourly funding rates by coin",
    category: "Analytics",
    sql: `SELECT
  coin,
  hour,
  avg_funding_rate,
  total_funding,
  unique_users
FROM hyperliquid_funding_summary_hourly
WHERE hour > now() - INTERVAL 24 HOUR
ORDER BY hour DESC, abs(toFloat64(avg_funding_rate)) DESC
LIMIT 100`,
    chartConfig: {
      type: "line",
      xKey: "hour",
      yKeys: ["avg_funding_rate"],
      xLabel: "Hour",
      yLabel: "Avg Funding Rate",
    },
  },
  {
    id: "hourly-liquidation-stats",
    title: "Hourly liquidation stats",
    description: "Pre-aggregated hourly liquidation counts and volume by coin",
    category: "Analytics",
    sql: `SELECT
  hour,
  coin,
  liquidation_count,
  liquidated_volume,
  unique_liquidated_users
FROM hyperliquid_liquidations_hourly
ORDER BY hour DESC, toFloat64(liquidated_volume) DESC
LIMIT 100`,
    chartConfig: {
      type: "bar",
      xKey: "hour",
      yKeys: ["liquidated_volume", "liquidation_count"],
      xLabel: "Hour",
      yLabel: "Liquidated Volume",
    },
  },
  {
    id: "hourly-ohlcv",
    title: "Hourly OHLCV",
    description: "Pre-aggregated hourly candlestick data per coin",
    category: "Analytics",
    parameterizable: true,
    parameters: [
      {
        name: "coin",
        label: "Coin",
        type: "string",
        default: "BTC",
        placeholder: "e.g. BTC, ETH, SOL",
      },
    ],
    sql: `SELECT
  coin,
  hour,
  volume,
  trade_count,
  high,
  low,
  open,
  close
FROM hyperliquid_market_volume_hourly
WHERE hour > now() - INTERVAL 24 HOUR
  AND coin = '{{coin}}'
ORDER BY hour DESC`,
    chartConfig: {
      type: "line",
      xKey: "hour",
      yKeys: ["high", "low", "close"],
      xLabel: "Hour",
      yLabel: "Price",
    },
  },
  {
    id: "daily-per-coin-metrics",
    title: "Daily per-coin metrics",
    description: "Volume, fills, traders, fees, and liquidations per coin per day",
    category: "Analytics",
    sql: `SELECT
  day,
  coin,
  volume_usd,
  fill_count,
  unique_traders,
  fees,
  liquidations,
  high_price,
  low_price
FROM hyperliquid_metrics_dex_overview
ORDER BY day DESC, volume_usd DESC
LIMIT 100`,
    chartConfig: {
      type: "bar",
      xKey: "coin",
      yKeys: ["volume_usd", "fees"],
      xLabel: "Coin",
      yLabel: "Volume (USD)",
    },
  },
  {
    id: "platform-daily-overview",
    title: "Platform daily overview",
    description: "Platform-wide daily volume, fills, traders, and fees",
    category: "Analytics",
    sql: `SELECT
  day,
  total_volume_usd,
  total_fills,
  active_traders,
  total_fees,
  liquidation_count,
  liquidation_volume_usd,
  coins_traded,
  total_builder_fees,
  builder_fill_count
FROM hyperliquid_metrics_overview
ORDER BY day DESC
LIMIT 30`,
    chartConfig: {
      type: "area",
      xKey: "day",
      yKeys: ["total_volume_usd"],
      xLabel: "Date",
      yLabel: "Volume (USD)",
    },
  },
];
