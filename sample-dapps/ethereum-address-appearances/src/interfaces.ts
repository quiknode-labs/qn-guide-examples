export interface Appearance {
  blockNumber: string;
  transactionIndex: string;
}

export interface Meta {
  lastIndexedBlock: string;
  address: string;
  previousPageId: string | null;
  nextPageId: string | null;
}

export interface ApiRoot {
  data: { result: ApiResponse };
}

export interface ApiResponse {
  data: Appearance[];
  meta: {
    lastIndexedBlock: string;
    address: string;
    previousPageId: string | null;
    nextPageId: string | null;
  };
}

export interface SimplifiedEtherscanTransaction {
  blockNumber: string;
  hash: string;
  gas: string;
  transactionIndex?: string;
}

export interface EtherscanTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
}

export interface EtherscanResponse {
  status: string;
  message: string;
  result: EtherscanTransaction[];
}

export interface CombinedTransactionData {
  customBlockNumber: string;
  customTxIndex: string;
  etherscanBlockNumber: string;
  etherscanTxIndex: string;
//   etherscanHash: string,
  type: string;
  gas?: string;
  isDuplicate?: boolean;
}
