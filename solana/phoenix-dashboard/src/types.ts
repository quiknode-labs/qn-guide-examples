export type Side = "bid" | "ask" | "buy" | "sell" | "long" | "short";

export interface MarketConfig {
  symbol: string;
  assetId: number;
  marketStatus: string;
  marketPubkey: string;
  tickSize: number;
  baseLotsDecimals: number;
  takerFee: number;
  makerFee: number;
  leverageTiers: LeverageTier[];
  riskFactors: RiskFactors;
  fundingIntervalSeconds: number;
  fundingPeriodSeconds: number;
  maxFundingRatePerIntervalPercentage: number;
  openInterestCapBaseLots: string;
  maxLiquidationSizeBaseLots: string;
  isolatedOnly: boolean;
}

export interface LeverageTier {
  maxLeverage: number;
  maxSizeBaseLots: number;
  limitOrderRiskFactor: number;
}

export interface RiskFactors {
  maintenance: number;
  backstop: number;
  highRisk: number;
  upnl: number;
  upnlForWithdrawals: number;
  cancelOrder: number;
}

export interface Candle {
  time: number; // unix ms
  open: number;
  high: number;
  low: number;
  close: number;
  markOpen?: number;
  markHigh?: number;
  markLow?: number;
  markClose?: number;
  volume: number;
  volumeQuote: number;
  tradeCount: number;
}

export interface MarketStats {
  markPx: number | null;
  oraclePx: number | null;
  midPx: number | null;
  prevDayPx: number | null;
  dayNtlVlm: number | null;
  openInterest: number | null;
  funding: number | null;
}

export interface OrderbookLevel {
  price: number;
  size: number;
}

export interface Orderbook {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  time?: number;
}

export interface TradePrint {
  id: string;
  time: number; // unix ms
  side: Side;
  price: number;
  size: number;
  notional: number;
  numFills?: number;
}

export interface FundingPoint {
  time: number;
  rate: number;
}

export interface ExchangeFlags {
  active: boolean;
  gated: boolean;
}

export type ConnectionState = "connecting" | "open" | "reconnecting" | "closed";

export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
