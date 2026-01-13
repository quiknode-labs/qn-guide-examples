export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export interface TokenBalance {
  mint: string;
  balance: number;
  decimals: number;
}

export type SwapStatus = "idle" | "quoting" | "signing" | "executing" | "success" | "error";

