import express, { Request, Response } from "express";
import crypto from "crypto";
import { config } from "./config";
import { executeCopyTrade, getWalletBalance } from "./tradingBot";

const app = express();

// Parse raw body for HMAC verification
app.use(express.json({ limit: "10mb" }));
app.use(express.raw({ type: "application/json", limit: "10mb" }));

/**
 * Verify HMAC signature from Quicknode
 */
function verifyHMAC(
  payload: string,
  nonce: string,
  timestamp: string,
  signature: string
): boolean {
  if (!config.quicknodeSecurityToken) {
    return true; // Skip verification if token not configured
  }

  const message = nonce + timestamp + payload;
  const hmac = crypto.createHmac("sha256", config.quicknodeSecurityToken);
  hmac.update(message);
  const computed = hmac.digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(computed, "hex"),
    Buffer.from(signature, "hex")
  );
}

/**
 * Webhook endpoint to receive trade notifications
 */
app.post("/webhook", async (req: Request, res: Response) => {
  try {
    // Extract security headers
    const nonce = req.headers["x-qn-nonce"] as string;
    const timestamp = req.headers["x-qn-timestamp"] as string;
    const signature = req.headers["x-qn-signature"] as string;

    // Get payload
    const payload =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    // Verify HMAC signature
    if (
      config.quicknodeSecurityToken &&
      !verifyHMAC(payload, nonce, timestamp, signature)
    ) {
      console.error("❌ HMAC verification failed");
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Parse payload
    const data = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    // Immediately respond to prevent retry
    res.status(200).json({ status: "received" });

    // Process trades asynchronously
    if (data.trades && data.trades.length > 0) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🚨 New Webhook Received - ${new Date().toISOString()}`);
      console.log(`${"=".repeat(60)}`);

      for (const trade of data.trades) {
        await executeCopyTrade(trade);
      }
    }
  } catch (error: any) {
    console.error("❌ Webhook processing error:", error.message);
  }
});

/**
 * Health check endpoint
 */
app.get("/health", async (req: Request, res: Response) => {
  try {
    const balance = await getWalletBalance();
    res.json({
      status: "healthy",
      balance: `${balance} BNB`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ status: "unhealthy" });
  }
});

/**
 * Start the webhook server
 */
export function startWebhookServer(): void {
  app.listen(config.port, () => {
    console.log("\n" + "=".repeat(60));
    console.log("🚀 BNB Chain Copytrading Bot Started");
    console.log("=".repeat(60));
    console.log(`📡 Webhook URL: http://localhost:${config.port}/webhook`);
    console.log(`💚 Health Check: http://localhost:${config.port}/health`);
    console.log(`🎯 Target Contract: ${config.contractAddress}`);
    console.log(`📊 Copy Multiplier: ${config.copyTradeMultiplier * 100}%`);
    console.log(`⚡ Max Trade Amount: ${config.maxTradeAmount} BNB`);
    console.log("=".repeat(60) + "\n");
  });
}
