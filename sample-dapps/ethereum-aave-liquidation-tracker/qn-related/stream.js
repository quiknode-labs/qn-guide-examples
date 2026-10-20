// Test block: 18983377 or any other block that has a liquidation event
// Dataset: Block with receipts
// Chain and Network: Ethereum Mainnet -- Update all related fields (e.g., contract addresses, test block, etc.) to match your specific project and network

// Filtering function on Streams
function main(stream) {
  // Aave V3 LiquidationCall ABI
  const aaveLiquidationAbi = `[{
    "anonymous": false,
    "inputs": [
      {"indexed": true, "type": "address", "name": "collateralAsset"},
      {"indexed": true, "type": "address", "name": "debtAsset"},
      {"indexed": true, "type": "address", "name": "user"},
      {"indexed": false, "type": "uint256", "name": "debtToCover"},
      {"indexed": false, "type": "uint256", "name": "liquidatedCollateralAmount"},
      {"indexed": false, "type": "address", "name": "liquidator"},
      {"indexed": false, "type": "bool", "name": "receiveAToken"}
    ],
    "name": "LiquidationCall",
    "type": "event"
  }]`;

  // Pool.sol addresses for Aave V3 (lowercase)
  const normalizedAddresses = ["0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"];

  if (!Array.isArray(stream.data)) throw new Error('Expected Blocks with Receipts');
  const filteredLogs = [];
  for (const entry of stream.data) {
    if (!entry.block || !Array.isArray(entry.receipts)) throw new Error('Missing block or receipts');
    const timestamp = Number(BigInt(entry.block.timestamp));
    const receipts = decodeEVMReceipts(entry.receipts, [aaveLiquidationAbi]);
    for (const receipt of receipts) {
      if (BigInt(receipt.status) !== 1n) continue;
      for (const log of receipt.decodedLogs || []) {
        if (log.name !== 'LiquidationCall' || !normalizedAddresses.includes(log.address.toLowerCase())) continue;
        const receiveAToken = String(log.receiveAToken);
        if (!['true', 'false'].includes(receiveAToken)) throw new Error('Invalid receiveAToken');
        filteredLogs.push({
          collateralAsset: log.collateralAsset,
          debtAsset: log.debtAsset,
          user: log.user,
          liquidator: log.liquidator,
          receiveAToken: receiveAToken === 'true',
          debtToCover: String(log.debtToCover),
          liquidatedCollateralAmount: String(log.liquidatedCollateralAmount),
          transactionHash: receipt.transactionHash,
          blockNumber: BigInt(entry.block.number).toString(),
          blockHash: entry.block.hash,
          logIndex: Number(BigInt(log.logIndex)),
          timestamp,
        });
      }
    }
  }
  return filteredLogs.length ? { timestamp: filteredLogs[0].timestamp, filteredLogs } : null;
}
