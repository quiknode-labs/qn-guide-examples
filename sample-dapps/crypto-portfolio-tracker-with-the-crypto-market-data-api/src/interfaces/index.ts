// src/interfaces/index.ts

export interface Asset {
  asset_id: string;
  name: string;
  type_is_crypto: number;
  data_quote_start: string;
  data_quote_end: string;
  data_orderbook_start: string;
  data_orderbook_end: string;
  data_trade_start: string;
  data_trade_end: string;
  data_symbols_count: number;
  volume_1hrs_usd: number;
  volume_1day_usd: number;
  volume_1mth_usd: number;
  price_usd?: number;
  id_icon: string;
  chain_addresses?: ChainAddress[];
  data_start: string;
  data_end: string;
}

export interface ChainAddress {
  chain_id: string;
  network_id: string;
  address: string;
}

export interface ExchangeRate {
  time: string;
  asset_id_base: string;
  asset_id_quote: string;
  rate: number;
}

export interface HistoricalRate {
  time_period_start: string;
  time_period_end: string;
  time_open: string;
  time_close: string;
  rate_open: number;
  rate_high: number;
  rate_low: number;
  rate_close: number;
}

export interface HistoricalDataEntry {
  date: string;
  [key: string]: number | string;
}

export interface PortfolioHolding {
  asset: string;
  amount: number;
}

export interface PortfolioInputProps {
  onAddHolding: (asset: string, amount: number) => void;
  assets: Asset[];
  holdings: PortfolioHolding[];
  onUpdateHolding: (index: number, amount: number) => void;
  onRemoveHolding: (index: number) => void;
}

export interface PortfolioSummaryProps {
  totalValue: number;
  currency: string;
}

export interface HistoricalChartProps {
  data: { date: string; value: number }[];
  currency: string;
}

export interface PortfolioPieChartProps {
  holdings: PortfolioHolding[];
  exchangeRates: { [key: string]: number };
  currency: string;
}
