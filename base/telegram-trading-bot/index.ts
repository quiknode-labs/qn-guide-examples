import { Bot, session, InlineKeyboard } from "grammy";
import dotenv from "dotenv";
import { BotContext, createInitialSessionData } from "./src/context";
import { initDatabase, closeDatabase } from "./src/lib/database";
import { verifyEncryptionKey } from "./src/lib/encryption";

// Import commands
import {startHandler, helpHandler} from "./src/commands/start-help";
import {walletHandler, createHandler} from "./src/commands/wallet";
import {importHandler, exportHandler, handlePrivateKeyInput, handleExportConfirmation } from "./src/commands/import-export";
import {balanceHandler, historyHandler, handleTimeframeChange} from "./src/commands/balance-history";
import buyHandler, {
  handleTokenSelection,
  handleCustomTokenInput,
  handleBuyAmountInput,
  handleBuyConfirmation,
} from "./src/commands/buy";
import sellHandler, {
  handleSellTokenSelection,
  handleSellCustomTokenInput,
  handleSellAmountInput,
  handleSellConfirmation,
} from "./src/commands/sell";
import settingsHandler, {
  handleSettingsOption,
  updateSlippage,
  updateGasPriority,
} from "./src/commands/settings";
import depositHandler from "./src/commands/deposit";
import withdrawHandler, {
  handleWithdrawAddress,
  handleWithdrawAmount,
  handleWithdrawConfirmation,
} from "./src/commands/withdraw";

// Load environment variables
dotenv.config();

// Initialize database
initDatabase();

// Verify encryption key is set
if (!verifyEncryptionKey()) {
  console.error(
    "⛔ ERROR: Wallet encryption key is not properly configured. Set a 32-character WALLET_ENCRYPTION_KEY in your .env file."
  );
  process.exit(1);
}

// Create bot instance
const bot = new Bot<BotContext>(process.env.TELEGRAM_BOT_TOKEN || "");

// Set up session middleware
bot.use(
  session({
    initial: createInitialSessionData,
  })
);

// Register command handlers
bot.command(startHandler.command, startHandler.handler);
bot.command(walletHandler.command, walletHandler.handler);
bot.command(createHandler.command, createHandler.handler);
bot.command(importHandler.command, importHandler.handler);
bot.command(exportHandler.command, exportHandler.handler);
bot.command(balanceHandler.command, balanceHandler.handler);
bot.command(historyHandler.command, historyHandler.handler);
bot.command(buyHandler.command, buyHandler.handler);
bot.command(sellHandler.command, sellHandler.handler);
bot.command(settingsHandler.command, settingsHandler.handler);
bot.command(depositHandler.command, depositHandler.handler);
bot.command(withdrawHandler.command, withdrawHandler.handler);
bot.command(helpHandler.command, helpHandler.handler);

bot.api.setMyCommands([
  { command: startHandler.command, description: startHandler.description },
  { command: walletHandler.command, description: walletHandler.description },
  { command: createHandler.command, description: createHandler.description },
  { command: importHandler.command, description: importHandler.description },
  { command: exportHandler.command, description: exportHandler.description },
  { command: balanceHandler.command, description: balanceHandler.description },
  { command: historyHandler.command, description: historyHandler.description },
  { command: buyHandler.command, description: buyHandler.description },
  { command: sellHandler.command, description: sellHandler.description },
  {
    command: settingsHandler.command,
    description: settingsHandler.description,
  },
  { command: depositHandler.command, description: depositHandler.description },
  {
    command: withdrawHandler.command,
    description: withdrawHandler.description,
  },
  { command: helpHandler.command, description: helpHandler.description },
]);

// Add cancel command
bot.command("cancel", async (ctx) => {
  if (ctx.session.currentAction) {
    ctx.session.currentAction = undefined;
    ctx.session.tempData = {};
    await ctx.reply("✅ Operation cancelled.");
  } else {
    await ctx.reply("There is no active operation to cancel.");
  }
});

