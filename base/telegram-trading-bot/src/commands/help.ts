import { BotContext } from "../context";
import { CommandHandler } from "../types/commands";

const helpHandler: CommandHandler = {
  command: "help",
  description: "Show help information and available commands",
  handler: async (ctx: BotContext) => {
    try {
      await ctx.reply(
        `🤖 *Welcome to Base MEV-Protected Trading Bot!*\n\n` +
          `Trade ERC-20 tokens with MEV protection on the Base Network.\n\n` +
          `🧱 *Getting Started*\n` +
          `- /create — Create a new wallet\n` +
          `- /import — Import an existing wallet\n\n` +
          `💼 *Wallet Management*\n` +
          `- /wallet — View your wallet address and type\n` +
          `- /deposit — Get your deposit address\n` +
          `- /withdraw — Withdraw ETH to another address\n` +
          `- /balance — Check your current token balances\n` +
          `- /history — View your balance history\n` +
          `- /export — Export your private key\n\n` +
          `📈 *Trading Commands*\n` +
          `- /buy — Buy tokens with ETH\n` +
          `- /sell — Sell tokens for ETH\n` +
          `⚙️ *Settings & Info*\n` +
          `- /settings — Configure your trading preferences\n` +
          `- /help — Show this help message\n\n` +
          `🛠 *Tip:* Start by creating or importing a wallet, then deposit ETH to begin trading.`,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      console.error("Error in help command:", error);
      await ctx.reply(
        "❌ An error occurred while displaying help. Please try again later."
      );
    }
  },
};

export default helpHandler;
