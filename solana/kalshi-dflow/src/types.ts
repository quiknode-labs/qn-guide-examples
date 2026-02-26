export interface MarketAccountInfo {
  yesMint: string;
  noMint: string;
  isInitialized?: boolean;
  redemptionStatus: string;
  scalarOutcomePercent: number | null;
}

export interface Market {
  ticker: string;
  title: string;
  yesSubTitle?: string;
  closeTime?: number | null;
  status?: string;
  result?: string | null;
  yesBid: string | null;
  yesAsk: string | null;
  noBid: string | null;
  noAsk: string | null;
  accounts: Record<string, MarketAccountInfo>;
}

export interface Event {
  ticker: string;
  title: string;
  subtitle: string | null;
  markets: Market[];
}

export interface EventsResponse {
  events: Event[];
  cursor: number | null;
}

export interface OrderResponse {
  outAmount: string;
  executionMode: 'sync' | 'async';
  transaction: string;
  lastValidBlockHeight: number;
  revertMint?: string;
}

export interface OrderStatusResponse {
  status: 'pending' | 'expired' | 'failed' | 'open' | 'pendingClose' | 'closed';
  outAmount: number;
  reverts?: { signature: string }[];
}
