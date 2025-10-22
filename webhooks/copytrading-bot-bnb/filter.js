function main(payload) {
  const { data, metadata } = payload;

  // Configuration constants
  const TARGET_WALLET = "YOUR_TARGET_WALLET_ADDRESS_HERE"; //  👈 REPLACE WITH YOUR TARGET WALLET ADDRESS
  const TARGET_CONTRACT = "0x5c952063c7fc8610FFDB798152D69F0B9550762b";
  const TOKEN_PURCHASE_SIG =
    "0x7db52723a3b2cdd6164364b3b766e65e540d7be48ffa89582956d8eaebe62942";

  // Normalize for comparison
  const normalizedContract = TARGET_CONTRACT.toLowerCase();
  const normalizedWallet = TARGET_WALLET.toLowerCase();

  const copyTrades = [];

  // Helper function to extract address from data field at given offset
  function extractAddress(dataHex, offset) {
    const data = dataHex.slice(2);
    // Each parameter is 32 bytes (64 hex chars)
    // Address is 20 bytes, padded with 12 bytes of zeros on the left
    const start = offset * 64 + 24; // Skip 24 hex chars (12 bytes) of padding
    const addressHex = data.slice(start, start + 40);
    return "0x" + addressHex.toLowerCase();
  }

  // Helper function to extract uint256 from data field at given offset
  function extractUint256(dataHex, offset) {
    const data = dataHex.slice(2);
    const start = offset * 64;
    const uint256Hex = data.slice(start, start + 64);
    // Return as hex string with 0x prefix (can be converted to BigInt if needed)
    return "0x" + uint256Hex;
  }

  // Helper function to convert hex to decimal string (for readability)
  function hexToDecimal(hexString) {
    try {
      // Remove 0x prefix if present
      const hex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
      // Convert to BigInt to handle large numbers
      return BigInt("0x" + hex).toString();
    } catch (error) {
      return hexString; // Return original if conversion fails
    }
  }

  // Process all receipts in the block
  data[0].receipts.forEach((receipt) => {
    // Filter logs matching the contract and event signature
    const relevantLogs = receipt.logs.filter((log) => {
      if (
        !log.address ||
        log.address.toLowerCase() !== normalizedContract ||
        !log.topics ||
        log.topics[0] !== TOKEN_PURCHASE_SIG ||
        !log.data
      ) {
        return false;
      }

      // Extract buyer address from data field (2nd parameter, offset 1)
      try {
        const buyerAddress = extractAddress(log.data, 1);
        return buyerAddress === normalizedWallet;
      } catch (error) {
        // Skip malformed logs
        return false;
      }
    });

    if (relevantLogs.length > 0) {
      // Decode all parameters for each relevant log
      const decodedLogs = relevantLogs.map((log) => {
        try {
          // Extract all 8 parameters
          const token = extractAddress(log.data, 0);
          const buyer = extractAddress(log.data, 1);
          const price = extractUint256(log.data, 2);
          const amount = extractUint256(log.data, 3);
          const cost = extractUint256(log.data, 4);
          const fee = extractUint256(log.data, 5);
          const offers = extractUint256(log.data, 6);
          const funds = extractUint256(log.data, 7);

          return {
            token: token,
            buyer: buyer,
            price: hexToDecimal(price),
            amount: hexToDecimal(amount), // Human-readable decimal
            cost: hexToDecimal(cost),
            fee: hexToDecimal(fee),
            offers: hexToDecimal(offers),
            funds: hexToDecimal(funds),
          };
        } catch (error) {
          return {
            error: "Failed to decode log",
            errorMessage: error.message,
            rawData: log.data,
          };
        }
      });

      copyTrades.push({
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        blockTimestamp: parseInt(data[0].block.timestamp, 16),
        buyer: TARGET_WALLET,
        contract: TARGET_CONTRACT,
        from: receipt.from,
        to: receipt.to,
        logs: decodedLogs,
        status: receipt.status,
      });
    }
  });

  // Return null for no matches (saves bandwidth and costs)
  if (copyTrades.length === 0) {
    return null;
  }

  // Return structured payload optimized for trading bot
  return {
    trades: copyTrades,
  };
}
