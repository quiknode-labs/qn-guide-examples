export const TpslDiffType = {
  ADD: 'TPSL_DIFF_TYPE_ADD',
  REMOVE: 'TPSL_DIFF_TYPE_REMOVE',
} as const;

export type RunMode = 'live' | 'demo' | 'error';

export interface Level {
  px: string;
  sz: string;
  n: number;
}

export interface BboBookUpdate {
  coin: string;
  time: string;
  block_number: string;
  bid?: Level;
  ask?: Level;
}

export interface TpslOrderDiff {
  diff_type: string;
  oid: string;
  coin: string;
  user: string;
  side: string;
  trigger_px: string;
  limit_px: string;
  sz: string;
  trigger_condition: string;
  order_type: string;
  is_position_tpsl: boolean;
  reduce_only: boolean;
  timestamp: string;
  reason?: string;
}

export interface TpslUpdatesUpdate {
  time: string;
  height: string;
  diffs: TpslOrderDiff[];
  snapshot: boolean;
}

export interface BboState {
  coin: string;
  bid: number | null;
  ask: number | null;
  bidSize: number | null;
  askSize: number | null;
  spreadBps: number | null;
  mid: number | null;
  updatedAt: number;
  blockNumber: string;
}

export interface ClusterBucket {
  coin: string;
  price: number;
  label: string;
  totalNotional: number;
  tpCount: number;
  slCount: number;
  positionSizedCount: number;
  knownOrderCount: number;
  buyCount: number;
  sellCount: number;
}

export interface RecentEvent {
  id: string;
  coin: string;
  oid: string;
  type: 'ADD' | 'TRIGGERED' | 'REMOVED';
  orderType: string;
  side: 'buy' | 'sell';
  triggerPx: number;
  notional: number | null;
  positionSized: boolean;
  reason?: string;
  timestamp: number;
}

export interface ClientState {
  kind: 'state';
  mode: RunMode;
  status: string;
  generatedAt: number;
  coins: string[];
  defaultCoin: string;
  bucketSizePct: number;
  bucketSizeByCoin: Record<string, number>;
  bbo: Record<string, BboState | undefined>;
  buckets: Record<string, ClusterBucket[] | undefined>;
  recentEvents: Record<string, RecentEvent[] | undefined>;
}
