import { BotContext } from "../context";
import { getWallet } from "../lib/wallet";
import { formatAddress } from "../utils/formatters";
import { CommandHandler } from "../types/commands";
import { InlineKeyboard } from "grammy";

const walletHandler: CommandHandler = {
  command: "wallet",
  description: "Show wallet address and type",
  handler: async (ctx: BotContext) => {
    try {
      const userId = ctx.session.userId;

      if (!userId) {
        await ctx.reply("❌ Please start the bot first with /start command.");
        return;
      }

      // Get user's wallet
      const wallet = await getWallet(userId);

      if (!wallet) {
        const keyboard = new InlineKeyboard()
          .text("Create Wallet", "create_wallet")
          .text("Import Wallet", "import_wallet");

        await ctx.reply(
          "❌ You don't have a wallet yet.\n\nYou can create a new wallet or import an existing one:",
          { reply_markup: keyboard }
        );
        return;
      }

      // Set wallet address in session
      ctx.session.walletAddress = wallet.address;

      // Create keyboard with wallet actions
      const keyboard = new InlineKeyboard()
        .text("🔑 Export Key", "export_key")
        .row()
        .text("💰 Check Balance", "check_balance")
        .text("📥 Deposit", "deposit")
        .row()
        .text("📤 Withdraw", "withdraw");

      await ctx.reply(
        `💼 *Your Wallet*\n\n` +
          `*Address*: \`${wallet.address}\`\n` +
          `*Type*: ${
            wallet.type === "generated" ? "Generated" : "Imported"
          }\n` +
          `*Created*: ${new Date(wallet.createdAt).toLocaleDateString()}\n\n` +
          `Choose an action below or use one of these commands:\n` +
          `- /balance - Check your token balances\n` +
          `- /deposit - Show your deposit address\n` +
          `- /withdraw - Withdraw ETH to another address\n` +
          `- /buy - Buy tokens with ETH\n` +
          `- /sell - Sell tokens for ETH`,
        {
          parse_mode: "Markdown",
          reply_markup: keyboard,
        }
      );
    } catch (error) {
      console.error("Error in wallet command:", error);
      await ctx.reply("❌ An error occurred. Please try again later.");
    }
  },
};

export default walletHandler;