// Handle callback queries
bot.on("callback_query:data", async (ctx) => {
  const callbackData = ctx.callbackQuery.data;

  // Confirmation callbacks
  if (callbackData === "confirm_yes") {
    switch (ctx.session.currentAction) {
      case "export_wallet":
        await handleExportConfirmation(ctx, true);
        break;
      case "buy_confirm":
        await handleBuyConfirmation(ctx, true);
        break;
      case "sell_confirm":
        await handleSellConfirmation(ctx, true);
        break;
      case "withdraw_confirm":
        await handleWithdrawConfirmation(ctx, true);
        break;
      default:
        await ctx.answerCallbackQuery("Unknown action");
    }
  } else if (callbackData === "confirm_no") {
    switch (ctx.session.currentAction) {
      case "export_wallet":
        await handleExportConfirmation(ctx, false);
        break;
      case "buy_confirm":
        await handleBuyConfirmation(ctx, false);
        break;
      case "sell_confirm":
        await handleSellConfirmation(ctx, false);
        break;
      case "withdraw_confirm":
        await handleWithdrawConfirmation(ctx, false);
        break;
      default:
        await ctx.answerCallbackQuery("Unknown action");
    }
  }

  // Main menu callbacks
  else if (callbackData === "check_balance") {
    await balanceHandler.handler(ctx);
  } else if (callbackData === "check_history") {
    await historyHandler.handler(ctx);
  } else if (callbackData === "buy_token") {
    await buyHandler.handler(ctx);
  } else if (callbackData === "sell_token") {
    await sellHandler.handler(ctx);
  } else if (callbackData === "open_settings") {
    await settingsHandler.handler(ctx);
  } else if (callbackData === "deposit") {
    await depositHandler.handler(ctx);
  } else if (callbackData === "withdraw") {
    await withdrawHandler.handler(ctx);
  } else if (callbackData === "help") {
    await helpHandler.handler(ctx);
  }

  // Token selection callbacks
  else if (callbackData.startsWith("token_")) {
    const tokenSymbol = callbackData.replace("token_", "");
    await handleTokenSelection(ctx, tokenSymbol);
  }

  // Sell token selection callbacks
  else if (callbackData.startsWith("sell_token_")) {
    const tokenAddress = callbackData.replace("sell_token_", "");
    await handleSellTokenSelection(ctx, tokenAddress);
  }

  // Settings callbacks
  else if (callbackData.startsWith("settings_")) {
    const option = callbackData.replace("settings_", "") as
      | "slippage"
      | "gasPriority"
      | "back";

    if (option === "back") {
      // Go back to main menu
      const keyboard = new InlineKeyboard()
        .text("💰 Balance", "check_balance")
        .text("📊 History", "check_history")
        .row()
        .text("💱 Buy Token", "buy_token")
        .text("💱 Sell Token", "sell_token")
        .row()
        .text("⚙️ Settings", "open_settings");

      await ctx.editMessageText(
        `🤖 *Base MEV-Protected Trading Bot*\n\n` +
          `What would you like to do?`,
        {
          parse_mode: "Markdown",
          reply_markup: keyboard,
        }
      );
    } else {
      await handleSettingsOption(ctx, option);
    }
  }

  // Slippage callbacks
  else if (callbackData.startsWith("slippage_")) {
    const slippage = parseFloat(callbackData.replace("slippage_", ""));
    await updateSlippage(ctx, slippage);
  }

  // Gas priority callbacks
  else if (callbackData.startsWith("gas_")) {
    const priority = callbackData.replace("gas_", "") as
      | "low"
      | "medium"
      | "high";
    await updateGasPriority(ctx, priority);
  }


  // // History view callbacks
  // else if (
  //   callbackData === "history_table"
  // ) {
  //   const viewType = callbackData.replace("history_", "") as "table";
  //   await handleHistoryViewChange(ctx, viewType);
  // }

  // History timeframe callbacks
  else if (
    callbackData.startsWith("history_") &&
    ["day", "week", "month"].includes(callbackData.replace("history_", ""))
  ) {
    const timeframe = callbackData.replace("history_", "") as
      | "day"
      | "week"
      | "month";
    await handleTimeframeChange(ctx, timeframe);
  }

  // Other callbacks
  else if (callbackData === "export_key") {
    await exportHandler.handler(ctx);
  } else if (callbackData === "create_wallet") {
    await createHandler.handler(ctx);
  } else if (callbackData === "import_wallet") {
    await importHandler.handler(ctx);
  } else if (callbackData === "confirm_create_wallet") {
    ctx.session.walletAddress = undefined;
    await createHandler.handler(ctx);
  } else if (callbackData === "cancel_create_wallet") {
    await ctx.answerCallbackQuery("Wallet creation cancelled");
    await ctx.editMessageText(
      "Operation cancelled. Your existing wallet remains unchanged."
    );
  } else if (callbackData === "confirm_import_wallet") {
    ctx.session.walletAddress = undefined;
    await importHandler.handler(ctx);
  } else if (callbackData === "cancel_import_wallet") {
    await ctx.answerCallbackQuery("Wallet import cancelled");
    await ctx.editMessageText(
      "Operation cancelled. Your existing wallet remains unchanged."
    );
  } else {
    await ctx.answerCallbackQuery("Unknown command");
  }
});

