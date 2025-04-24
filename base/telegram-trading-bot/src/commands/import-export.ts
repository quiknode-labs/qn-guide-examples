import { BotContext } from "../context";
import { importWallet, getWallet, getPrivateKey } from "../lib/token-wallet";
import { CommandHandler } from "../types/commands";
import { isValidPrivateKey } from "../utils/validators";
import { InlineKeyboard } from "grammy";
import { createConfirmationKeyboard } from "../utils/keyboardHelper";


export const importHandler: CommandHandler = {
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
          "- Private keys are stored in an encrypted format\n" +
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

export const exportHandler: CommandHandler = {
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
    const privateKey = getPrivateKey(wallet);

    // Send private key in a separate message that auto-deletes after 60 seconds
    await ctx.reply("🔑 *Your Private Key*\n\n" + `\`${privateKey}\`\n\n`, {
      parse_mode: "Markdown",
    });

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
