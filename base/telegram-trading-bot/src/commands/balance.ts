import { BotContext } from "../context";
import { getWallet, getEthBalance } from "../lib/token-wallet";
import { formatBalanceMessage } from "../utils/formatters";
import { CommandHandler } from "../types/commands";
import { InlineKeyboard } from "grammy";

// Handler for balance command
export const balanceHandler: CommandHandler = {
  command: "balance",
  description: "Show current ETH + filtered ERC-20 balances",
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
        await ctx.reply(
          "❌ You don't have a wallet yet.\n\n" +
            "Use /create to create a new wallet or /import to import an existing one."
        );
        return;
      }

      await ctx.reply("⏳ Fetching your balances...");

      // Get ETH balance
      const ethBalance = await getEthBalance(wallet.address);

      // Create actions keyboard
      const keyboard = new InlineKeyboard()
        .text("📥 Deposit", "deposit")
        .row()
        .text("💱 Buy Token", "buy_token")
        .text("💱 Sell Token", "sell_token")
        .row()
        .text("📤 Withdraw", "withdraw");

      // Format and send balance message
      const message = formatBalanceMessage(ethBalance);

      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      });
    } catch (error) {
      console.error("Error in balance command:", error);
      await ctx.reply(
        "❌ An error occurred while fetching your balances. Please try again later."
      );
    }
  },
};

