# Aave V3 Liquidation Tracker

Monitor and analyze liquidation events on the Aave V3 protocol in real-time. This project demonstrates the power of serverless blockchain data streaming using QuickNode's [Streams](https://www.quicknode.com/streams?utm_source=internal&utm_campaign=guides&utm_content=aave-v3-liquidation-tracker) and [Functions](https://www.quicknode.com/functions?utm_source=internal&utm_campaign=guides&utm_content=aave-v3-liquidation-tracker).

| Dashboard Overview | Liquidations Table |
| --- | --- |
| ![Dashboard Overview](./public/screenshots/overview.png) | ![Liquidations Table](./public/screenshots/liquidations-table.png) |

## Features

- 📊 Real-time liquidation monitoring
- 💰 Detailed metrics and analytics
- 📈 Historical liquidation trends
- 🔄 Asset distribution analysis
- ⚡ Serverless architecture

## Aave Pool Contract and LiquidationCall Event

### Aave V3 Pool Contract Overview
The **[Pool.sol](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/protocol/pool/Pool.sol)** contract (For Ethereum Mainnet, `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2`) in the Aave V3 protocol is the core of the lending and borrowing system. It facilitates deposits, borrowing, repayments, and liquidations.

### Event to Track: LiquidationCall
The **LiquidationCall** event is emitted when a liquidation occurs in the Aave protocol. It provides critical information about the liquidation transaction, including the collateral seized and the debt repaid.

```solidity

// Event Signature 
// 0xe413a321e8681d831f4dbccbca790d2952b56f977908e45be37335533e005286

LiquidationCall(
    address collateralAsset,
    address debtAsset,
    address user,
    uint256 debtToCover,
    uint256 liquidatedCollateralAmount,
    address liquidator,
    bool receiveAToken
)
```

#### Event Parameters
| **Parameter**            | **Type**   | **Description**                                             |
|--------------------------|------------|-------------------------------------------------------------|
| `collateralAsset`        | `address`  | The address of the asset being seized as collateral.         |
| `debtAsset`              | `address`  | The address of the asset that the liquidator is repaying.    |
| `user`                   | `address`  | The address of the borrower being liquidated.               |
| `debtToCover`            | `uint256`  | The amount of debt being repaid during the liquidation.      |
| `liquidatedCollateralAmount` | `uint256`  | The amount of collateral seized by the liquidator.          |
| `liquidator`             | `address`  | The address of the liquidator performing the liquidation.    |
| `receiveAToken`          | `bool`     | If `true`, liquidator receives aTokens instead of collateral.|

We will be using decoded logs of the `LiquidationCall` event to track liquidations on the Ethereum Mainnet.

## How It Works

