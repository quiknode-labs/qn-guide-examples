const calculateCumulativeTransactions = (
  data: { blockNumber: number; transactionIndex: number }[]
) => {
  const cumulativeData: { blockRange: string; count: number }[] = [];

  const roundNumber = 100000;

  const minBlock =
    Math.round(Math.min(...data.map((d) => d.blockNumber)) / roundNumber) *
    roundNumber;
  const maxBlock =
    Math.round(Math.max(...data.map((d) => d.blockNumber)) / roundNumber) *
    roundNumber;

  const rangeSize = Math.round((maxBlock - minBlock) / 10); // Adjust the range size as needed

  for (let start = minBlock; start <= maxBlock; start += rangeSize) {
    const end = start + rangeSize - 1;
    const count = data.filter(
      (d) => d.blockNumber >= start && d.blockNumber <= end
    ).length;
    cumulativeData.push({
      blockRange: `${formatBlockNumber(start)}-${formatBlockNumber(end)}`,
      count,
    });
  }

  return cumulativeData;
};

const formatBlockNumber = (blockNumber: number) => {
  return (blockNumber / 1000).toFixed(0) + "K";
};

export default calculateCumulativeTransactions;