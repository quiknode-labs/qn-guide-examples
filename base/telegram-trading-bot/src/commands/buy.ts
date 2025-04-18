import { BotContext } from "../context";
import {
  getTokenInfo,
  getTokenAddressFromSymbol, getWallet,
  getEthBalance,
  executeTransaction,
} from "../lib/token-wallet";
import { getQuote, getSwap, getGasParams } from "../lib/swap";
import {
  formatEthBalance,
  formatTransactionDetails,
} from "../utils/formatters";
import { isValidAddress, isValidAmount } from "../utils/validators";
import {
  createConfirmationKeyboard,
  createTokenSelectionKeyboard,
} from "../utils/keyboardHelper";
import { CommandHandler } from "../types/commands";
import { saveTransaction } from "../lib/database";
import { NATIVE_TOKEN_ADDRESS } from "../utils/constants";
import { parseEther, formatEther, formatUnits, Address } from "viem";

const buyHandler: CommandHandler = {
  command: "buy",
  description: "Buy ERC-20 tokens with ETH",
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

      // Check ETH balance
      const balance = await getEthBalance(wallet.address);

      if (BigInt(balance) <= BigInt(0)) {
        await ctx.reply(
          "❌ Your wallet has no ETH balance to buy tokens.\n\n" +
            "Use /deposit to get your deposit address and add ETH first."
        );
        return;
      }

      // Set current action
      ctx.session.currentAction = "buy_token";

      // Initialize trading data
      ctx.session.tempData = {
        fromToken: NATIVE_TOKEN_ADDRESS,
        fromSymbol: "ETH",
        fromDecimals: 18,
        walletAddress: wallet.address,
        balance,
      };

      // Show common tokens or ask for custom token
      await ctx.reply(
        `💱 *Buy Tokens with ETH*\n\n` +
          `Your ETH balance: ${formatEthBalance(balance)} ETH\n\n` +
          `Select a token to buy or choose "Custom Token" to enter a specific token address:`,
        {
          parse_mode: "Markdown",
          reply_markup: createTokenSelectionKeyboard(),
        }
      );
    } catch (error) {
      console.error("Error in buy command:", error);
      await ctx.reply("❌ An error occurred. Please try again later.");
    }
  },
};

