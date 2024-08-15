export interface TokenPerformanceResult {
  data: TokenPerformance[]
}

export interface TokenPerformance {
  avg_buy_price: number;
  avg_sell_price?: number;
  current_price: number;
  first_trade_timestamp: number;
  last_trade_timestamp: number;
  pnl: number;
  realized_investment: number;
  realized_profit: number;
  realized_return?: number;
  realized_value: number;
  token_address: string;
  token_name: string;
  token_symbol: string;
  total_buy_amount: number;
  total_buy_volume: number;
  total_buys: number;
  total_investment: number;
  total_profit: number;
  total_return?: number;
  total_sell_amount: number;
  total_sell_volume: number;
  total_sells: number;
  total_trades: number;
  total_value: number;
  trading_balance: number;
  unrealized_investment: number;
  unrealized_profit: number;
  unrealized_return?: number;
  unrealized_value: number;
}
