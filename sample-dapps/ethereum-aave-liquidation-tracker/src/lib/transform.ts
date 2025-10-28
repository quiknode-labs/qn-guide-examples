import { createPublicClient, http, formatUnits, parseAbi, hexToString, trim } from 'viem';
import { mainnet } from 'viem/chains';
import { supabaseServer } from './supabase-backend';
// Blockchain provider setup
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.QUICKNODE_RPC_URL),
});

// In-memory cache for token details (prevents redundant RPC calls)
const tokenCache = new Map<string, TokenDetails>();

// Cache for Aave Oracle BASE_CURRENCY_UNIT (constant value)
let baseCurrencyUnit: number | null = null;

// ERC-20 ABI for fetching token metadata
const ERC20_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
]);

// ERC-20 ABI for fetching token metadata (bytes32 version) for tokens with non-standard string returns
const ERC20_ABI_BYTES32 = parseAbi([
  'function name() view returns (bytes32)',
  'function symbol() view returns (bytes32)',
  'function decimals() view returns (uint8)',
]);

// Configuration for Aave Oracle V3
const AAVE_ORACLE_ADDRESS = '0x54586bE62E3c3580375aE3723C145253060Ca0C2' as const;
const AAVE_ORACLE_ABI = parseAbi([
  'function BASE_CURRENCY_UNIT() external view returns (uint256)',
  'function getAssetsPrices(address[] calldata assets) external view returns (uint256[] memory)',
]);

interface TokenDetails {
  name: string;
  symbol: string;
  decimals: number;
}

interface PriceResult {
  collateralAssetPrice: string;
  debtAssetPrice: string;
}

interface LiquidationLog {
  collateralAsset: string;
  debtAsset: string;
  user: string;
  debtToCover: string | bigint;
  liquidatedCollateralAmount: string | bigint;
  liquidator: string;
  receiveAToken: boolean;
  transactionHash: string;
  blockNumber: string | bigint;
}

interface EnrichedLiquidation {
  liquidator: string;
  user: string;
  collateralAsset: string;
  collateralAssetName: string;
  collateralAssetSymbol: string;
  collateralAssetPrice: string;
  liquidatedCollateralAmountFormatted: number;
  debtAsset: string;
  debtAssetName: string;
  debtAssetSymbol: string;
  debtAssetPrice: string;
  debtToCoverFormatted: number;
  transactionHash: string;
  blockNumber: string;
  receiveAToken: boolean;
  timestamp: number;
}

/**
 * Fetches token details (name, symbol, and decimals) from the blockchain.
 * @param tokenAddress - Address of the ERC-20 token.
 * @returns Token details with name, symbol, and decimals.
 */
async function getTokenDetails(tokenAddress: `0x${string}`): Promise<TokenDetails> {
  // Check cache first
  const cached = tokenCache.get(tokenAddress);
  if (cached) {
    return cached;
  }

  try {
    let name: string, symbol: string, decimals: number;

    // Try string version first
    try {
      const [nameResult, symbolResult, decimalsResult] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'name',
        } as any),
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'symbol',
        } as any),
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'decimals',
        } as any),
      ]);

      name = nameResult as string;
      symbol = symbolResult as string;
      decimals = decimalsResult as number;
    } catch (error: any) {
      // If standard string calls fail, try bytes32 version
      try {
        const [nameBytes, symbolBytes, decimalsResult] = await Promise.all([
          publicClient.readContract({
            address: tokenAddress,
            abi: ERC20_ABI_BYTES32,
            functionName: 'name',
          } as any),
          publicClient.readContract({
            address: tokenAddress,
            abi: ERC20_ABI_BYTES32,
            functionName: 'symbol',
          } as any),
          publicClient.readContract({
            address: tokenAddress,
            abi: ERC20_ABI_BYTES32,
            functionName: 'decimals',
          } as any),
        ]);

        // Convert bytes32 to string and remove null bytes
        name = hexToString(trim(nameBytes as `0x${string}`));
        symbol = hexToString(trim(symbolBytes as `0x${string}`));
        decimals = decimalsResult as number;

        console.log(`✅ Successfully decoded bytes32 token: ${name} (${symbol})`);
      } catch (bytes32Error) {
        console.error(`Failed to decode bytes32 for ${tokenAddress}:`, bytes32Error);
        // Final fallback
        name = 'UNKNOWN';
        symbol = 'UNKNOWN';
        decimals = 18;
      }
    }

    const tokenDetails: TokenDetails = {
      name: name?.trim() || 'UNKNOWN',
      symbol: symbol?.trim() || 'UNKNOWN',
      decimals: decimals,
    };

    // Cache the result
    tokenCache.set(tokenAddress, tokenDetails);

    return tokenDetails;
  } catch (error) {
    console.error(
      `Error fetching details for token ${tokenAddress}:`,
      error instanceof Error ? error.message : error
    );
    return { name: 'UNKNOWN', symbol: 'UNKNOWN', decimals: 18 };
  }
}

