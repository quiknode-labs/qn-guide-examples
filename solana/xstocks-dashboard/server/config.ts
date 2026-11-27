// Runtime configuration. Secrets come from .env and are never logged.
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Add it to .env in the project root.`);
  return value;
}

export const config = {
  grpcEndpoint: required("QN_GRPC_ENDPOINT"),
  grpcToken: required("QN_GRPC_TOKEN"),
  rpcUrl: required("QN_RPC_URL"),
  port: Number(process.env.PORT ?? 8787),
  /** Optional. A key from portal.jup.ag moves Jupiter calls to api.jup.ag with higher rate limits. */
  jupApiKey: process.env.JUP_API_KEY || undefined,
};

/** Backed's xStocks issuer. Mint authority of every xStocks mint on Solana. */
export const ISSUER = "7pt9tkctJPK7PPNQJ77GKg8ZffSF6QxoMiCFYHxrtaCj";
export const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
export const WSOL = "So11111111111111111111111111111111111111112";
/** Dollar stablecoins valued at $1 when they are the other side of a trade. */
export const USD_STABLES = new Set([
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
]);
export const STABLE_DECIMALS = 6;

export const DAY_MS = 24 * 60 * 60 * 1000;
/** Hard cap on stored events, so memory stays flat during long runs. */
export const MAX_EVENTS = 300_000;
/** Seconds between premium samples. 24h at 15s is 5,760 points per ticker. */
export const SAMPLE_SECONDS = 15;
export const MAX_SAMPLES = (24 * 60 * 60) / SAMPLE_SECONDS;
export const REGISTRY_REFRESH_MS = 10 * 60 * 1000;
/**
 * Jupiter's stockData updates about once a minute, so polling faster only buys earlier pickup
 * of each update. Without a key, poll gently to stay well under the keyless rate limit.
 */
export const PRICE_POLL_MS = config.jupApiKey ? 10_000 : 30_000;
export const QUOTE_POLL_MS = 60_000;
/**
 * While the US market is open, a reference older than this may trail the stock, so the premium
 * can include price movement rather than a real gap. The UI marks it as approximate.
 */
export const REF_AGING_MS = 30_000;
/** A reference price older than this is stale and the premium is greyed out. */
export const REF_STALE_MS = 5 * 60_000;

export const DISCLAIMER =
  "This dashboard is for educational purposes only. Quicknode does not provide financial advice or endorse any trading strategies. Always do your own research before making any investment decisions.";