This application uses a completely serverless architecture to track and analyze Aave V3 liquidation events:
1. **Data Collection**: **Streams** monitors the raw blockchain event data for Aave V3's liquidation events in both historical and real-time
2. **EVM Decoding**: **Streams** decode the raw event data using the [EVM Decoder](https://www.quicknode.com/docs/streams/filters#decoding-evm-data) to extract the relevant information
3. **Data Processing**: **Functions** process and enrich the decoded event data by fetching token prices and token details
4. **Data Storage**: Enriched event data is automatically stored in the PostgreSQL database
5. **Frontend Display**: React application fetches and displays the data with real-time updates

## Tech Stack

- **Frontend**
  - React
  - TypeScript
  - TanStack Query for data fetching
  - Tailwind CSS for styling
  - shadcn/ui for UI components
  - Recharts for data visualization

- **Backend (Serverless)**
  - QuickNode [Streams](https://www.quicknode.com/streams?utm_source=internal&utm_campaign=guides) for historical and real-time blockchain data
  - QuickNode [Functions](https://www.quicknode.com/functions?utm_source=internal&utm_campaign=guides) for data enrichment and processing
  - [Supabase](https://supabase.com/) (PostgreSQL) for data storage

## Architecture

```mermaid
flowchart TB
    subgraph Blockchain["Ethereum Blockchain"]
        AaveV3[Aave V3 Protocol]
    end

    subgraph QN["QuickNode Infrastructure"]
        Stream["QuickNode Stream<br/>with EVM Decoder"]
        Function["QuickNode Function"]
        ChainData["On-Chain Token Data"]
        Cache[(Key-Value Store)]
    end

    subgraph Storage["Data Storage"]
        DB[(Supabase DB)]
    end

    subgraph Frontend["React Application"]
        UI["Web Interface"]
        Query["TanStack Query"]
    end

    AaveV3 -->|Liquidation Events| Stream
    Stream -->|Decoded Event Data| Function
    Function <-->|Token Details| ChainData
    Function <-->|Cache Token Data| Cache
    Function -->|Enriched Data| DB
    Query -->|Fetch Data| DB
    DB -->|Return Data| Query
    Query -->|Display| UI

    style Blockchain fill:#ff9999,stroke:#ff0000
    style QN fill:#99ff99,stroke:#00ff00
    style Storage fill:#ffff99,stroke:#ffff00
    style Frontend fill:#ff99ff,stroke:#ff00ff
```

The architecture demonstrates how the system leverages QuickNode's serverless infrastructure to process blockchain data efficiently:

1. QuickNode Stream monitors Aave V3 contract events
2. Events trigger serverless Functions for processing
3. Data is enriched with token and price information
4. Processed data is stored in Supabase
5. Frontend fetches and displays real-time data

## QuickNode Integration

### Streams

QuickNode Streams provide real-time blockchain data without running a node:

- Monitors Aave V3 contracts for liquidation events
- Filters and delivers only relevant events
- Pay only for the filtered data
- Ensures reliable data delivery with retry mechanisms
- Zero infrastructure maintenance required

### Functions

QuickNode Functions process the raw event data:

- Transforms blockchain data into application-ready format
- Enriches events with additional data
  - Fetching token metadata from blockchain (name, symbol, decimals) and storing them in Key-Value Store for future use
  - Real-time token prices from price feeds
  - Calculated USD values for all amounts
  - Historical price data for analytics
- Handles data validation and normalization
- Automatically stores processed data in the database

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Free [QuickNode](https://www.quicknode.com/signup?utm_source=internal&utm_campaign=guides&utm_content=aave-v3-liquidation-tracker) account
- Free [Supabase](https://supabase.com/) account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/sample-dapps/ethereum-aave-liquidation-tracker
```

2. Install dependencies:

```bash
npm install
```

3. Create a new project and database in [Supabase](https://supabase.com). Save the database password for later use.

4. Create a `.env` file and add your [Supabase](https://supabase.com) URL and anonymous key. You can get the URL and key from the Supabase dashboard by clicking the **Connect** button in the project.

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Set up your database using the provided schema:

```sql
CREATE TABLE liquidations (
    id SERIAL PRIMARY KEY,
    liquidator_address character varying(42) NOT NULL,
    liquidated_wallet character varying(42) NOT NULL,
    collateral_asset character varying(42) NOT NULL,
    collateral_asset_name character varying(100),
    collateral_asset_symbol character varying(20),
    collateral_asset_price numeric(20,6),
    collateral_seized_amount numeric(78,18),
    debt_asset character varying(42) NOT NULL,
    debt_asset_name character varying(100),
    debt_asset_symbol character varying(20),
    debt_asset_price numeric(20,6),
    debt_repaid_amount numeric(78,18),
    transaction_hash character varying(66) NOT NULL,
    block_number bigint NOT NULL,
    receive_a_token boolean NOT NULL,
    timestamp timestamp without time zone NOT NULL
);
```

6. Start the development server:

```bash
npm run dev
```

### Setting up QuickNode Streams

1. Create a QuickNode account at [quicknode.com](https://quicknode.com)
2. Set up a new Stream:
   - Select the chain and network (e.g., Ethereum Mainnet)
   - Select the dataset as `Blocks with Receipts`
   - Select start and end block numbers (for real-time data, keep `Stream end` as `Doesn't end`)
   - Select the Modify the payload section and add the following **Streams Filtering Code**
   - Select a test block (e.g., `18983377`) and click `Run test`
   - Select the destination as `Function` with the option to `Create new function`

> The contract addresses, test blocks, and other configurations may vary depending on the specific project and network you are working with. In this app, we use Ethereum Mainnet and the Aave V3 protocol.

You can get the full code for the Streams Filtering Function below or view it [here](./qnServerless/stream.js).

<details> 
<summary>View Streams Filtering Code</summary>

```js
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
```

</details>

<br />

### Setting up QuickNode Functions

1. Create a Function to process events using the provided Function template
2. Configure database credentials
3. Deploy the Function
4. Check the Function logs to ensure it's running correctly

Replace the placeholders (e.g., `QUICKNODE_RPC_URL`) with your own RPC URL and `POSTGRES_USER`, `POSTGRES_HOST`, `POSTGRES_DB`, and `POSTGRES_PASSWORD` with your PostgreSQL credentials.

#### QuickNode Setup
1. Log in to your [QuickNode dashboard](https://dashboard.quicknode.com).
2. Create a new Endpoint for your chain and network (e.g., Ethereum Mainnet).
3. Copy the RPC URL and paste it into the `QUICKNODE_RPC_URL` placeholder in the Function template.

#### Database Setup
1. Log in to your **Supabase dashboard**.
2. Navigate to your project and click the **Connect** button.
3. Under **Connection info**, click **View connection string**. This will display your database credentials such as host, username, and database name.
4. Get the database password that you saved earlier during the project setup.
4. Copy the values for `host`, `user`, and`database`.
5. Replace the corresponding placeholders when defining `pgClient` in the Function template.
6. Use these credentials to establish a secure connection to your PostgreSQL database within your application.

You can get the full code for the Function below or view it [here](./qnServerless/functions.js).

<details> 
<summary>View Functions Code</summary>

```js
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
```

</details>

### Setting up PostgreSQL Functions

To fetch the data from the database, you can use the following PostgreSQL queries to create some functions. These functions are used in the frontend to display the data.

<details> 
<summary>View PostgreSQL Functions Code</summary>

```sql
-- get_asset_distributions
CREATE OR REPLACE FUNCTION get_asset_distributions()
RETURNS json AS $$
DECLARE
  interval_start timestamp;
BEGIN
  interval_start := CASE time_range
    WHEN '24h' THEN NOW() - INTERVAL '24 hours'
    WHEN '7d' THEN NOW() - INTERVAL '7 days'
    WHEN '30d' THEN NOW() - INTERVAL '30 days'
    WHEN '365d' THEN NOW() - INTERVAL '365 days'
    ELSE NOW() - INTERVAL '30 days'
  END;

  RETURN json_build_object(
    'topCollateralAssets', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          collateral_asset_symbol as symbol,
          COUNT(*) as count,
          SUM(collateral_seized_amount * collateral_asset_price) as totalValueUSD,
          SUM((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)) as totalProfitUSD,
          (COUNT(*)::float / (SELECT COUNT(*) FROM liquidations WHERE timestamp >= interval_start)::float * 100) as percentageOfTotal
        FROM liquidations
        WHERE timestamp >= interval_start
        GROUP BY collateral_asset_symbol
        ORDER BY count DESC
        LIMIT 5
      ) t
    ),
    'topDebtAssets', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          debt_asset_symbol as symbol,
          COUNT(*) as count,
          SUM(debt_repaid_amount * debt_asset_price) as totalValueUSD,
          SUM((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)) as totalProfitUSD,
          (COUNT(*)::float / (SELECT COUNT(*) FROM liquidations WHERE timestamp >= interval_start)::float * 100) as percentageOfTotal
        FROM liquidations
        WHERE timestamp >= interval_start
        GROUP BY debt_asset_symbol
        ORDER BY count DESC
        LIMIT 5
      ) t
    )
  );
END;
$$ LANGUAGE plpgsql;
```

```sql
-- get_metrics_overview
CREATE OR REPLACE FUNCTION get_metrics_overview()
RETURNS json AS $$
BEGIN
  RETURN json_build_object(
    'total24h', (
      SELECT json_build_object(
        'count', COUNT(*),
        'valueUSD', COALESCE(SUM(debt_repaid_amount * debt_asset_price), 0),
        'profitUSD', COALESCE(SUM((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)), 0)
      )
      FROM liquidations
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
    ),
    'total7d', (
      SELECT json_build_object(
        'count', COUNT(*),
        'valueUSD', COALESCE(SUM(debt_repaid_amount * debt_asset_price), 0),
        'profitUSD', COALESCE(SUM((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)), 0)
      )
      FROM liquidations
      WHERE timestamp >= NOW() - INTERVAL '7 days'
    ),
    'total30d', (
      SELECT json_build_object(
        'count', COUNT(*),
        'valueUSD', COALESCE(SUM(debt_repaid_amount * debt_asset_price), 0),
        'profitUSD', COALESCE(SUM((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)), 0)
      )
      FROM liquidations
      WHERE timestamp >= NOW() - INTERVAL '30 days'
    ),
    'total365d', (
      SELECT json_build_object(
        'count', COUNT(*),
        'valueUSD', COALESCE(SUM(debt_repaid_amount * debt_asset_price), 0),
        'profitUSD', COALESCE(SUM((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)), 0)
      )
      FROM liquidations
      WHERE timestamp >= NOW() - INTERVAL '365 days'
    ),
    'topLiquidators', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          liquidator_address as address,
          COUNT(*) as count,
          SUM(debt_repaid_amount * debt_asset_price) as totalValueUSD,
          AVG(debt_repaid_amount * debt_asset_price) as avgLiquidationUSD,
          SUM((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)) as totalProfitUSD,
          AVG((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)) as avgProfitUSD
        FROM liquidations
        GROUP BY liquidator_address
        ORDER BY totalProfitUSD DESC
        LIMIT 5
      ) t
    ),
    'topLiquidatedUsers', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          liquidated_wallet as address,
          COUNT(*) as count,
          SUM(debt_repaid_amount * debt_asset_price) as totalValueUSD,
          AVG(debt_repaid_amount * debt_asset_price) as avgLiquidationUSD,
          SUM((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)) as totalLossUSD,
          AVG((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)) as avgLossUSD
        FROM liquidations
        GROUP BY liquidated_wallet
        ORDER BY count DESC
        LIMIT 5
      ) t
    ),
    'largestLiquidations', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          transaction_hash as txHash,
          timestamp,
          debt_repaid_amount * debt_asset_price as valueUSD,
          (collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price) as profitUSD,
          collateral_asset_symbol as collateralAsset,
          debt_asset_symbol as debtAsset,
          liquidator_address as liquidator,
          liquidated_wallet as liquidatedUser
        FROM liquidations
        ORDER BY debt_repaid_amount * debt_asset_price DESC
        LIMIT 5
      ) t
    ),
    'mostProfitableLiquidations', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          transaction_hash as txHash,
          timestamp,
          debt_repaid_amount * debt_asset_price as valueUSD,
          (collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price) as profitUSD,
          collateral_asset_symbol as collateralAsset,
          debt_asset_symbol as debtAsset,
          liquidator_address as liquidator,
          liquidated_wallet as liquidatedUser
        FROM liquidations
        ORDER BY ((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)) DESC
        LIMIT 5
      ) t
    )
  );
END;
$$ LANGUAGE plpgsql;
```

```sql
-- get_liquidation_trends
CREATE OR REPLACE FUNCTION get_liquidation_trends()
RETURNS json AS $$
DECLARE
  interval_start timestamp;
  grouping_interval text;
BEGIN
  SELECT 
    CASE time_range
      WHEN '24h' THEN NOW() - INTERVAL '24 hours'
      WHEN '7d' THEN NOW() - INTERVAL '7 days'
      WHEN '30d' THEN NOW() - INTERVAL '30 days'
      WHEN '365d' THEN NOW() - INTERVAL '365 days'
      ELSE NOW() - INTERVAL '30 days'
    END,
    CASE time_range
      WHEN '24h' THEN 'hour'
      WHEN '7d' THEN 'day'
      WHEN '30d' THEN 'day'
      WHEN '365d' THEN 'month'
      ELSE 'day'
    END
  INTO interval_start, grouping_interval;

  RETURN (
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT 
        date_trunc(grouping_interval, timestamp) as date,
        COUNT(*) as count,
        COALESCE(SUM(debt_repaid_amount * debt_asset_price), 0) as totalValueUSD,
        COALESCE(SUM((collateral_seized_amount * collateral_asset_price) - (debt_repaid_amount * debt_asset_price)), 0) as totalProfitUSD
      FROM liquidations
      WHERE timestamp >= interval_start
      GROUP BY date_trunc(grouping_interval, timestamp)
      ORDER BY date_trunc(grouping_interval, timestamp)
    ) t
  );
END;
$$ LANGUAGE plpgsql;
```

</details> 

### Setting up PostgreSQL Indexes

For better query performance, we can create indexes on the `liquidations` table. Here's an example of how to create the necessary indexes:

```sql
CREATE UNIQUE INDEX liquidations_pkey ON liquidations(id int4_ops);
CREATE INDEX idx_debt_asset ON liquidations(debt_asset_symbol text_ops);
CREATE INDEX idx_timestamp ON liquidations(timestamp timestamp_ops);
CREATE INDEX idx_liquidator_address ON liquidations(liquidator_address text_ops);
CREATE INDEX idx_liquidated_wallet ON liquidations(liquidated_wallet text_ops);
CREATE INDEX idx_collateral_asset ON liquidations(collateral_asset_symbol text_ops);
CREATE INDEX idx_liquidations_assets ON liquidations(collateral_asset_symbol text_ops,debt_asset_symbol text_ops);
```

## Development

### Project Structure

```
src/
  ├── components/       # Reusable UI components
  ├── hooks/            # Custom React hooks
  ├── lib/              # Utilities and helpers
  └── types/            # TypeScript type definitions
```

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Possible Future Features

### Advanced Features

- Real-time notifications for:

  - Large liquidations
  - Specific assets
  - Price threshold alerts

- Whale wallet tracking
- Custom alert thresholds
- Portfolio risk assessment
- Integration with other DeFi protocols

### Technical Enhancements

- WebSocket support for real-time updates
- Multiple network support (Polygon, Arbitrum, etc.)
- Advanced data visualization options
- Mobile app version
- API access for developers
