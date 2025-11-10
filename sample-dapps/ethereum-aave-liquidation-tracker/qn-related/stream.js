// Test block: 18983377 or any other block that has a liquidation event
// Dataset: Block with receipts
// Chain and Network: Ethereum Mainnet -- Update all related fields (e.g., contract addresses, test block, etc.) to match your specific project and network

// Filtering function on Streams
function main(stream) {
  try {
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

    // Handle both payload and stream parameter styles
    const data = stream?.data ? stream.data : stream;

    // Early validation - return null to skip (per QuickNode docs)
    if (!data?.[0]?.block?.timestamp || !data?.[0]?.receipts?.length) {
      return null;
    }

    const timestamp = parseInt(data[0].block.timestamp, 16);

    // Decode receipts
    const decodedReceipts = decodeEVMReceipts(data[0].receipts, [aaveLiquidationAbi]);

    // Validate decoded receipts
    if (!decodedReceipts || !Array.isArray(decodedReceipts) || decodedReceipts.length === 0) {
      return null;
    }

    // Filter for liquidation events
    const filteredLogs = decodedReceipts
      .filter(r => r?.decodedLogs?.length > 0)
      .flatMap(r => r.decodedLogs)
      .filter(log =>
        log?.name === "LiquidationCall" &&
        log?.address &&
        normalizedAddresses.includes(log.address.toLowerCase())
      );

    // Return data if found, null otherwise (per QuickNode docs)
    return filteredLogs?.length > 0
      ? { timestamp, filteredLogs }
      : null;
  } catch (e) {
    // Return null to skip on error (per QuickNode docs)
    return null;
  }
}
