import 'dotenv/config';

export interface AppConfig {
  endpoint?: string;
  token?: string;
  coins: string[];
  defaultCoin: string;
  bucketSizePct: number;
  port: number;
  demoMode: boolean;
  explicitDemoMode: boolean;
}

function csv(value: string | undefined, fallback: string[]): string[] {
  const parsed = value
    ?.split(',')
    .map((coin) => coin.trim().toUpperCase())
    .filter(Boolean);
  return parsed && parsed.length > 0 ? parsed : fallback;
}

export function loadConfig(): AppConfig {
  const coins = csv(process.env.TARGET_COINS, ['BTC', 'ETH', 'SOL']);
  const defaultCoin = (process.env.DEFAULT_COIN || coins[0] || 'BTC').trim().toUpperCase();
  const explicitDemoMode = process.env.DEMO_MODE === 'true';
  const missingCredentials = !process.env.QUICKNODE_GRPC_ENDPOINT || !process.env.QUICKNODE_GRPC_TOKEN;
  const demoMode = explicitDemoMode || missingCredentials;

  return {
    endpoint: process.env.QUICKNODE_GRPC_ENDPOINT,
    token: process.env.QUICKNODE_GRPC_TOKEN,
    coins,
    defaultCoin: coins.includes(defaultCoin) ? defaultCoin : coins[0],
    bucketSizePct: Number(process.env.BUCKET_SIZE_PCT || 0.75),
    port: Number(process.env.PORT || 8787),
    demoMode,
    explicitDemoMode,
  };
}
