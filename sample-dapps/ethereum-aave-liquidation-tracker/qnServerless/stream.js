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

    // Pool.sol addresses for Aave V3
    const allowedAddresses = [
      "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", // Aave V3
    ];

    // Extract data from the stream
    const data = stream.data ? stream.data : stream;

    // Include timestamp from the stream
    const timestamp = parseInt(data[0].block.timestamp, 16);

    // Decode the transaction receipts using the Aave ABI
    let decodedReceipts = decodeEVMReceipts(data[0].receipts, [
      aaveLiquidationAbi,
    ]);

    // Add validation for decoded receipts
    if (!decodedReceipts) {
      console.log("Failed to decode receipts");
      return;
    }

    // Filter logs by event name and originating contract address
    let filteredLogs = decodedReceipts
      .filter(
        (receipt) => receipt.decodedLogs && receipt.decodedLogs.length > 0
      )
      .flatMap((receipt) =>
        receipt.decodedLogs.filter(
          (log) =>
            log.name === "LiquidationCall" &&
            allowedAddresses.includes(log.address) // Filter by contract address
        )
      );

    // If no decoded logs are found, return nothing
    if (!filteredLogs || filteredLogs.length === 0) {
      return;
    }

    // Return the extracted logs along with the timestamp
    return { timestamp, filteredLogs };
  } catch (error) {
    console.log(error);
    return { error: error.message };
  }
}
