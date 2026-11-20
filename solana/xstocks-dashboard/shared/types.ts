// Types shared by the server and the browser. Type-only, no runtime code.

export type EventType =
  | "buy" | "sell" | "transfer" | "mint" | "redeem"
  | "lend_deposit" | "lend_withdraw" | "lp_add" | "lp_remove";

export interface DecodedEvent {
  id: number;
  signature: string;
  slot: number;
  /** Block time in ms. */
  t: number;
  type: EventType;
  mint: string;
  symbol: string;
  /** Share count, after the Scaled UI multiplier in effect at block time. */
  shares: number;
  /** Dollar value. From the trade's own quote leg when there is one, otherwise shares x reference price. */
  usd: number | null;
  /** Onchain price per share. Only set when the trade settled against USDC, USDT, or SOL. */
  price: number | null;
  /** Reference price at block time, when known. */
  ref: number | null;
  venue: string | null;
  /** Trader, sender, depositor, or mint recipient. */
  wallet: string;
  /** Receiver of a transfer. */
  counterparty: string | null;
}

export type WindowKey = "15m" | "1h" | "all";

export interface SnapshotParams {
  window: WindowKey;
  /** Symbols drawn on the premium chart. Empty means the top four by volume. */
  chart: string[];
  /** Symbol for the ticker page, or empty on the main page. */
  page: string;
}

export type StepState = "pending" | "active" | "done" | "error";
export interface StartupStep { key: string; label: string; state: StepState; detail: string }
export interface Gap { from: number; to: number | null; replayed: boolean }

export interface Status {
  phase: "starting" | "live" | "reconnecting";
  steps: StartupStep[];
  progress: number;
  slot: number | null;
  slotTime: number | null;
  mints: number;
  registrySource: string | null;
  startedAt: number;
  marketOpen: boolean;
  reconnect: { attempt: number; retryAt: number; reason: string } | null;
  gaps: Gap[];
  counters: { transactions: number; falsePositives: number; accountUpdates: number; events: number };
  error: string | null;
}

export interface CorporateAction {
  symbol: string;
  mint: string;
  from: number;
  to: number;
  kind: "dividend" | "split";
  /** Effective time in ms. */
  t: number;
}

export interface Marker { t: number; symbol: string; kind: "mint" | "redeem" | "corp"; usd: number | null }

/**
 * A ticker worth a look: during market hours it trades unusually far below its stock price, and
 * a $10K buy still lands below the stock price. A condition in the data, not a recommendation.
 */
export interface Opportunity {
  symbol: string;
  mint: string;
  /** When the condition started holding, in ms. */
  since: number;
  premiumPct: number;
  z: number;
  /** Cost of a $10K buy against the stock price, in percent. Always negative here. */
  cost10k: number;
  route: string;
}

export interface Slippage { usd: number; price: number; impactPct: number; route: string }

export interface SignalRow {
  symbol: string;
  onchain: number | null;
  ref: number | null;
  refAgeSec: number | null;
  stale: boolean;
  /** Market open and the reference is over 30s old, so the premium is approximate. */
  aging: boolean;
  premiumPct: number | null;
  z: number | null;
  /** Seconds of history behind the z-score and the spike ratio. */
  baselineSec: number;
  spike: number | null;
  impliedOpenPct: number | null;
  closeMedianSec: number | null;
  closeEpisodes: number;
  slippage: Slippage[] | null;
  slippageAgeSec: number | null;
}

export interface TickerDetail {
  symbol: string;
  name: string;
  mint: string;
  onchain: number | null;
  onchainT: number | null;
  ref: number | null;
  refAgeSec: number | null;
  stale: boolean;
  aging: boolean;
  premiumPct: number | null;
  volumeUsd: number;
  trades: number;
  supplyShares: number;
  supplyChangeShares: number;
  /** Net shares from decoded mint and redeem transactions, for comparison with the account stream. */
  decodedNetShares: number;
  multiplier: number;
  upcoming: CorporateAction | null;
  applied: CorporateAction[];
  /** [t, onchain, reference, premiumPct, stale] */
  series: [number, number | null, number | null, number | null, 0 | 1][];
  markers: Marker[];
  volumeBars: { t: number; usd: number }[];
  /** [t, shares] steps from mint account updates. */
  supply: [number, number][];
  largest: DecodedEvent[];
  signal: SignalRow;
}

export interface Snapshot {
  now: number;
  disclaimer: string;
  status: Status;
  window: { key: WindowKey; from: number; to: number; partial: boolean };
  options: { tickers: { symbol: string; name: string }[] };
  kpis: {
    volumeUsd: number;
    trades: number;
    traders: number;
    netMintUsd: number;
    /** Distinct xStocks traded at least once since startup. A running total, independent of the window. */
    tradedSinceStart: number;
  };
  premium: {
    /** points: [t, premiumPct, stale] */
    series: { symbol: string; points: [number, number | null, 0 | 1][] }[];
    markers: Marker[];
    sessions: [number, number][];
    refMaxAgeSec: number | null;
  };
  volumeByTicker: { symbol: string; usd: number; trades: number }[];
  /** Dollar value moved, by kind of activity. */
  flows: { dex: number; lending: number; mintRedeem: number; transfers: number; liquidity: number };
  netMint: { symbol: string; usd: number; shares: number }[];
  corporate: { upcoming: CorporateAction[]; applied: CorporateAction[] };
  opportunities: Opportunity[];
  signals: SignalRow[];
  ticker: TickerDetail | null;
}
