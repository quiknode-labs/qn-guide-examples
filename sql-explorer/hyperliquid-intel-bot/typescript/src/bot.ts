/**
 * Hyperliquid Intelligence Bot
 *
 * Queries Quicknode SQL Explorer for Hyperliquid market data, composes a
 * formatted digest, and sends it to a Telegram channel.
 *
 * Usage:
 *   npx tsx src/bot.ts              # run once, send digest immediately
 *   npx tsx src/bot.ts --dry-run    # print digest without sending
 *
 * Guide: https://www.quicknode.com/guides/quicknode-products/sql-explorer/build-a-hyperliquid-intelligence-bot
 */

import "dotenv/config";
import { formatDigest } from "./formatter.js";
import {
  getFundingExtremes,
  getLiquidations,
  getPlatformOverview,
  getTopAssets,
} from "./queries.js";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

/** Send a message to the configured Telegram chat. */
async function sendTelegram(message: string): Promise<void> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "Markdown",
    }),
  });

  if (!resp.ok) {
    throw new Error(`Telegram error: ${resp.status} ${resp.statusText}`);
  }

  console.log(`Digest sent (chat_id=${TELEGRAM_CHAT_ID})`);
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");

  console.log("Fetching digest data from SQL Explorer...");

  process.stdout.write("Platform overview:");
  const overview = await getPlatformOverview();

  process.stdout.write("Top assets:");
  const assets = await getTopAssets();

  process.stdout.write("Liquidations:");
  const liquidations = await getLiquidations();

  process.stdout.write("Funding extremes:");
  const funding = await getFundingExtremes();

  const digest = formatDigest(overview, assets, liquidations, funding);
  console.log(`\n${digest}`);

  if (dryRun) {
    console.log("\n[dry-run] Skipping Telegram send.");
  } else {
    await sendTelegram(digest);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
