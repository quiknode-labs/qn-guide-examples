import { startWebhookServer } from "./webhookServer";
import { getWalletBalance } from "./tradingBot";

async function main() {
  try {
    // Check initial balance
    const balance = await getWalletBalance();
    console.log(`💰 Current Balance: ${balance} BNB\n`);

    // Start webhook server
    startWebhookServer();
  } catch (error: any) {
    console.error("❌ Failed to start bot:", error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n👋 Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n👋 Shutting down gracefully...");
  process.exit(0);
});

main();
