import { Address } from "viem";

export interface Token {
  address: Address;
  symbol: string;
  decimals: number;
  name: string;
  balance?: string;
  icon?: string;
}

export interface MultiTokenValue {
  id: string;
  value: string;
}

export interface TokenWithBalance extends Token {
  balance: string;
  type?: string;
  multiTokenValues?: MultiTokenValue[];
}

export interface WalletData {
  address: Address;
  balance: string;
  tokens: TokenWithBalance[];
  txids: string[];
}

export interface UseSwapQuoteParams {
  fromToken: Token | null;
  toToken: Token | null;
  amount: string;
  gasPrice: string;
}

export interface SwapQuote {
  inToken: Token & {
    usd: string;
    volume: number;
  };
  outToken: Token & {
    usd: string;
    volume: number;
  };
  inAmount: string;
  outAmount: string;
  estimatedGas: string;
  dexes: {
    dexIndex: number;
    dexCode: string;
    swapAmount: string;
  }[];
  path?: {
    from: string;
    to: string;
    parts: number;
    routes: {
      parts: number;
      percentage: number;
      subRoutes: {
        from: string;
        to: string;
        parts: number;
        dexes: {
          dex: string;
          id: string;
          parts: number;
          percentage: number;
          fee: number;
        }[];
      }[];
    }[];
  };
  save: number;
  price_impact: string;
}