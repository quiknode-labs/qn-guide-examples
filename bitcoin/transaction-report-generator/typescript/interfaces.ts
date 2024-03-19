import { DateTime } from "luxon";

export interface CalculateVariablesOptions {
  startDate?: DateTime;
  endDate?: DateTime;
  userTimezone?: string;
}

export interface Config {
  startDate?: {
    year: number;
    month: number; // Luxon uses 1-indexed months
    day: number;
  };
  endDate?: {
    year: number;
    month: number;
    day: number;
  };
  userTimezone?: string;
}

// Defines the structure for the overall result of a blockchain query,
export interface Result {
  page: number;
  totalPages: number;
  itemsOnPage: number;
  address: string;
  balance: string;
  totalReceived: string;
  totalSent: string;
  unconfirmedBalance: string;
  unconfirmedTxs: number;
  txs: number;
  transactions: Transaction[];
}

// Represents the details of a single Bitcoin transaction.
export interface Transaction {
  txid: string;
  version: number;
  vin: Vin[];
  vout: Vout[];
  blockHash: string;
  blockHeight: number;
  confirmations: number;
  blockTime: number;
  size: number;
  vsize: number;
  value: string;
  valueIn: string;
  fees: string;
  hex?: string;
}

export interface ExtendedTransaction extends Transaction {
  day: string;
  timestamp: string;
  userTimezone: string;
  direction: string;
  fromAddresses: string;
  toAddresses: string;
  btcAmount: number;
  usdAmount: number;
  btcFees: number;
  usdFees: number;
  type: string;
  balanceBeforeTx: number;
  balanceAfterTx: number;
  withinInterval: boolean;
}

export interface ExtendedResult {
  page: number;
  totalPages: number;
  itemsOnPage: number;
  address: string;
  balance: string;
  totalReceived: string;
  totalSent: string;
  unconfirmedBalance: string;
  unconfirmedTxs: number;
  txs: number;
  extendedTransactions: ExtendedTransaction[];
  startDate: DateTime;
  endDate: DateTime;
}

// Represents an input in a Bitcoin transaction.
export interface Vin {
  txid: string;
  vout?: number;
  sequence: number;
  n: number;
  addresses: string[];
  isAddress: boolean;
  value: string;
  hex: string;
  isOwn?: boolean;
}

// Represents an output in a Bitcoin transaction.
export interface Vout {
  value: string;
  n: number;
  hex: string;
  addresses: string[];
  isAddress: boolean;
  spent?: boolean;
  isOwn?: boolean;
}

// Represents price data, including a timestamp and currency rates.
export interface PriceData {
  ts: number;
  rates: Rates;
}

// Contains currency conversion rates, e.g., from Bitcoin to USD.
export interface Rates {
  usd: number;
}
