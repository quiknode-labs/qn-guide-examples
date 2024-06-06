import {
  Appearance,
  SimplifiedEtherscanTransaction,
  CombinedTransactionData,
} from "../interfaces";

const compareData = (
  customData: Appearance[],
  etherscanData: { [key: string]: SimplifiedEtherscanTransaction[] }
) => {
  const combinedData: CombinedTransactionData[] = [];

  // Create a map to group Etherscan data by block number and transaction index
  const etherscanMap = new Map<
    string,
    (SimplifiedEtherscanTransaction & { type: string })[]
  >();
  for (const [type, transactions] of Object.entries(etherscanData)) {
    for (const tx of transactions) {
      const key = `${tx.blockNumber}-${tx.transactionIndex ?? "N/A"}`;
      if (!etherscanMap.has(key)) {
        etherscanMap.set(key, []);
      }
      etherscanMap.get(key)!.push({ ...tx, type });
    }
  }

  // Iterate over custom data and add corresponding Etherscan data if available
  for (const customTx of customData) {
    const key = `${customTx.blockNumber}-${customTx.transactionIndex}`;
    const etherscanTxs = etherscanMap.get(key) || [];
    if (etherscanTxs.length === 0) {
      combinedData.push({
        customBlockNumber: customTx.blockNumber,
        customTxIndex: customTx.transactionIndex,
        etherscanBlockNumber: "",
        etherscanTxIndex: "",
        type: "",
      });
    } else {
      for (const etherscanTx of etherscanTxs) {
        combinedData.push({
          customBlockNumber: customTx.blockNumber,
          customTxIndex: customTx.transactionIndex,
          etherscanBlockNumber: etherscanTx.blockNumber,
          etherscanTxIndex: etherscanTx.transactionIndex,
          type: etherscanTx.type,
        });
      }
    }
  }

  // Add remaining Etherscan transactions not matched with custom data
  for (const [key, transactions] of etherscanMap) {
    for (const tx of transactions) {
      const [blockNumber, transactionIndex] = key.split("-");
      const existsInCustomData = customData.some(
        (customTx) =>
          customTx.blockNumber === blockNumber &&
          customTx.transactionIndex === transactionIndex
      );
      if (!existsInCustomData) {
        combinedData.push({
          customBlockNumber: "",
          customTxIndex: "",
          etherscanBlockNumber: tx.blockNumber,
          etherscanTxIndex: tx.transactionIndex,
          type: tx.type,
        });
      }
    }
  }

  // Sort filteredData by block number in descending order
  combinedData.sort(
    (a, b) =>
      Number(b.customBlockNumber || b.etherscanBlockNumber) -
      Number(a.customBlockNumber || a.etherscanBlockNumber)
  );

  return combinedData;
};

export default compareData;