// Handle text messages (for inputs during workflows)
bot.on("message:text", async (ctx) => {
  // Skip commands
  if (ctx.message.text.startsWith("/")) return;

  switch (ctx.session.currentAction) {
    case "import_wallet":
      await handlePrivateKeyInput(ctx);
      break;
    case "buy_custom_token":
      await handleCustomTokenInput(ctx);
      break;
    case "buy_amount":
      await handleBuyAmountInput(ctx);
      break;
    case "sell_custom_token":
      await handleSellCustomTokenInput(ctx);
      break;
    case "sell_amount":
      await handleSellAmountInput(ctx);
      break;
    case "withdraw_address":
      await handleWithdrawAddress(ctx);
      break;
    case "withdraw_amount":
      await handleWithdrawAmount(ctx);
      break;
    default:
      // If no current action, but message received, show help
      if (!ctx.session.currentAction) {
        const keyboard = new InlineKeyboard()
          .text("💰 Balance", "check_balance")
          .text("💱 Buy/Sell", "buy_token")
          .row()
          .text("📥 Deposit", "deposit")
          .text("📤 Withdraw", "withdraw");

        await ctx.reply(
          "🤖 Hello! Here are some things you can do:\n\n" +
            "/wallet - View your wallet\n" +
            "/balance - Check your balances\n" +
            "/buy - Buy tokens with ETH\n" +
            "/sell - Sell tokens for ETH\n" +
            "/deposit - Get your deposit address\n" +
            "/withdraw - Withdraw ETH to another address\n" +
            "/settings - Change trading settings\n" +
            "/help - Show this help message",
          { reply_markup: keyboard }
        );
      }
      break;
  }
});

// Help command
bot.command("help", async (ctx) => {
  await ctx.reply(
    "🤖 *Base MEV-Protected Trading Bot Help*\n\n" +
      "*Wallet Commands:*\n" +
      "/start - Start the bot and register\n" +
      "/wallet - Show wallet address and type\n" +
      "/create - Create a new wallet\n" +
      "/import - Import wallet via private key\n" +
      "/export - Display private key (with confirmation)\n\n" +
      "*Balance Commands:*\n" +
      "/balance - Show current token balances\n" +
      "/history - Display balance history\n\n" +
      "*Trading Commands:*\n" +
      "/buy - Buy tokens with ETH\n" +
      "/sell - Sell tokens for ETH\n" +
      "/settings - Change slippage, gas, approvals\n\n" +
      "*Transfer Commands:*\n" +
      "/deposit - Show your deposit address\n" +
      "/withdraw - Withdraw ETH to another address\n\n" +
      "*Other Commands:*\n" +
      "/cancel - Cancel current operation\n" +
      "/help - Show this help message",
    { parse_mode: "Markdown" }
  );
});

// Handle errors
bot.catch((err) => {
  console.error("Bot error occurred:", err);
});

// Start the bot
const startBot = async () => {
  console.log("🤖 Starting Base MEV-Protected Telegram Trading Bot...");

  try {
    // Start bot
    await bot.start();
    console.log("✅ Bot started successfully!");

    // Log info
    console.log("ℹ️  Press Ctrl+C to stop the bot");
  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Stopping bot...");
  await bot.stop();
  closeDatabase();
  console.log("👋 Bot stopped. Goodbye!");
  process.exit(0);
});

// Start the bot
startBot();
