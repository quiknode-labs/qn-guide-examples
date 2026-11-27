import { config, PRICE_POLL_MS, QUOTE_POLL_MS, REF_STALE_MS, WSOL } from "./config.ts";
import type { Store } from "./store.ts";
import type { Slippage } from "../shared/types.ts";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
/** Keyed requests go to api.jup.ag. Without a key, the free lite-api host has the same paths. */
const JUP_BASE = config.jupApiKey ? "https://api.jup.ag" : "https://lite-api.jup.ag";
const PRICE_URL = `${JUP_BASE}/price/v3`;
const QUOTE_URL = `${JUP_BASE}/swap/v1/quote`;
export const LABELS_URL = `${JUP_BASE}/swap/v1/program-id-to-label`;
const SEED_SYMBOLS = ["NVDAx", "TSLAx", "SPYx", "AAPLx", "QQQx", "CRCLx", "MSTRx", "GOOGLx", "METAx", "AMZNx", "COINx", "HOODx"];
const QUOTE_SIZES_USD = [1_000, 10_000, 50_000];

interface PriceEntry {
  usdPrice: number;
  /** Jupiter attaches the underlying stock price to xStocks tokens. This is the reference price. */
  stockData?: { price: number; updatedAt: string };
}

export async function getJson<T>(url: string): Promise<T> {
  const headers: Record<string, string> = config.jupApiKey ? { "x-api-key": config.jupApiKey } : {};
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as T;
}

/**
 * Poll reference prices for every ticker that has traded since startup, plus a few seeds.
 * The Price API takes up to 50 mints per request and does not use Quicknode credits.
 */
export function startPricePolling(store: Store) {
  console.log(`[prices] Jupiter ${config.jupApiKey ? "api.jup.ag with an API key" : "lite-api.jup.ag without a key"}, polling every ${PRICE_POLL_MS / 1000}s`);
  let failures = 0;
  const poll = async () => {
    const seeds = SEED_SYMBOLS.map((symbol) => store.symbolToMint(symbol)).filter((mint): mint is string => Boolean(mint));
    const wanted = [...new Set([...store.activeMints(138), ...seeds])];
    // Each batch stands alone, so one failed request does not hold back the others.
    let failed: Error | null = null;
    for (let i = 0; i < Math.max(1, wanted.length); i += 49) {
      const ids = [WSOL, ...wanted.slice(i, i + 49)];
      try {
        const prices = await getJson<Record<string, PriceEntry>>(`${PRICE_URL}?ids=${ids.join(",")}`);
        if (prices[WSOL]?.usdPrice) store.solPrice = prices[WSOL].usdPrice;
        for (const mint of ids) {
          const stock = prices[mint]?.stockData;
          // Without a readable timestamp the price's age is unknown. Keep the previous one.
          const updatedAt = stock ? Date.parse(stock.updatedAt) : NaN;
          if (stock?.price && Number.isFinite(updatedAt)) store.refs.set(mint, { price: stock.price, updatedAt });
        }
      } catch (error) {
        failed = error as Error;
      }
    }
    if (failed) {
      if (failures++ % 6 === 0) console.warn(`[prices] reference price poll failed: ${failed.message}`);
    } else failures = 0;
    setTimeout(poll, PRICE_POLL_MS * Math.min(6, 1 + failures));
  };
  return poll();
}

/**
 * Once a minute, quote a USDC buy of $1K, $10K, and $50K for the busiest tickers and record
 * what each size costs against the reference price.
 */
export function startQuotePolling(store: Store) {
  const poll = async () => {
    // The busiest tickers, plus any close to being flagged "worth a look", which need a fresh
    // $10K quote before they can be listed as cheaper than the stock.
    const mints = [...new Set([...store.topMintsByVolume(Date.now() - 60 * 60_000, 5), ...store.quoteCandidates])];
    for (const mint of mints) {
      const state = store.mints.get(mint);
      if (!state) continue;
      const sizes: Slippage[] = [];
      for (const usd of QUOTE_SIZES_USD) {
        try {
          const quote = await getJson<{ outAmount: string; routePlan: { swapInfo: { label: string } }[] }>(
            `${QUOTE_URL}?inputMint=${USDC}&outputMint=${mint}&amount=${usd * 1e6}&slippageBps=50`,
          );
          // outAmount is raw. Apply the Scaled UI multiplier to get shares.
          const shares = (Number(quote.outAmount) / 10 ** state.decimals) * multiplierNow(state);
          const price = usd / shares;
          sizes.push({ usd, price, impactPct: 0, route: [...new Set(quote.routePlan.map((leg) => leg.swapInfo.label))].join(" + ") });
        } catch {
          // No route at this size. Leave it out.
        }
        await new Promise((r) => setTimeout(r, 400));
      }
      if (sizes.length > 0) {
        // Cost of each size: its price against the reference when fresh, else against the $1K price.
        const ref = store.refs.get(mint);
        const base = ref && Date.now() - ref.updatedAt < REF_STALE_MS ? ref.price : sizes[0].price;
        for (const size of sizes) size.impactPct = (size.price / base - 1) * 100;
        store.quotes.set(mint, { t: Date.now(), sizes });
      }
    }
    setTimeout(poll, QUOTE_POLL_MS);
  };
  setTimeout(poll, 20_000);
}

function multiplierNow(state: { multiplier: number; newMultiplier: number; newMultiplierEffectiveTimestamp: number }) {
  const at = state.newMultiplierEffectiveTimestamp;
  return at !== 0 && Date.now() / 1000 >= at ? state.newMultiplier : state.multiplier;
}
