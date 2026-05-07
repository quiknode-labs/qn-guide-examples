// ─── Config ─────────────────────────────────────────────────────────────────

export interface AppConfig {
  /** Full URL, e.g. "https://abc123.sui-mainnet.quiknode.pro" */
  endpointUrl: string;
  /** Quicknode auth token */
  endpointToken: string;
  /** Tracked addresses, lowercased */
  addresses: string[];
  /** Derived: "abc123.sui-mainnet.quiknode.pro:9000" */
  grpcHost: string;
  /** Derived: endpointUrl + "/graphql" */
  graphqlUrl: string;
}

// ─── GraphQL response shapes ─────────────────────────────────────────────────

export interface CoinBalance {
  coinType: string;
  totalBalance: string;
  /** Human-formatted, e.g. "1,234.567890000 SUI" */
  displayBalance: string;
}

export interface TransactionRecord {
  digest: string;
  timestamp: string | null;
  sender: string;
  status: 'success' | 'failure' | 'unknown';
}

// ─── gRPC proto shapes (mirror field names; keepCase: true, longs: String) ───

/** google.protobuf.Timestamp */
export interface GrpcTimestamp {
  seconds?: string;
  nanos?: number;
}

export interface GrpcBalanceChange {
  address?: string;
  coin_type?: string;
  amount?: string;
}

/** ExecutionStatus: success is bool, not a string */
export interface GrpcExecutionStatus {
  success?: boolean;
}

export interface GrpcTransactionEffects {
  status?: GrpcExecutionStatus;
}

export interface GrpcTransactionInner {
  /** The address string of the transaction sender */
  sender?: string;
}

export interface GrpcTransaction {
  digest?: string;
  transaction?: GrpcTransactionInner;
  effects?: GrpcTransactionEffects;
  balance_changes?: GrpcBalanceChange[];
  timestamp?: GrpcTimestamp;
}

export interface GrpcCheckpointSummary {
  /** google.protobuf.Timestamp */
  timestamp?: GrpcTimestamp;
}

export interface GrpcCheckpoint {
  /** uint64 as string (longs: String) */
  sequence_number?: string;
  digest?: string;
  summary?: GrpcCheckpointSummary;
  transactions?: GrpcTransaction[];
}

/** Wrapper returned by SubscribeCheckpoints stream */
export interface SubscribeCheckpointsResponse {
  /** uint64 as string — cursor position in checkpoint stream */
  cursor?: string;
  checkpoint?: GrpcCheckpoint;
}

// ─── Portfolio state ─────────────────────────────────────────────────────────

/** Per-address balance snapshot */
export interface AddressPortfolio {
  address: string;
  /** Short label, e.g. "0xac5b...c33c" */
  label: string;
  balances: CoinBalance[];
}

export interface PortfolioState {
  /** All tracked addresses (lowercased) */
  addresses: string[];
  /** Per-address balances, keyed by address */
  portfolios: Map<string, AddressPortfolio>;
  /** Merged transactions across all addresses */
  recentTransactions: TransactionRecord[];
  lastCheckpointSeq: string;
  lastCheckpointTime: Date | null;
  lastUpdated: Date | null;
  isLoading: boolean;
  streamStatus: 'connecting' | 'live' | 'reconnecting' | 'error';
  errorMessage: string | null;
}
