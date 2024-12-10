export interface Asset {
  address: string;
  name: string;
  symbol: string;
  price: number;
  amount: number;
}

export interface LiquidationEvent {
  id: number;
  liquidator_address: string;
  liquidated_wallet: string;
  collateral_asset: Asset;
  debt_asset: Asset;
  transaction_hash: string;
  block_number: number;
  block_hash: string;
  receive_a_token: boolean;
  timestamp: string;
}

export interface LiquidationFilters {
  dateRange?: [Date, Date];
  assets?: string[];
  addresses?: string[];
}

export interface DashboardMetrics {
  // Time-based metrics
  liquidationsOverTime: Array<{
    date: string;
    count: number;
    totalvalueusd: number;
    totalProfitUSD: number;
  }>;

  // Volume metrics
  total24h: {
    count: number;
    valueUSD: number;
    profitUSD: number;
  };
  total7d: {
    count: number;
    valueUSD: number;
    profitUSD: number;
  };
  total30d: {
    count: number;
    valueUSD: number;
    profitUSD: number;
  };
  total365d: {
    count: number;
    valueUSD: number;
    profitUSD: number; 
  };

  // Asset metrics
  topCollateralAssets: Array<{
    symbol: string;
    count: number;
    totalvalueusd: number;
    totalProfitUSD: number; 
    percentageOfTotal: number;
  }>;
  topDebtAssets: Array<{
    symbol: string;
    count: number;
    totalvalueusd: number;
    totalProfitUSD: number; 
    percentageOfTotal: number;
  }>;

  // Participant metrics
  topLiquidators: Array<{
    address: string;
    count: number;
    totalvalueusd: number;
    avgliquidationusd: number;
    totalProfitUSD: number; 
    avgProfitUSD: number; 
  }>;
  topLiquidatedUsers: Array<{
    address: string;
    count: number;
    totalvalueusd: number;
    avgliquidationusd: number;
    totallossusd: number;
    avglossusd: number;
  }>;

  // Risk metrics
  largestLiquidations: Array<{
    txhash: string;
    timestamp: Date;
    valueusd: number;
    profitusd: number; 
    collateralasset: string;
    debtasset: string;
    liquidator: string; 
    liquidateduser: string; 
  }>;

  // New section for PNL-focused metrics
  mostProfitableLiquidations: Array<{
    txhash: string;
    timestamp: Date;
    valueusd: number;
    profitusd: number;
    collateralasset: string;
    debtasset: string;
    liquidator: string;
    liquidatedUser: string;
  }>;
}

export interface DbLiquidation {
  id: number;
  liquidator_address: string;
  liquidated_wallet: string;
  collateral_asset: string;
  collateral_asset_name: string;
  collateral_asset_symbol: string;
  collateral_asset_price: number;
  collateral_seized_amount: number;
  debt_asset: string;
  debt_asset_name: string;
  debt_asset_symbol: string;
  debt_asset_price: number;
  debt_repaid_amount: number;
  transaction_hash: string;
  block_number: number;
  receive_a_token: boolean;
  timestamp: string;
}
