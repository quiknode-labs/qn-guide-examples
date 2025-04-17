import { BotContext } from "../context";
import { importWallet } from "../lib/wallet";
import { CommandHandler } from "../types/commands";
import { isValidPrivateKey } from "../utils/validators";
import { InlineKeyboard } from "grammy";

const importHandler: CommandHandler = {
  command: "import",
  description: "Import wallet via private key",
  handler: async (ctx: BotContext) => {
    try {
      const userId = ctx.session.userId;

      if (!userId) {
        await ctx.reply("❌ Please start the bot first with /start command.");
        return;
      }

      // Check if user already has a wallet
      const existingWallet = await ctx.session.walletAddress;

      if (existingWallet) {
        const keyboard = new InlineKeyboard()
          .text("Yes, import new wallet", "confirm_import_wallet")
          .text("No, keep current wallet", "cancel_import_wallet");

        await ctx.reply(
          "⚠️ You already have a wallet set up. Importing a new wallet will replace your current one.\n\n" +
            "*Make sure you have exported your private key if you want to keep access to your current wallet.*\n\n" +
            "Do you want to continue?",
          {
            parse_mode: "Markdown",
            reply_markup: keyboard,
          }
        );
        return;
      }

      // Set current action
      ctx.session.currentAction = "import_wallet";

      await ctx.reply(
        "🔑 Please send your private key.\n\n" +
          "*For security reasons*:\n" +
          "- Private keys are stored encrypted\n" +
          "- You can delete this message after I process it\n" +
          "- Never share your private key with anyone else\n" +
          "- You can cancel this operation by typing /cancel",
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      console.error("Error in import command:", error);
      await ctx.reply("❌ An error occurred. Please try again later.");
    }
  },
};

// Handler for private key input
export async function handlePrivateKeyInput(ctx: BotContext): Promise<void> {
  try {
    const userId = ctx.session.userId;
    const privateKey = ctx.message?.text;

    if (!userId || !privateKey) {
      await ctx.reply("❌ Invalid request. Please try again.");
      return;
    }

    // Validate private key format
    if (!isValidPrivateKey(privateKey)) {
      await ctx.reply(
        "❌ Invalid private key format. Please provide a valid 64-character hexadecimal private key with or without 0x prefix.\n\n" +
          "Try again or type /cancel to abort."
      );
      return;
    }

    await ctx.reply("🔐 Importing your wallet...");

    // Import the wallet
    const wallet = await importWallet(userId, privateKey);
    ctx.session.walletAddress = wallet.address;

    // Reset current action
    ctx.session.currentAction = undefined;

    const keyboard = new InlineKeyboard()
      .text("💰 Check Balance", "check_balance");

    await ctx.reply(
      `✅ *Wallet imported successfully!*\n\n` +
        `*Address*: \`${wallet.address}\`\n\n` +
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
    console.error("Error handling private key input:", error);
    ctx.session.currentAction = undefined;
    await ctx.reply(
      "❌ An error occurred while importing your wallet. Please try again later."
    );
  }
}

export default importHandler;
