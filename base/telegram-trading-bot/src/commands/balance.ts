import { BotContext } from "../context";
import { getWallet, getEthBalance } from "../lib/wallet";
import { getTokenBalance } from "../lib/history";
import { getUniqueTokensByUserId } from "../lib/database";
import { formatBalanceMessage } from "../utils/formatters";
import { CommandHandler } from "../types/commands";
import { TokenInfo } from "../types/config";
import { InlineKeyboard } from "grammy";

const balanceHandler: CommandHandler = {
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

export default balanceHandler;
