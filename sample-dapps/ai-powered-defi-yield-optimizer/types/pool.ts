export interface Token {
  address: string
  symbol: string
  decimals: number
}

export interface Incentives {
  total_usd: number;
  tokens: Token[];
}

export interface Fees {
  total_usd: number;
  tokens: Token[];
}

export interface Rewards {
  incentives: Incentives;
  fees: Fees;
}

export interface DetailedPool {
  address: string;
  symbol: string;
  factory: string;
  type_info: {
    type: number;
    is_stable: boolean;
    is_cl: boolean;
    label: string;
    decimals: number;
  };
  tokens: {
    token0: Token;
    token1: Token;
  };
  liquidity: {
    tvl: number;
    total_supply: string;
    reserves: {
      token0_amount: number;
      token1_amount: number;
    };
  };
  trading: {
    volume_24h: number;
    fees_24h: number;
    apr: number;
    pool_fee_bps: number;
    pool_fee_percentage: number;
  };
  gauge?: {
    total_supply: string;
    emissions_per_second: number;
    weekly_emissions: number;
  };
  voting?: {
    votes: string;
    emissions: number;
    rewards: Rewards;
  } | null;
}
