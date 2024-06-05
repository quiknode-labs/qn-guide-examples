import axios from "axios";
import {
  ApiRoot,
  Appearance,
  SimplifiedEtherscanTransaction,
} from "../interfaces";

const ETHERSCAN_API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY || undefined;
const RATE_LIMIT_DELAY = 300;
const QUICKNODE_ENDPOINT = import.meta.env.VITE_QUICKNODE_ENDPOINT as string;

const fetchTransactions = async (address: string) => {
  const customMethodData = await fetchCustomMethodData(address);

  let esData = {};

  if (ETHERSCAN_API_KEY) {
    esData = await fetchEtherscanData(address);
    esData = filterDuplicates(esData);
  }

  const customTotal = customMethodData.length;
  const etherscanTotals = ETHERSCAN_API_KEY
    ? calculateEtherscanTotals(esData)
    : {};

  return {
    customMethodData,
    esData,
    customTotal,
    etherscanTotals,
  };
};

const fetchCustomMethodData = async (
  address: string
): Promise<Appearance[]> => {
  const results: Appearance[] = [];
  let previousPageId: string | null = null;

  do {
    const response: ApiRoot = await axios.post(QUICKNODE_ENDPOINT, {
      jsonrpc: "2.0",
      method: "tb_getAppearances",
      params: [{ address, perPage: 1000, pageId: previousPageId }],
      id: 1,
    });

    if (response.data) {
      const { data, meta } = response.data.result;

      results.push(...data);

      previousPageId = meta.previousPageId;
    } else {
      throw new Error("Failed to fetch transactions");
    }
  } while (previousPageId);

  return results;
};

const fetchEtherscanData = async (address: string) => {
  const actions = [
    "txlist",
    "txlistinternal",
    "tokentx",
    "tokennfttx",
    "token1155tx",
  ];
  const results: { [key: string]: SimplifiedEtherscanTransaction[] } = {};

  for (const action of actions) {
    results[action] = await fetchEtherscanTransactions(address, action);
  }

  return results;
};

const fetchEtherscanTransactions = async (address: string, action: string) => {
  const results: SimplifiedEtherscanTransaction[] = [];

  // Etherscan endpoint returns a maximum of 10000 records only
  // TO-DO: Go around this limit by getting endBlock of first request as startBlock

  const response = await axios.get("https://api.etherscan.io/api", {
    params: {
      module: "account",
      action,
      address,
      startblock: 0,
      endblock: 99999999,
      page: 1,
      offset: 10000,
      sort: "asc",
      apikey: ETHERSCAN_API_KEY,
    },
  });

  const { result } = response.data;
  results.push(
    ...result.map((tx: SimplifiedEtherscanTransaction) => ({
      blockNumber: tx.blockNumber,
      hash: tx.hash,
      transactionIndex: tx.transactionIndex || undefined,
      gas: tx.gas,
    }))
  );

  await sleep(RATE_LIMIT_DELAY);

  return results;
};

const filterDuplicates = (etherscanData: {
  [key: string]: SimplifiedEtherscanTransaction[];
}) => {
  const allTransactions: SimplifiedEtherscanTransaction[] = [];
  for (const transactions of Object.values(etherscanData)) {
    allTransactions.push(...transactions);
  }

  const uniqueTransactions = new Map<string, SimplifiedEtherscanTransaction>();

  allTransactions.forEach((tx) => {
    const key = `${tx.blockNumber}-${tx.hash}`;
    if (!uniqueTransactions.has(key)) {
      uniqueTransactions.set(key, tx);
    }
  });

  // Reconstruct the etherscanData object with unique transactions
  const filteredData: { [key: string]: SimplifiedEtherscanTransaction[] } = {};
  for (const [action, transactions] of Object.entries(etherscanData)) {
    filteredData[action] = transactions.filter((tx) => {
      const key = `${tx.blockNumber}-${tx.hash}`;
      if (uniqueTransactions.has(key)) {
        uniqueTransactions.delete(key);
        return true;
      }
      return false;
    });
  }

  return filteredData;
};

const calculateEtherscanTotals = (etherscanData: {
  [key: string]: SimplifiedEtherscanTransaction[];
}) => {
  const totals: { [key: string]: number } = {};
  let overallTotal = 0;

  for (const [type, transactions] of Object.entries(etherscanData)) {
    totals[type] = transactions.length;
    overallTotal += transactions.length;
  }

  totals["overall"] = overallTotal;
  return totals;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default fetchTransactions;
