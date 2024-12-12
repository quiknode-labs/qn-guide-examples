// Test block: 18983377 or any other block that has a liquidation event
// Dataset: Block with receipts
// Chain and Network: Ethereum Mainnet -- Update all related fields (e.g., contract addresses, test block, etc.) to match your specific project and network

const { ethers } = require("ethers");
const { Client } = require("pg"); // PostgreSQL client

// Blockchain provider setup (e.g., QuickNode RPC)
// 👇 Replace the placeholder with your own RPC URL
const provider = new ethers.JsonRpcProvider("QUICKNODE_RPC_URL");

// ERC-20 ABI for fetching token metadata
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

// ERC-20 ABI for fetching token metadata (bytes32 version) for tokens with non-standard decimals
const ERC20_ABI_BYTES32 = [
  "function name() view returns (bytes32)",
  "function symbol() view returns (bytes32)",
  "function decimals() view returns (uint8)",
];

// Configuration for Aave Oracle V3
const AAVE_ORACLE_ADDRESS = "0x54586bE62E3c3580375aE3723C145253060Ca0C2";
const AAVE_ORACLE_ABI = [
  "function BASE_CURRENCY_UNIT() external view returns (uint256)",
  "function getAssetsPrices(address[] calldata assets) external view returns (uint256[] memory)",
];

/**
 * Fetches token details (name, symbol, and decimals) from the blockchain or Key-Value Store.
 * Calculates token amounts in their native unit using decimals.
 * @param {string} tokenAddress - Address of the ERC-20 token.
 * @returns {Promise<Object>} - Token details with name, symbol, and decimals.
 */
async function getTokenDetails(tokenAddress) {
  try {
    // Check Key-Value Store for cached token metadata
    const cachedData = await qnLib.qnGetSet(`${tokenAddress}_details`);
    if (cachedData) {
      console.log(`Cache hit for token: ${tokenAddress}`);
      return JSON.parse(cachedData); // Return cached data
    }

    // Fetch token details (name, symbol, decimals)
    let name, symbol, decimals;

    // Try string version first
    try {
      // Cache miss: Fetch token details from blockchain
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

      name = await contract.name();
      symbol = await contract.symbol();
      decimals = await contract.decimals();
    } catch (error) {
      console.error(
        `Failed to get token details with string for ${tokenAddress}:`,
        error
      );

      // If string version fails, try bytes32
      try {
        // Cache miss: Fetch token details from blockchain
        const contractBytes32 = new ethers.Contract(
          tokenAddress,
          ERC20_ABI_BYTES32,
          provider
        );
        const nameBytes = await contractBytes32.name();
        const symbolBytes = await contractBytes32.symbol();

        // Convert bytes32 to string and trim null bytes
        name = ethers.decodeBytes32String(nameBytes);
        symbol = ethers.decodeBytes32String(symbolBytes);
        decimals = await contractBytes32.decimals();
      } catch (secondError) {
        console.error(
          `Failed to get token details for ${tokenAddress}:`,
          secondError
        );
        // Fallback values
        name = "UNKNOWN";
        symbol = "UNKNOWN";
        decimals = 18;
      }
    }

    const decimalsInt = parseInt(decimals);

    // Cache the fetched data
    const tokenDetails = {
      name: name?.trim() || "UNKNOWN",
      symbol: symbol?.trim() || "UNKNOWN",
      decimals: decimalsInt,
    };
    await qnLib.qnAddSet(
      `${tokenAddress}_details`,
      JSON.stringify(tokenDetails)
    );
    console.log(`Cached data for token: ${tokenAddress}`);

    return tokenDetails;
  } catch (error) {
    console.error(
      `Error fetching details for token ${tokenAddress}:`,
      error.message
    );
    return { name: null, symbol: null, decimals: 18 }; // Default to 18 decimals if unavailable
  }
}

/**
 * Fetches prices of multiple tokens using Aave Oracle's `getAssetsPrices` method.
 * @param {string} assetAddress1 - Address of the first token.
 * @param {string} assetAddress2 - Address of the second token.
 * @param {string or number} blockTag - Block tag to use for the call.
 * @returns {Promise<Object>} - Object containing the prices of the two tokens.
 */
async function fetchPrices(assetAddress1, assetAddress2, blockTag) {
  const contract = new ethers.Contract(
    AAVE_ORACLE_ADDRESS,
    AAVE_ORACLE_ABI,
    provider
  );

  try {
    const [price1, price2] = await contract.getAssetsPrices(
      [assetAddress1, assetAddress2],
      { blockTag: blockTag }
    );

    const BASE_CURRENCY_UNIT = await contract.BASE_CURRENCY_UNIT();

    const decimals = Math.log10(Number(BASE_CURRENCY_UNIT));

    // Convert prices using BASE_CURRENCY_UNIT
    const collateralAssetPrice = ethers.formatUnits(price1, decimals);
    const debtAssetPrice = ethers.formatUnits(price2, decimals);

    return { collateralAssetPrice, debtAssetPrice };
  } catch (error) {
    console.error("Error fetching token prices:", error.message);
    throw error;
  }
}

// Helper function to format token amounts
function formatTokenAmount(amount, decimals) {
  try {
    const formatted = Number(ethers.formatUnits(amount, decimals));

    return formatted;
  } catch (error) {
    console.error(`Error formatting token amount:`, error);
    return 0;
  }
}

