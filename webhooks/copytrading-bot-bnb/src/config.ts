import dotenv from "dotenv";
import { Address } from "viem";
dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || "3000"),
  quicknodeSecurityToken: process.env.QUICKNODE_SECURITY_TOKEN || "",

  // Blockchain configuration
  rpcUrl: process.env.BNB_RPC_URL || "https://bsc-dataseed.binance.org",
  privateKey: process.env.PRIVATE_KEY as Address,

  // Trading configuration
  contractAddress:
    "0x5c952063c7fc8610FFDB798152D69F0B9550762b" as Address,
  minCopyTradeAmount: parseFloat(process.env.MIN_COPY_TRADE_AMOUNT || "0.01"), // BNB
  copyTradeMultiplier: parseFloat(process.env.COPY_TRADE_MULTIPLIER || "0.1"), // 10% of whale's trade
  slippageTolerance: parseFloat(process.env.SLIPPAGE_TOLERANCE || "5"), // 5%

  // Safety limits
  maxTradeAmount: parseFloat(process.env.MAX_TRADE_AMOUNT || "0.5"), // Max 0.5 BNB per trade
  minBalance: parseFloat(process.env.MIN_BALANCE || "0.05"), // Keep 0.05 BNB reserve
};

// Validation
if (!config.privateKey) {
  throw new Error("PRIVATE_KEY is required in .env file");
}

if (!config.quicknodeSecurityToken) {
  console.warn(
    "⚠️  QUICKNODE_SECURITY_TOKEN not set - HMAC verification disabled"
  );
}
