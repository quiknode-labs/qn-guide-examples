/**
 * Step 2: List HIP-4 Outcome Markets — comprehensive view
 * Shows all markets with live mids, recent trades, and account context.
 */
import { HyperliquidSDK, type PredictionMarket } from "@quicknode/hyperliquid-sdk";

const sdk = new HyperliquidSDK(process.env.QUICKNODE_ENDPOINT, {
  privateKey: process.env.PRIVATE_KEY,
});

const walletAddress = process.env.WALLET_ADDRESS;

console.log("=".repeat(60));
console.log("HIP-4 PREDICTION MARKETS");
console.log("=".repeat(60));

const allMarkets = await sdk.predictionMarkets();

if (allMarkets.length === 0) {
  console.log("No active HIP-4 markets found.");
  process.exit(0);
}

// Show only the first 3 markets to keep output manageable
const markets = allMarkets.slice(0, 3);
console.log(`Total markets: ${allMarkets.length} (showing first ${markets.length})\n`);

for (const market of markets as PredictionMarket[]) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`Title      : ${market.title}`);
  console.log(`Description: ${market.description}`);
  console.log(`Slug       : ${market.slug}`);
  console.log(`Underlying : ${market.underlying ?? "N/A"}`);
  console.log(`Target px  : ${market.targetPrice ?? "N/A"}`);
  console.log(`Expiry     : ${market.expiry ?? "N/A"}`);
  console.log(`Period     : ${market.period ?? "N/A"}`);
  console.log(`Collateral : ${market.collateral}`);
  console.log(`Min Order  : ${market.minOrderValue} ${market.collateral}`);
  console.log(`Aliases    : ${market.aliases.join(", ")}`);

  console.log("\n  Sides:");
  for (const side of market.sides) {
    const livePrice = await sdk.getMid(side);
    console.log(`    ${side.name.padEnd(4)}: symbol=${side.symbol}  token=${side.token}  assetId=${side.assetId}  mid=${side.mid}  liveMid=${livePrice}`);
  }

  // Recent trades for YES side
  const recentTrades = await sdk.info.recentTrades(market.yes.symbol) as any[];
  console.log(`\n  Recent trades (${market.yes.symbol}):`);
  if (!recentTrades?.length) {
    console.log("    No recent trades");
  } else {
    for (const t of recentTrades.slice(0, 5)) {
      const ts = new Date(t.time).toISOString();
      console.log(`    [${ts}] ${t.side} px=${t.px}  sz=${t.sz}  hash=${t.hash}`);
    }
  }

  // Recent trades for NO side
  const recentTradesNo = await sdk.info.recentTrades(market.no.symbol) as any[];
  console.log(`\n  Recent trades (${market.no.symbol}):`);
  if (!recentTradesNo?.length) {
    console.log("    No recent trades");
  } else {
    for (const t of recentTradesNo.slice(0, 5)) {
      const ts = new Date(t.time).toISOString();
      console.log(`    [${ts}] ${t.side} px=${t.px}  sz=${t.sz}`);
    }
  }

  // User's fills for this market (if wallet set)
  if (walletAddress) {
    const fills = await sdk.info.userFills(walletAddress) as any[];
    const hip4Fills = fills?.filter((f: any) =>
      f.coin === market.yes.symbol || f.coin === market.no.symbol
    ) ?? [];
    console.log(`\n  Your fills (${market.yes.symbol} / ${market.no.symbol}):`);
    if (!hip4Fills.length) {
      console.log("    No fills");
    } else {
      for (const f of hip4Fills.slice(0, 5)) {
        console.log(`    [${new Date(f.time).toISOString()}] ${f.side} px=${f.px}  sz=${f.sz}  fee=${f.fee}`);
      }
    }
  }
}

console.log(`\n${"=".repeat(60)}`);
console.log("Raw JSON:");
console.log(JSON.stringify(markets, null, 2));