// Handle token selection
export async function handleTokenSelection(
  ctx: BotContext,
  tokenSymbol: string
): Promise<void> {
  try {
    if (tokenSymbol === "custom") {
      // User wants to enter a custom token address
      ctx.session.currentAction = "buy_custom_token";

      await ctx.editMessageText(
        `💱 *Buy Custom Token*\n\n` +
          `Please send the ERC-20 token address you want to buy.\n\n` +
          `The address should look like: 0x1234...5678\n\n` +
          `You can cancel this operation by typing /cancel`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Get token address from symbol
    const tokenAddress = getTokenAddressFromSymbol(tokenSymbol);

    if (!tokenAddress) {
      await ctx.answerCallbackQuery("❌ Token symbol not recognized.");
      return;
    }

    // Get token info
    const tokenInfo = await getTokenInfo(tokenAddress);

    if (!tokenInfo) {
      await ctx.answerCallbackQuery(
        "❌ Unable to get token information. Please try again."
      );
      return;
    }

    // Update session data
    ctx.session.tempData!.toToken = tokenInfo.address;
    ctx.session.tempData!.toSymbol = tokenInfo.symbol;
    ctx.session.tempData!.toDecimals = tokenInfo.decimals;

    // Move to amount input
    ctx.session.currentAction = "buy_amount";

    await ctx.editMessageText(
      `💱 *Buy ${tokenInfo.symbol}*\n\n` +
        `You are buying ${tokenInfo.symbol} with ETH.\n\n` +
        `Your ETH balance: ${formatEthBalance(
          ctx.session.tempData!.balance
        )} ETH\n\n` +
        `Please enter the amount of ETH you want to spend:`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Error handling token selection:", error);
    await ctx.answerCallbackQuery("❌ An error occurred. Please try again.");
  }
}

// Handle custom token address input
export async function handleCustomTokenInput(ctx: BotContext): Promise<void> {
  try {
    const userId = ctx.session.userId;
    const tokenAddress = ctx.message?.text;

    if (!userId || !tokenAddress) {
      await ctx.reply("❌ Invalid request. Please try again.");
      return;
    }

    // Validate address format
    if (!isValidAddress(tokenAddress)) {
      await ctx.reply(
        "❌ Invalid token address format. Please provide a valid Ethereum address.\n\n" +
          "Try again or type /cancel to abort."
      );
      return;
    }

    // Get token info
    const tokenInfo = await getTokenInfo(tokenAddress as Address);

    if (!tokenInfo) {
      await ctx.reply(
        "❌ Unable to get information for this token. It might not be a valid ERC-20 token on Base Network.\n\n" +
          "Please check the address and try again or type /cancel to abort."
      );
      return;
    }

    // Update session data
    ctx.session.tempData!.toToken = tokenInfo.address;
    ctx.session.tempData!.toSymbol = tokenInfo.symbol;
    ctx.session.tempData!.toDecimals = tokenInfo.decimals;

    // Move to amount input
    ctx.session.currentAction = "buy_amount";

    await ctx.reply(
      `💱 *Buy ${tokenInfo.symbol}*\n\n` +
        `You are buying ${tokenInfo.symbol} with ETH.\n\n` +
        `Your ETH balance: ${formatEthBalance(
          ctx.session.tempData!.balance
        )} ETH\n\n` +
        `Please enter the amount of ETH you want to spend:`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Error handling custom token input:", error);
    await ctx.reply("❌ An error occurred. Please try again later.");
  }
}

// Handle amount input
export async function handleBuyAmountInput(ctx: BotContext): Promise<void> {
  try {
    const userId = ctx.session.userId;
    let amountInput = ctx.message?.text;

    if (!userId || !amountInput) {
      await ctx.reply("❌ Invalid request. Please try again.");
      return;
    }

    // Validate amount input
    if (!isValidAmount(amountInput)) {
      await ctx.reply(
        "❌ Invalid amount format. Please enter a positive number.\n\n" +
          "Try again or type /cancel to abort."
      );
      return;
    }

    // Check for decimal inputs that start with a period and modify the original variable
    if (amountInput.startsWith(".")) {
      amountInput = "0" + amountInput;
      await ctx.reply("ℹ️ I've interpreted your input as " + amountInput);
    }

    const amount = parseFloat(amountInput);
    const balance = ctx.session.tempData!.balance;

    // Check if amount is greater than balance
    if (amount > parseFloat(formatEthBalance(balance))) {
      await ctx.reply(
        `❌ Insufficient balance. You only have ${formatEthBalance(
          balance
        )} ETH available.\n\n` +
          "Please enter a smaller amount or type /cancel to abort."
      );
      return;
    }

    // Convert amount to wei
    const amountWei = parseEther(amountInput).toString();

    // Update session data
    ctx.session.tempData!.fromAmount = amountWei;

    // Get gas parameters based on user settings
    const gasParams = await getGasParams(
      ctx.session.settings?.gasPriority || "medium"
    );

    // Store gas parameters
    ctx.session.tempData!.gasPrice = gasParams.price;
    ctx.session.tempData!.maxFeePerGas = gasParams.maxFeePerGas;
    ctx.session.tempData!.maxPriorityFeePerGas = gasParams.maxPriorityFeePerGas;

    const selectedSlippage = ctx.session.settings?.slippage.toString() || "1.0";

    const selectedGasPriority = ctx.session.settings?.gasPriority || "medium";

    await ctx.reply("⏳ Getting quote for your trade...");

    // Get quote from OpenOcean
    // OpenOcean requires the amount as non-wei value. e.g. for 1.00 ETH, set as 1.
    const quote = await getQuote(
      ctx.session.tempData!.fromToken,
      ctx.session.tempData!.toToken,
      amountInput,
      ctx.session.tempData!.gasPrice
    );

    // Store quote data
    ctx.session.tempData!.toAmount = quote.data.outAmount;
    ctx.session.tempData!.estimatedGas = quote.data.estimatedGas;

    // Format amounts for display
    const fromAmount = formatEthBalance(amountWei);
    const toAmount = formatUnits(
      BigInt(quote.data.outAmount),
      ctx.session.tempData!.toDecimals
    );

    // Update current action
    ctx.session.currentAction = "buy_confirm";

    // Show confirmation with transaction details
    await ctx.reply(
      formatTransactionDetails(
        ctx.session.tempData!.fromSymbol,
        ctx.session.tempData!.toSymbol,
        fromAmount,
        toAmount,
        selectedGasPriority,
        selectedSlippage
      ),
      {
        parse_mode: "Markdown",
        reply_markup: createConfirmationKeyboard(),
      }
    );
  } catch (error) {
    console.error("Error handling buy amount input:", error);
    await ctx.reply("❌ An error occurred. Please try again later.");
  }
}

// Handle buy confirmation
export async function handleBuyConfirmation(
  ctx: BotContext,
  confirmed: boolean
): Promise<void> {
  try {
    // Remove the confirmation keyboard
    await ctx.editMessageReplyMarkup({ reply_markup: undefined });

    if (!confirmed) {
      await ctx.reply("Trade cancelled.");
      ctx.session.currentAction = undefined;
      ctx.session.tempData = {};
      return;
    }

    const userId = ctx.session.userId;

    if (!userId) {
      await ctx.reply("❌ Session expired. Please use /start to begin again.");
      return;
    }

    // Get trade data from session
    const {
      fromToken,
      toToken,
      fromAmount,
      fromDecimals,
      walletAddress,
      gasPrice,
      maxFeePerGas,
      maxPriorityFeePerGas,
    } = ctx.session.tempData!;

    // Get user's wallet
    const wallet = await getWallet(userId);

    if (!wallet) {
      await ctx.reply(
        "❌ Wallet not found. Please create or import a wallet first."
      );
      return;
    }

    await ctx.reply("⏳ Preparing your transaction...");

    // Get slippage from user settings
    const slippage = ctx.session.settings?.slippage.toString() || "1.0";

    const formattedFromAmount = formatUnits(BigInt(fromAmount), fromDecimals);

    // Get swap data from OpenOcean
    const swap = await getSwap(
      fromToken,
      toToken,
      formattedFromAmount,
      gasPrice,
      slippage,
      walletAddress
    );

    await ctx.reply("⏳ Executing your trade (MEV-protected)...");

    // Execute the transaction
    const receipt = await executeTransaction(wallet, {
      to: swap.data.to,
      data: swap.data.data,
      value: swap.data.value,
      gasPrice: swap.data.gasPrice,
    });

    // Save transaction to database
    saveTransaction(
      receipt.transactionHash,
      userId,
      wallet.address,
      fromToken,
      toToken,
      fromAmount,
      receipt.status,
      ctx.session.tempData!.toAmount,
      receipt.gasUsed
    );

    // Format receipt for display
    if (receipt.status === "success") {
      await ctx.reply(
        `✅ *Transaction Successful*\n\n` +
          `You bought ${formatUnits(
            ctx.session.tempData!.toAmount,
            ctx.session.tempData!.toDecimals
          )} ${ctx.session.tempData!.toSymbol} \n` +
          `Price impact: ${swap.data.price_impact}\n` +
          `[View on Block Explorer](https://basescan.org/tx/${receipt.transactionHash})`,
        { parse_mode: "Markdown" }
      );
    } else {
      await ctx.reply(
        `❌ *Transaction Failed*\n\n` +
          `[View on Block Explorer](https://basescan.org/tx/${receipt.transactionHash})`,
        { parse_mode: "Markdown" }
      );
    }

    // Reset state
    ctx.session.currentAction = undefined;
    ctx.session.tempData = {};
  } catch (error) {
    console.error("Error processing buy confirmation:", error);
    await ctx.reply(
      "❌ An error occurred while processing your trade. Please try again later."
    );
    ctx.session.currentAction = undefined;
    ctx.session.tempData = {};
  }
}

export default buyHandler;
