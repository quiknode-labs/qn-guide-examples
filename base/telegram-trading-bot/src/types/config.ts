import { Address } from "viem";

export interface Config {
  telegramBotToken: string;
  quicknodeRpc: string;
  walletEncryptionKey: string;
  dbPath?: string;
  chainId: number;
  defaultSlippage: number;
  defaultGasPriority: "low" | "medium" | "high";
}

export interface UserSettings {
  userId: string;
  slippage: number;
  gasPriority: "low" | "medium" | "high";
}

export interface GasPriceInfo {
  confidence: number;
  price: number;
  maxFeePerGas: number;
  maxPriorityFeePerGas: number;
}

export interface BlockPrice {
  estimatedPrices: GasPriceInfo[];
  baseFeePerGas?: number;
}

export interface BlockPrices {
  blockPrices: BlockPrice[];
  system?: string;
  network?: string;
  unit?: string;
}

export interface QuoteResponse {
  data: {
    inToken: TokenInfo;
    outToken: TokenInfo;
    inAmount: string;
    outAmount: string;
    estimatedGas: string;
    path: string[];
    save: string;
    price_impact: string;
  };
}

export interface SwapResponse {
  data: {
    inToken: TokenInfo;
    outToken: TokenInfo;
    inAmount: string;
    outAmount: string;
    estimatedGas: string;
    to: Address;
    data: string;
    value: string;
    gasPrice: string;
    price_impact?: string;
  };
}

export interface TokenInfo {
  address: Address;
  symbol: string;
  decimals: number;
  balance: string;
  usd?: number;
}

export interface BalanceResponse {
  address: Address;
  balance: string;
  tokens: {
    type: string;
    name: string;
    symbol: string;
    decimals: number;
    balance: string;
    address: Address;
  }[];
}

export interface BalanceHistoryEntry {
  time: number;
  txs: number;
  received: string; // in wei
  sent: string; // in wei
  sentToSelf: string; // in wei
  rates: {
    usd: number;
  };
}


export interface TokenBalanceResult {
  address: string;
  balance: string; // Native token balance
  unconfirmedBalance?: string;
  tokens?: Array<{
    type: string; // Token type (e.g., "ERC20")
    name: string; // Token name
    symbol: string; // Token symbol
    decimals: number; // Token decimals
    balance: string; // Token balance as string (needs conversion)
    contract: Address; // Token contract address
  }>;
  nonce?: string;
  nonTokenTxs?: number; // Number of non-token transactions
}

export interface OpenOceanErrorResponse {
  error: string;
  code?: number;
  message?: string;
}



export interface JsonRpcResponse<T> {
  data?: T;
  result?: T;
  error?: {
    message: string;
    code: number;
  };
  id: number;
  jsonrpc: string;
}

