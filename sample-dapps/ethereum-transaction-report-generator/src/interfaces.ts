import { DateTime } from "luxon";

export interface CalculateVariablesOptions {
  startDate?: DateTime;
  endDate?: DateTime;
  userTimezone?: string;
}

export interface Config {
  startDate?: {
    year: number;
    month: number;
    day: number;
  };
  endDate?: {
    year: number;
    month: number;
    day: number;
  };
  userTimezone?: string;
}

export interface Result {
  page: number;
  totalPages: number;
  itemsOnPage: number;
  address: string;
  balance: string;
  unconfirmedBalance: string;
  unconfirmedTxs: number;
  txs: number;
  nonTokenTxs: number;
  internalTxs: number;
  transactions: Transaction[];
  nonce: string;
}

export interface Transaction {
  txid: string;
  version: number;
  vin: Vin[];
  vout: Vout[];
  ethereumSpecific?: EthereumSpecific;
  tokenTransfers?: TokenTransfer[];
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

export interface EthereumSpecific {
  internalTransfers?: InternalTransfer[];
  parsedData?: ParsedData;
}

export interface InternalTransfer {
  from: string;
  to: string;
  value: string;
}

export interface ParsedData {
  methodId: string;
  name: string;
}

export interface TokenTransfer {
  type: string;
  from: string;
  to: string;
  contract: string;
  name: string;
  symbol: string;
  decimals: number;
  value: string;
  multiTokenValues?: MultiTokenValues[];
}

export interface MultiTokenValues {
  id: string;
  value: string;
}

export interface ExtractedTransaction {
  txid: string;
  blockHeight: number;
  direction: "Incoming" | "Outgoing";
  txType: string;
  assetType: string;
  senderAddress: string;
  receiverAddress: string;
  value: string;
  fee: string;
  day: string;
  timestamp: string;
  userTimezone: string;
  status: string;
  methodNameOrId: string;
  contract?: string;
  tokenId?: string;
}

export interface ExtendedResult extends Result {
  extractedTransaction: ExtractedTransaction[];
  startDate: DateTime;
  endDate: DateTime;
}

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

export interface Vout {
  value: string;
  n: number;
  hex: string;
  addresses: string[];
  isAddress: boolean;
  spent?: boolean;
  isOwn?: boolean;
}