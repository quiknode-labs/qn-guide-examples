export interface OverallStats {
  first_trade_timestamp: number;
  last_trade_timestamp: number;
  pnl: number;
  realized_investment: number;
  realized_profit: number;
  realized_return: number;
  realized_value: number;
  total_buy_volume: number;
  total_buys: number;
  total_investment: number;
  total_profit: number;
  total_return: number;
  total_sell_volume: number;
  total_sells: number;
  total_tokens_traded: number;
  total_trades: number;
  total_value: number;
  unrealized_investment: number;
  unrealized_profit: number;
  unrealized_return: number;
  unrealized_value: number;
  wallet_address: string;
  win_rate: number;
}
