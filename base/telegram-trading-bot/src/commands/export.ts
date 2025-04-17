import { BotContext } from "../context";
import { getWallet, getAccount, getPrivateKey } from "../lib/wallet";
import { CommandHandler } from "../types/commands";
import { createConfirmationKeyboard } from "../utils/keyboardHelper";

const exportHandler: CommandHandler = {
  command: "export",
  description: "Display private key (with confirmation prompt)",
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

      // Set current action
      ctx.session.currentAction = "export_wallet";

      // Show warning and confirmation prompt
      await ctx.reply(
        "⚠️ *SECURITY WARNING*\n\n" +
          "You are about to export your private key. This is sensitive information that gives complete control over your wallet funds.\n\n" +
          "*NEVER*:\n" +
          "- Share your private key with anyone\n" +
          "- Enter it on websites\n" +
          "- Take screenshots of it\n\n" +
          "Are you sure you want to proceed?",
        {
          parse_mode: "Markdown",
          reply_markup: createConfirmationKeyboard(),
        }
      );
    } catch (error) {
      console.error("Error in export command:", error);
      await ctx.reply("❌ An error occurred. Please try again later.");
    }
  },
};

// Handle export confirmation
export async function handleExportConfirmation(
  ctx: BotContext,
  confirmed: boolean
): Promise<void> {
  try {
    // Remove the confirmation keyboard
    await ctx.editMessageReplyMarkup({ reply_markup: undefined });

    if (!confirmed) {
      await ctx.reply(
        "Operation cancelled. Your private key was not exported."
      );
      return;
    }

    const userId = ctx.session.userId;

    if (!userId) {
      await ctx.reply("❌ Session expired. Please use /start to begin again.");
      return;
    }

    // Get user's wallet
    const wallet = await getWallet(userId);

    if (!wallet) {
      await ctx.reply(
        "❌ Wallet not found. Please create or import a wallet first."
      );
      return;
    }

    // Extract private key
    const privateKey = getPrivateKey(wallet)

    // Send private key in a separate message that auto-deletes after 60 seconds
    await ctx.reply(
      "🔑 *Your Private Key*\n\n" +
        `\`${privateKey}\`\n\n`,
      {
        parse_mode: "Markdown",
      }
    );

    // Send follow-up reminder about security
    await ctx.reply(
      "⚠️ *REMINDER*\n\n" +
        "Your private key has been displayed. For security:\n\n" +
        "1. Save it in a secure password manager\n" +
        "2. Never share it with anyone\n" +
        "3. Delete any chat history containing this key",
      {
        parse_mode: "Markdown",
      }
    );

    // Reset current action
    ctx.session.currentAction = undefined;
  } catch (error) {
    console.error("Error handling export confirmation:", error);
    await ctx.reply(
      "❌ An error occurred while exporting your private key. Please try again later."
    );
  }
}

export default exportHandler;
