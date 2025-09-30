// Shared types for minimal clearinghouse dashboard

export interface ClearinghouseStateResponse {
  marginSummary: {
    accountValue: string;
    totalNtlPos: string;
    totalRawUsd: string;
    totalMarginUsed: string;
  };
  crossMarginSummary: {
    accountValue: string;
    totalNtlPos: string;
    totalRawUsd: string;
    totalMarginUsed: string;
  };
  crossMaintenanceMarginUsed: string;
  withdrawable: string;
  assetPositions: AssetPositionResponse[];
  time: number;
}

export interface AssetPositionResponse {
  type: string;
  position: {
    coin: string;
    szi: string;
    leverage: {
      type: string;
      value: number;
      rawUsd?: string;
    };
    entryPx: string;
    positionValue: string;
    unrealizedPnl: string;
    returnOnEquity: string;
    liquidationPx: string | null;
    marginUsed: string;
    maxLeverage: number;
    cumFunding: {
      allTime: string;
      sinceOpen: string;
      sinceChange: string;
    };
  };
}

export interface ClearinghouseState {
  id: string;
  wallet_address: string;
  account_value: number;
  total_margin_used: number;
  withdrawable: number;
  timestamp: number;
  created_at: string;
}

export interface AssetPosition {
  id: string;
  wallet_address: string;
  coin: string;
  size: number;
  leverage_type: string;
  leverage_value: number;
  entry_price: number;
  position_value: number;
  unrealized_pnl: number;
  liquidation_price?: number;
  margin_used: number;
  timestamp: number;
  created_at: string;
}

export interface UserRateLimitResponse {
  cumVlm: string;
  nRequestsUsed: number;
  nRequestsCap: number;
}

export interface UserRateLimit {
  user_address: string;
  cum_vlm: number;
  timestamp: number;
  created_at: string;
}

export interface UserVaultEquityResponse {
  vaultAddress: string;
  equity: string;
  lockedUntilTimestamp: number;
}

export interface UserVaultEquity {
  id: string;
  user_address: string;
  vault_address: string;
  equity: number;
  locked_until_timestamp: number;
  timestamp: number;
  created_at: string;
}

export interface SpotBalanceResponse {
  coin: string;
  token: number;
  total: string;
  hold: string;
  entryNtl: string;
}

export interface SpotClearinghouseStateResponse {
  balances: SpotBalanceResponse[];
}

export interface SpotBalance {
  id: string;
  user_address: string;
  coin: string;
  token: number;
  total: number;
  entry_ntl: number;
  timestamp: number;
  created_at: string;
}

export interface DelegationResponse {
  validator: string;
  amount: string;
  lockedUntilTimestamp: number;
}

export interface DelegationsResponse {
  delegations: DelegationResponse[];
}

export interface Delegation {
  id: string;
  user_address: string;
  validator: string;
  amount: number;
  locked_until_timestamp: number;
  timestamp: number;
  created_at: string;
}