import { InlineKeyboard } from "grammy";
import { BotContext } from "../context";
import {
  createUser,
  getUserByTelegramId,
  getUserSettings,
  saveUserSettings,
} from "../lib/database";
import { CommandHandler } from "../types/commands";

// Start handler
export const startHandler: CommandHandler = {
  command: "start",
  description: "Start the bot and register user",
  handler: async (ctx: BotContext) => {
    try {
      const userId = ctx.from?.id.toString();

      if (!userId) {
        await ctx.reply("❌ Unable to identify user. Please try again later.");
        return;
      }

      // Set user ID in session
      ctx.session.userId = userId;

      // Check if user already exists
      const existingUser = getUserByTelegramId(userId);

      if (!existingUser) {
        // Register new user
        createUser(
          userId,
          userId,
          ctx.from?.username,
          ctx.from?.first_name,
          ctx.from?.last_name
        );

        // Create default settings
        saveUserSettings(userId, {
          slippage: 1.0,
          gasPriority: "medium",
        });

        // Welcome message for new users
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
      } else {
        // Get user settings
        const settings = getUserSettings(userId);

        if (settings) {
          ctx.session.settings = settings;
        }

        // Welcome back message for existing users
        const keyboard = new InlineKeyboard()
          .text("💰 Balance", "check_balance")
          .text("📊 History", "check_history")
          .row()
          .text("💱 Buy Token", "buy_token")
          .text("💱 Sell Token", "sell_token")
          .row()
          .text("⚙️ Settings", "open_settings")
          .text("📋 Help", "help");

        await ctx.reply(
          `🤖 *Welcome back to Base MEV-Protected Trading Bot!*\n\n` +
            `What would you like to do today?`,
          {
            parse_mode: "Markdown",
            reply_markup: keyboard,
          }
        );
      }
    } catch (error) {
      console.error("Error in start command:", error);
      await ctx.reply("❌ An error occurred. Please try again later.");
    }
  },
};

// Help handler
export const helpHandler: CommandHandler = {
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
