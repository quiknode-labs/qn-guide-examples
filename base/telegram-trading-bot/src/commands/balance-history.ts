import { BotContext } from "../context";
import { getWallet, getEthBalance } from "../lib/token-wallet";
import {
  getTokenBalance,
  getBalanceHistory,
  formatBalanceHistoryTable,
} from "../lib/history";
import { getUniqueTokensByUserId } from "../lib/database";
import { formatBalanceMessage } from "../utils/formatters";
import { CommandHandler } from "../types/commands";
import { TokenInfo } from "../types/config";
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

      // Get token balances from Blockbook API
      const tokenData = await getTokenBalance(wallet.address);

      // Get list of tokens this user has interacted with
      const interactedTokens = getUniqueTokensByUserId(userId).map((t) =>
        t.toLowerCase()
      );

      // Extract relevant token info
      const tokens: TokenInfo[] = [];

      if (tokenData && tokenData.tokens && Array.isArray(tokenData.tokens)) {
        for (const token of tokenData.tokens) {
          // Only include tokens with non-zero balance and that the user has interacted with
          if (token.type === "ERC20") {
            if (
              BigInt(token.balance) > BigInt(0) &&
              interactedTokens.includes(token.contract.toLowerCase())
            ) {
              tokens.push({
                address: token.contract,
                symbol: token.symbol,
                decimals: token.decimals,
                balance: token.balance,
              });
            }
          }
        }
      }

      // Create actions keyboard
      const keyboard = new InlineKeyboard()
        .text("📈 View History", "check_history")
        .text("📥 Deposit", "deposit")
        .row()
        .text("💱 Buy Token", "buy_token")
        .text("💱 Sell Token", "sell_token")
        .row()
        .text("📤 Withdraw", "withdraw");

      // Format and send balance message
      const message = formatBalanceMessage(ethBalance, tokens);

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

// Handler for balance history
export const historyHandler: CommandHandler = {
  command: "history",
  description: "Display 1-month balance history as a table",
  handler: async (ctx: BotContext) => {
    try {
      const userId = ctx.session.userId;

      if (!userId) {
        await ctx.reply("❌ Please start the bot first with /start command.");
        return;
      }

      const wallet = await getWallet(userId);

      if (!wallet) {
        await ctx.reply(
          "❌ You don't have a wallet yet.\n\n" +
            "Use /create to create a new wallet or /import to import an existing one."
        );
        return;
      }

      await ctx.reply("⏳ Fetching your balance history...");

      const history = await getBalanceHistory(wallet.address, "month");

      if (history.length === 0) {
        await ctx.reply(
          "📊 *No Balance History*\n\n" +
            "There is no balance history available for your wallet yet.\n\n" +
            "This could be because:\n" +
            "- Your wallet is new\n" +
            "- You haven't had any transactions\n" +
            "- The history data is still being indexed\n\n" +
            "Check back later after making some transactions.",
          { parse_mode: "Markdown" }
        );
        return;
      }

      // Store history in session for future timeframe switching
      ctx.session.tempData = {
        history,
        timeframe: "month",
      };

      // Create keyboard with timeframe options only
      const keyboard = new InlineKeyboard()
        .text("📆 Day", "history_day")
        .text("📆 Week", "history_week")
        .text("📆 Month", "history_month");

      const table = formatBalanceHistoryTable(history);

      await ctx.reply(table, {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      });
    } catch (error) {
      console.error("Error in history command:", error);
      await ctx.reply(
        "❌ An error occurred while fetching your balance history. Please try again later."
      );
    }
  },
};

// Handle timeframe change only (no view switch anymore)
export async function handleTimeframeChange(
  ctx: BotContext,
  timeframe: "day" | "week" | "month"
): Promise<void> {
  try {
    const userId = ctx.session.userId;
    const wallet = await getWallet(userId!);

    if (!wallet) {
      await ctx.answerCallbackQuery("Wallet not found");
      return;
    }

    await ctx.answerCallbackQuery(`Fetching ${timeframe} history...`);

    const history = await getBalanceHistory(wallet.address, timeframe);

    if (history.length === 0) {
      await ctx.answerCallbackQuery(
        "No history data available for this timeframe"
      );
      return;
    }

    ctx.session.tempData = {
      history,
      timeframe,
    };

    const keyboard = new InlineKeyboard()
      .text("📆 Day", "history_day")
      .text("📆 Week", "history_week")
      .text("📆 Month", "history_month");

    const message = formatBalanceHistoryTable(history);

    await ctx.editMessageText(message, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  } catch (error) {
    console.error("Error handling timeframe change:", error);
    await ctx.answerCallbackQuery("An error occurred. Please try again.");
  }
}