/**
 * Fetches prices of multiple tokens using Aave Oracle's `getAssetsPrices` method.
 * @param assetAddress1 - Address of the first token.
 * @param assetAddress2 - Address of the second token.
 * @param blockTag - Block tag to use for the call.
 * @returns Object containing the prices of the two tokens.
 */
async function fetchPrices(
  assetAddress1: `0x${string}`,
  assetAddress2: `0x${string}`,
  blockTag: bigint
): Promise<PriceResult> {
  try {
    const prices = await publicClient.readContract({
      address: AAVE_ORACLE_ADDRESS,
      abi: AAVE_ORACLE_ABI,
      functionName: 'getAssetsPrices',
      args: [[assetAddress1, assetAddress2]],
      blockNumber: blockTag,
    } as any) as readonly [bigint, bigint];

    // Fetch BASE_CURRENCY_UNIT only once and cache it
    if (baseCurrencyUnit === null) {
      const BASE_CURRENCY_UNIT = await publicClient.readContract({
        address: AAVE_ORACLE_ADDRESS,
        abi: AAVE_ORACLE_ABI,
        functionName: 'BASE_CURRENCY_UNIT',
      } as any) as bigint;

      baseCurrencyUnit = Math.log10(Number(BASE_CURRENCY_UNIT));
    }

    // Convert prices using cached BASE_CURRENCY_UNIT decimals
    const collateralAssetPrice = formatUnits(prices[0], baseCurrencyUnit);
    const debtAssetPrice = formatUnits(prices[1], baseCurrencyUnit);

    return { collateralAssetPrice, debtAssetPrice };
  } catch (error) {
    console.error(
      'Error fetching token prices:',
      error instanceof Error ? error.message : error
    );
    throw error;
  }
}

/**
 * Helper function to format token amounts
 */
function formatTokenAmount(amount: bigint, decimals: number): number {
  try {
    const formatted = Number(formatUnits(amount, decimals));
    return formatted;
  } catch (error) {
    console.error(`Error formatting token amount:`, error);
    return 0;
  }
}

/**
 * Writes liquidation data to Supabase.
 * @param liquidations - Array of enriched liquidation events.
 */
async function writeToSupabase(liquidations: EnrichedLiquidation[]): Promise<void> {
  try {
    for (const liquidation of liquidations) {
      const { error } = await supabaseServer.from('liquidations').insert({
        liquidator_address: liquidation.liquidator,
        liquidated_wallet: liquidation.user,
        collateral_asset: liquidation.collateralAsset,
        collateral_asset_name: liquidation.collateralAssetName,
        collateral_asset_symbol: liquidation.collateralAssetSymbol,
        collateral_asset_price: liquidation.collateralAssetPrice,
        collateral_seized_amount: liquidation.liquidatedCollateralAmountFormatted,
        debt_asset: liquidation.debtAsset,
        debt_asset_name: liquidation.debtAssetName,
        debt_asset_symbol: liquidation.debtAssetSymbol,
        debt_asset_price: liquidation.debtAssetPrice,
        debt_repaid_amount: liquidation.debtToCoverFormatted,
        transaction_hash: liquidation.transactionHash,
        block_number: parseInt(liquidation.blockNumber),
        receive_a_token: liquidation.receiveAToken,
        timestamp: new Date(liquidation.timestamp * 1000).toISOString(),
      });

      if (error) {
        console.error('Error inserting to Supabase:', error);
        throw error;
      }
    }
    console.log('Data written to Supabase successfully.');
  } catch (error) {
    console.error(
      'Error writing to Supabase:',
      error instanceof Error ? error.message : error
    );
    throw error;
  }
}

