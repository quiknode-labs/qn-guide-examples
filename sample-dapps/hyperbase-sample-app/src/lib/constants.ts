// ── Hyperliquid Table Descriptions ──────────────────────

export const TABLE_DESCRIPTIONS: Record<string, string> = {
  hyperliquid_asset_transfers: "USDC deposits, withdrawals, and internal transfers between accounts",
  hyperliquid_blocks: "Block-level statistics — fill counts, order counts, diffs per block",
  hyperliquid_builder_labels: "Builder address labels and categories (DEX frontends, bots, etc.)",
  hyperliquid_builder_transactions: "Transactions routed through builders with fee tracking",
  hyperliquid_dex_trades: "Aggregated DEX trade view combining fills with market context",
  hyperliquid_fills: "Every individual fill event — the core trade execution table (1B+ rows)",
  hyperliquid_funding: "Funding rate payments applied to perpetual positions per interval",
  hyperliquid_ledger_updates: "Account ledger changes — margin, PnL settlements, fee charges",
  hyperliquid_order_book_diffs: "Real-time order book level changes (53B+ rows, use with care)",
  hyperliquid_orders: "Order lifecycle events — placements, cancellations, modifications (107B+ rows)",
  hyperliquid_perpetual_market_contexts: "Perpetual market snapshots — mark price, open interest, funding rate",
  hyperliquid_perpetual_markets: "Perpetual market configuration — tick size, lot size, max leverage",
  hyperliquid_perpetual_positions: "Open perpetual position snapshots by account and market",
  hyperliquid_register_referral: "Referral code registration events",
  hyperliquid_set_referrer: "Referrer assignment events — who referred whom",
  hyperliquid_spot_balances: "Spot token balance snapshots per account",
  hyperliquid_spot_markets: "Spot market pair configuration — base/quote tokens, decimals",
  hyperliquid_staking_events: "Staking and delegation events — stake, unstake, claim rewards",
  hyperliquid_summaries: "Account-level trading summaries — volume, PnL, fee totals",
  hyperliquid_system_actions: "System-level actions — liquidations, vault rebalances, auto-deleveraging",
  hyperliquid_trades: "All matched trades with price, size, side, and fee details (549M+ rows)",
  hyperliquid_transactions: "Raw transaction log — every action submitted to HyperCore (29B+ rows)",
  hyperliquid_twap_statuses: "TWAP order execution status snapshots",
  hyperliquid_validator_rewards: "Validator staking reward distributions",
};

// ── Chart Colors ─────────────────────────────────────────
// Brand primaries: #3EE148 (green), #A160F1 (purple)
// Supporting palette: distinct hues that pair well with green/purple

export const CHART_COLORS = [
  "#3EE148", // green — brand primary
  "#A160F1", // purple — brand primary
  "#F2A93B", // warm amber
  "#36B5E6", // sky blue
  "#F06292", // rose
  "#6CFF75", // bright green — brand primary
  "#FF7043", // coral
  "#26C6DA", // cyan
  "#B77EFF", // soft purple — brand primary
  "#FFCA28", // golden yellow
  "#5C6BC0", // indigo
  "#EF5350", // red
];

// ── Date Bucket Options ─────────────────────────────────

export const DATE_BUCKETS = [
  { value: "minute", label: "Minute" },
  { value: "hour", label: "Hour" },
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
] as const;

// ── Filter Operators ────────────────────────────────────

export const FILTER_OPERATORS = {
  text: [
    { value: "eq", label: "is" },
    { value: "neq", label: "is not" },
    { value: "contains", label: "contains" },
    { value: "starts_with", label: "starts with" },
    { value: "is_null", label: "is empty" },
    { value: "not_null", label: "is not empty" },
  ],
  number: [
    { value: "eq", label: "=" },
    { value: "neq", label: "!=" },
    { value: "gt", label: ">" },
    { value: "lt", label: "<" },
    { value: "gte", label: ">=" },
    { value: "lte", label: "<=" },
    { value: "between", label: "between" },
    { value: "is_null", label: "is empty" },
    { value: "not_null", label: "is not empty" },
  ],
  date: [
    { value: "eq", label: "on" },
    { value: "gt", label: "after" },
    { value: "lt", label: "before" },
    { value: "between", label: "between" },
    { value: "is_null", label: "is empty" },
    { value: "not_null", label: "is not empty" },
  ],
  boolean: [
    { value: "eq", label: "is" },
    { value: "is_null", label: "is empty" },
  ],
} as const;

// ── Aggregation Functions ───────────────────────────────

export const AGGREGATION_FNS = [
  { value: "count", label: "Count", needsColumn: false },
  { value: "sum", label: "Sum", needsColumn: true },
  { value: "avg", label: "Average", needsColumn: true },
  { value: "min", label: "Min", needsColumn: true },
  { value: "max", label: "Max", needsColumn: true },
  { value: "count_distinct", label: "Distinct count", needsColumn: true },
] as const;

// ── Default Query Limit ─────────────────────────────────

export const DEFAULT_LIMIT = 1000;
export const MAX_LIMIT = 10000;
