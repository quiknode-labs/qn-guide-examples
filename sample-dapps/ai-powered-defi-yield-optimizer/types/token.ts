export interface TokensResponse {
  tokens: Token[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface Token {
  address: string;
  symbol: string;
  decimals: number;
  listed: boolean;
  wrapped_address?: string;
  note?: string;
}
