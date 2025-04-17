import { BotContext } from "../context";
import { getWallet } from "../lib/wallet";
import { getBalanceHistory, formatBalanceHistoryTable } from "../lib/history";
import { CommandHandler } from "../types/commands";
import { InlineKeyboard } from "grammy";

const historyHandler: CommandHandler = {
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

export default historyHandler;