/**
 * Writes liquidation data to PostgreSQL.
 * Converts numeric fields (like liquidatedCollateralAmount, debtToCover, blockNumber) to suitable types.
 * @param {Array} liquidations - Array of enriched liquidation events.
 * @param {Object} pgClient - PostgreSQL client instance.
 */
async function writeToPostgres(liquidations, pgClient) {
  try {
    const query = `
      INSERT INTO liquidations (
        liquidator_address,
        liquidated_wallet,
        collateral_asset,
        collateral_asset_name,
        collateral_asset_symbol,
        collateral_asset_price,
        collateral_seized_amount,
        debt_asset,
        debt_asset_name,
        debt_asset_symbol,
        debt_asset_price,
        debt_repaid_amount,
        transaction_hash,
        block_number,
        receive_a_token,
        timestamp
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      )`;

    for (const liquidation of liquidations) {
      await pgClient.query(query, [
        liquidation.liquidator,
        liquidation.user,
        liquidation.collateralAsset,
        liquidation.collateralAssetName,
        liquidation.collateralAssetSymbol,
        Number(liquidation.collateralAssetPrice),
        liquidation.liquidatedCollateralAmountFormatted,
        liquidation.debtAsset,
        liquidation.debtAssetName,
        liquidation.debtAssetSymbol,
        Number(liquidation.debtAssetPrice),
        liquidation.debtToCoverFormatted,
        liquidation.transactionHash,
        parseInt(liquidation.blockNumber),
        liquidation.receiveAToken,
        new Date(liquidation.timestamp * 1000),
      ]);
    }
    console.log("Data written to PostgreSQL successfully.");
  } catch (error) {
    console.error("Error writing to PostgreSQL:", error.message);
    throw error;
  }
}

/**
 * Main function to process liquidation events.
 * @param {Object} params - Parameters passed to the function.
 * @returns {Promise<Object>} - Result of the operation.
 */
async function main(params) {
  console.log("Processing stream data...");

  // PostgreSQL connection setup (e.g., Supabase)
  // 👇 Replace the placeholders with your own values
  const pgClient = new Client({
    user: "POSTGRES_USER",
    host: "POSTGRES_HOST",
    database: "POSTGRES_DB",
    password: "POSTGRES_PASSWORD",
    port: 5432, // Default port for PostgreSQL
  });

  try {
    await pgClient.connect();

    const { timestamp, filteredLogs } = params;

    // Input validation
    if (!timestamp || typeof timestamp !== "number") {
      return { error: "Invalid or missing timestamp" };
    }

    if (!Array.isArray(filteredLogs) || filteredLogs.length === 0) {
      return { error: "No valid liquidation logs to process" };
    }

    const enrichedLogs = [];

    // Process each liquidation
    for (const liquidation of filteredLogs) {
      try {
        if (!liquidation.collateralAsset || !liquidation.debtAsset) {
          console.error(
            `Skipping invalid liquidation: missing assets`,
            liquidation
          );
          continue;
        }

        const [collateralDetails, debtDetails, prices] = await Promise.all([
          getTokenDetails(liquidation.collateralAsset),
          getTokenDetails(liquidation.debtAsset),
          fetchPrices(
            liquidation.collateralAsset,
            liquidation.debtAsset,
            Number(liquidation.blockNumber)
          ),
        ]);

        const { collateralAssetPrice, debtAssetPrice } = prices;

        // Format amounts using the decimals from token details
        const liquidatedCollateralAmountFormatted = formatTokenAmount(
          liquidation.liquidatedCollateralAmount,
          collateralDetails.decimals
        );

        const debtToCoverFormatted = formatTokenAmount(
          liquidation.debtToCover,
          debtDetails.decimals
        );

        enrichedLogs.push({
          ...liquidation,
          collateralAssetName: collateralDetails.name,
          collateralAssetSymbol: collateralDetails.symbol,
          collateralAssetDecimals: collateralDetails.decimals,
          collateralAssetPrice: collateralAssetPrice,
          debtAssetName: debtDetails.name,
          debtAssetSymbol: debtDetails.symbol,
          debtAssetDecimals: debtDetails.decimals,
          debtAssetPrice: debtAssetPrice,
          timestamp: timestamp,
          liquidatedCollateralAmountFormatted:
            liquidatedCollateralAmountFormatted,
          debtToCoverFormatted: debtToCoverFormatted,
        });
      } catch (error) {
        console.error(`Failed to process liquidation:`, {
          liquidation,
          error: error.message,
        });
        continue;
      }
    }

    if (enrichedLogs.length === 0) {
      return { error: "No liquidations were successfully processed" };
    }

    // Write enriched data to PostgreSQL
    await writeToPostgres(enrichedLogs, pgClient);

    return {
      message: "Streams data processed and written to PostgreSQL",
      processedLiquidations: enrichedLogs.length,
      totalLiquidations: filteredLogs.length,
    };
  } catch (error) {
    console.error("Error in main function:", error.message);
    return {
      error: "Failed to process data",
      details: error.message,
    };
  } finally {
    await pgClient.end(); // Close the PostgreSQL connection
    console.log("PostgreSQL connection closed.");
  }
}

// Export the main function for use in QuickNode
module.exports = { main };