import { BotContext } from "../context";
import { getWallet } from "../lib/token-wallet";
import { CommandHandler } from "../types/commands";
import { InlineKeyboard } from "grammy";

const depositHandler: CommandHandler = {
  command: "deposit",
  description: "Display your wallet address for deposits",
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
          "❌ You don't have a wallet yet.\n\n" +
            "You need to create or import a wallet first:",
          { reply_markup: keyboard }
        );
        return;
      }

      // Send deposit information
      await ctx.reply(
        `📥 *Deposit ETH or Tokens*\n\n` +
          `Send ETH or any ERC-20 token to your wallet address on Base Network:\n\n` +
          `\`${wallet.address}\`\n\n` +
          `*Important*:\n` +
          `- Only send assets on the Base Network\n` +
          `- ETH deposits usually confirm within minutes\n` +
          `- Use /balance to check when funds arrive\n` +
          `- Never share your private key with anyone`,
        {
          parse_mode: "Markdown",
        }
      );

    } catch (error) {
      console.error("Error in deposit command:", error);
      await ctx.reply("❌ An error occurred. Please try again later.");
    }
  },
};

export default depositHandler;