/**
 * Main function to process liquidation events.
 * @param params - Parameters passed from the webhook.
 * @returns Result of the operation.
 */
export async function processLiquidationData(params: {
  timestamp: number;
  filteredLogs: LiquidationLog[];
}): Promise<{ message?: string; error?: string; processedLiquidations?: number; totalLiquidations?: number; details?: string }> {
  console.log('Processing stream data...');

  try {
    const { timestamp, filteredLogs } = params;

    // Input validation
    if (!timestamp || typeof timestamp !== 'number') {
      return { error: 'Invalid or missing timestamp' };
    }

    if (!Array.isArray(filteredLogs) || filteredLogs.length === 0) {
      return { error: 'No valid liquidation logs to process' };
    }

    const enrichedLogs: EnrichedLiquidation[] = [];

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

        // Convert string addresses to proper type
        const collateralAsset = liquidation.collateralAsset as `0x${string}`;
        const debtAsset = liquidation.debtAsset as `0x${string}`;

        // Convert block number to bigint
        const blockNumber = typeof liquidation.blockNumber === 'string'
          ? BigInt(liquidation.blockNumber)
          : liquidation.blockNumber;

        // Convert amounts to bigint
        const liquidatedAmount = typeof liquidation.liquidatedCollateralAmount === 'string'
          ? BigInt(liquidation.liquidatedCollateralAmount)
          : liquidation.liquidatedCollateralAmount;

        const debtAmount = typeof liquidation.debtToCover === 'string'
          ? BigInt(liquidation.debtToCover)
          : liquidation.debtToCover;

        const [collateralDetails, debtDetails, prices] = await Promise.all([
          getTokenDetails(collateralAsset),
          getTokenDetails(debtAsset),
          fetchPrices(collateralAsset, debtAsset, blockNumber),
        ]);

        const { collateralAssetPrice, debtAssetPrice } = prices;

        // Format amounts using the decimals from token details
        const liquidatedCollateralAmountFormatted = formatTokenAmount(
          liquidatedAmount,
          collateralDetails.decimals
        );

        const debtToCoverFormatted = formatTokenAmount(
          debtAmount,
          debtDetails.decimals
        );

        enrichedLogs.push({
          liquidator: liquidation.liquidator,
          user: liquidation.user,
          collateralAsset: liquidation.collateralAsset,
          collateralAssetName: collateralDetails.name,
          collateralAssetSymbol: collateralDetails.symbol,
          collateralAssetPrice: collateralAssetPrice,
          liquidatedCollateralAmountFormatted: liquidatedCollateralAmountFormatted,
          debtAsset: liquidation.debtAsset,
          debtAssetName: debtDetails.name,
          debtAssetSymbol: debtDetails.symbol,
          debtAssetPrice: debtAssetPrice,
          debtToCoverFormatted: debtToCoverFormatted,
          transactionHash: liquidation.transactionHash,
          blockNumber: typeof liquidation.blockNumber === 'string'
            ? liquidation.blockNumber
            : liquidation.blockNumber.toString(),
          receiveAToken: liquidation.receiveAToken,
          timestamp: timestamp,
        });
      } catch (error) {
        console.error(`Failed to process liquidation:`, {
          liquidation,
          error: error instanceof Error ? error.message : error,
        });
        continue;
      }
    }

    if (enrichedLogs.length === 0) {
      return { error: 'No liquidations were successfully processed' };
    }

    // Write enriched data to Supabase (using server client)
    await writeToSupabase(enrichedLogs);

    return {
      message: 'Streams data processed and written to Supabase',
      processedLiquidations: enrichedLogs.length,
      totalLiquidations: filteredLogs.length,
    };
  } catch (error) {
    console.error(
      'Error in processLiquidationData:',
      error instanceof Error ? error.message : error
    );
    return {
      error: 'Failed to process data',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
