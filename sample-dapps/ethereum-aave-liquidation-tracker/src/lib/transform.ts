import { createPublicClient, http, formatUnits, parseAbi, hexToString } from 'viem';
import { mainnet } from 'viem/chains';
import { supabaseServer } from './supabase-backend';
import type { LiquidationPayload } from './payload';

if (!process.env.QUICKNODE_RPC_URL) throw new Error('QUICKNODE_RPC_URL is required');
const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.QUICKNODE_RPC_URL, { timeout: 5000, retryCount: 0 }),
});
const erc20 = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
]);
const bytes32Erc20 = parseAbi([
  'function name() view returns (bytes32)',
  'function symbol() view returns (bytes32)',
]);
const oracle = '0x54586bE62E3c3580375aE3723C145253060Ca0C2' as const;
const oracleAbi = parseAbi([
  'function BASE_CURRENCY_UNIT() view returns (uint256)',
  'function getAssetsPrices(address[] assets) view returns (uint256[])',
]);
type Token = { name: string; symbol: string; decimals: number };
const tokenCache = new Map<string, Token>();
let priceDecimals: number | undefined;

async function tokenDetails(address: `0x${string}`): Promise<Token> {
  const cached = tokenCache.get(address);
  if (cached) return cached;
  const decimals = await client.readContract({ address, abi: erc20, functionName: 'decimals' });
  let name: string, symbol: string;
  try {
    [name, symbol] = await Promise.all([
      client.readContract({ address, abi: erc20, functionName: 'name' }),
      client.readContract({ address, abi: erc20, functionName: 'symbol' }),
    ]);
  } catch {
    // Some older tokens expose bytes32 metadata instead of strings. A failed
    // fallback must fail the delivery rather than saving an invented decimal count.
    const [rawName, rawSymbol] = await Promise.all([
      client.readContract({ address, abi: bytes32Erc20, functionName: 'name' }),
      client.readContract({ address, abi: bytes32Erc20, functionName: 'symbol' }),
    ]);
    name = hexToString(rawName, { size: 32 });
    symbol = hexToString(rawSymbol, { size: 32 });
  }
  const token = { name: name.trim(), symbol: symbol.trim(), decimals };
  tokenCache.set(address, token);
  return token;
}

async function prices(collateral: `0x${string}`, debt: `0x${string}`, blockNumber: bigint) {
  const values = await client.readContract({
    address: oracle, abi: oracleAbi, functionName: 'getAssetsPrices',
    args: [[collateral, debt]], blockNumber,
  });
  if (values.length !== 2) throw new Error('Expected two oracle prices');
  if (priceDecimals === undefined) {
    const unit = await client.readContract({ address: oracle, abi: oracleAbi, functionName: 'BASE_CURRENCY_UNIT' });
    if (!/^10*$/.test(unit.toString())) throw new Error('Unsupported oracle price unit');
    priceDecimals = unit.toString().length - 1;
  }
  return values.map(value => formatUnits(value, priceDecimals!));
}

export async function processLiquidationData(params: LiquidationPayload) {
  try {
    if (await client.getChainId() !== 1) throw new Error('Use Ethereum mainnet');
    const rows = [];
    for (const event of params.filteredLogs) {
      const collateral = event.collateralAsset as `0x${string}`;
      const debt = event.debtAsset as `0x${string}`;
      const [collateralToken, debtToken, assetPrices] = await Promise.all([
        tokenDetails(collateral), tokenDetails(debt), prices(collateral, debt, BigInt(event.blockNumber)),
      ]);
      rows.push({
        liquidator_address: event.liquidator,
        liquidated_wallet: event.user,
        collateral_asset: event.collateralAsset,
        collateral_asset_name: collateralToken.name,
        collateral_asset_symbol: collateralToken.symbol,
        collateral_asset_price: assetPrices[0],
        collateral_seized_amount: formatUnits(BigInt(event.liquidatedCollateralAmount), collateralToken.decimals),
        debt_asset: event.debtAsset,
        debt_asset_name: debtToken.name,
        debt_asset_symbol: debtToken.symbol,
        debt_asset_price: assetPrices[1],
        debt_repaid_amount: formatUnits(BigInt(event.debtToCover), debtToken.decimals),
        transaction_hash: event.transactionHash,
        block_number: event.blockNumber,
        block_hash: event.blockHash,
        log_index: event.logIndex,
        receive_a_token: event.receiveAToken,
        timestamp: new Date(event.timestamp * 1000).toISOString(),
      });
    }
    // Enrich the entire batch first. One atomic upsert avoids partial batches,
    // and the event identity makes concurrent retries safe across restarts.
    const uniqueRows = [...new Map(rows.map(row => [`${row.transaction_hash}:${row.log_index}`, row])).values()];
    const { error } = await supabaseServer.from('liquidations').upsert(uniqueRows, {
      onConflict: 'transaction_hash,log_index',
    });
    if (error) throw error;
    console.log('Data written to Supabase successfully.');
    return { processedLiquidations: params.filteredLogs.length };
  } catch {
    // RPC errors can include the credential-bearing endpoint. Keep it out of logs.
    console.error('RPC enrichment or database write failed; delivery must retry');
    return { error: 'Failed to enrich or persist the complete liquidation batch' };
  }
}
