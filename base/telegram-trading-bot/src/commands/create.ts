import { BotContext } from "../context";
import { generateWallet } from "../lib/wallet";
import { CommandHandler } from "../types/commands";
import { InlineKeyboard } from "grammy";
import { verifyEncryptionKey } from "../lib/encryption";

const createHandler: CommandHandler = {
  command: "create",
  description: "Create and save a new wallet",
  handler: async (ctx: BotContext) => {
    try {
      const userId = ctx.session.userId;

      if (!userId) {
        await ctx.reply("❌ Please start the bot first with /start command.");
        return;
      }

      // Verify encryption key is properly set
      if (!verifyEncryptionKey()) {
        await ctx.reply(
          "❌ Bot encryption key is not properly configured. Please contact the bot administrator."
        );
        return;
      }

      // Check if user already has a wallet
      const existingWallet = await ctx.session.walletAddress;

      if (existingWallet) {
        const keyboard = new InlineKeyboard()
          .text("Yes, create new wallet", "confirm_create_wallet")
          .text("No, keep current wallet", "cancel_create_wallet");

        await ctx.reply(
          "⚠️ You already have a wallet set up. Creating a new wallet will replace your current one.\n\n" +
            "*Make sure you have exported your private key if you want to keep access to your current wallet.*\n\n" +
            "Do you want to continue?",
          {
            parse_mode: "Markdown",
            reply_markup: keyboard,
          }
        );
        return;
      }

      // Create a new wallet
      await ctx.reply("🔐 Creating a new wallet for you...");

      const wallet = await generateWallet(userId);
      ctx.session.walletAddress = wallet.address;

      const keyboard = new InlineKeyboard()
        .text("🔑 Export Private Key", "export_key");

      await ctx.reply(
        `✅ *Wallet created successfully!*\n\n` +
          `*Address*: \`${wallet.address}\`\n\n` +
          `*Important*:\n` +
          `- This wallet is stored securely on our server\n` +
          `- Use /export to get your private key\n` +
          `- Store your private key somewhere safe\n` +
          `- Never share your private key with anyone\n\n` +
          `Now you can:\n` +
          `- Use /deposit to receive funds\n` +
          `- Use /balance to check your balance\n` +
          `- Use /buy to buy tokens with ETH`,
        {
          parse_mode: "Markdown",
          reply_markup: keyboard,
        }
      );
    } catch (error) {
      console.error("Error in create command:", error);
      await ctx.reply(
        "❌ An error occurred while creating your wallet. Please try again later."
      );
    }
  },
};

export default createHandler;
