import dotenv from "dotenv";
import { Address } from "viem";

dotenv.config();

// Endpoints
export const QUICKNODE_RPC_URL = process.env.QUICKNODE_RPC || "";
export const OPENOCEAN_ADDON_ID = "807"; // Example - replace with actual ID
export const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || "";

// Base mainnet constants
export const BASE_CHAIN_ID = "8453";

// Native token (ETH) address on Base
export const NATIVE_TOKEN_ADDRESS =
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

// Common token addresses on Base
export const COMMON_TOKENS: Record<string, Address> = {
  ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  WETH: "0x4200000000000000000000000000000000000006",
  CBETH: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
  WBTC: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
};

// Gas priority settings
export const GAS_PRIORITY = {
  low: 90,
  medium: 95,
  high: 99,
};

// Default slippage tolerance
export const DEFAULT_SLIPPAGE = 1.0; // 1%

// Confirmation timeout (ms)
export const CONFIRMATION_TIMEOUT = 60000; // 1 minute

// Maximum approve amount
export const MAX_UINT256 =
  "115792089237316195423570985008687907853269984665640564039457584007913129639935";


export const DB_PATH = process.env.DB_PATH || "./database.sqlite";

// Database tables
export const DB_TABLES = {
  USERS: "users",
  WALLETS: "wallets",
  SETTINGS: "settings",
  TRANSACTIONS: "transactions",
};

