import { BotContext } from "../context";
import {
  getTokenInfo,
  getTokenAllowance,
  getWallet,
  executeTransaction,
  executeContractMethod,
} from "../lib/token-wallet";
import { getQuote, getSwap, getGasParams } from "../lib/swap";
import { getUniqueTokensByUserId } from "../lib/database";
import {
  formatEthBalance,
  formatTransactionDetails,
} from "../utils/formatters";
import { isValidAddress, isValidAmount } from "../utils/validators";
import {
  createConfirmationKeyboard,
} from "../utils/keyboardHelper";
import { CommandHandler } from "../types/commands";
import { saveTransaction } from "../lib/database";
import { getTokenBalance } from "../lib/history";
import { NATIVE_TOKEN_ADDRESS, MAX_UINT256 } from "../utils/constants";
import { Address, parseUnits, formatUnits } from "viem";
import { InlineKeyboard } from "grammy";
import { erc20Abi } from "../utils/abis";

const sellHandler: CommandHandler = {
  command: "sell",
  description: "Sell ERC-20 tokens for ETH",
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

      // Check if user has any tokens
      const tokenData = await getTokenBalance(wallet.address);

      // Get list of tokens this user has interacted with
      const interactedTokens = getUniqueTokensByUserId(userId).map((t) =>
        t.toLowerCase()
      );

      // Filter out tokens the user hasn’t interacted with
      if (tokenData && Array.isArray(tokenData.tokens)) {
        tokenData.tokens = tokenData.tokens.filter((token) => {
          const contract = token.contract?.toLowerCase();
          return (
            contract &&
            token.type === "ERC20" &&
            BigInt(token.balance) > 0n &&
            interactedTokens.includes(contract)
          );
        });
      }

      if (!tokenData || !tokenData.tokens || tokenData.tokens.length === 0) {
        await ctx.reply(
          "❌ You don't have any tokens to sell.\n\n" +
            "Use /buy to buy some tokens first"
        );
        return;
      }

      // Set current action
      ctx.session.currentAction = "sell_token";

      // Initialize trading data
      ctx.session.tempData = {
        toToken: NATIVE_TOKEN_ADDRESS,
        toSymbol: "ETH",
        toDecimals: 18,
        walletAddress: wallet.address,
        tokens: tokenData.tokens,
      };

      // Display token selection options
      await ctx.reply(`💱 *Sell Tokens for ETH*\n\n`, {
        parse_mode: "Markdown",
      });

      // Create custom keyboard based on user's tokens
      const tokenKeyboard = new InlineKeyboard();
      let row = 0;

      for (let i = 0; i < Math.min(tokenData.tokens.length, 6); i++) {
        const token = tokenData.tokens[i];

        if (BigInt(token.balance) > BigInt(0)) {
          if (i % 2 === 0 && i > 0) {
            tokenKeyboard.row();
            row++;
          }

          tokenKeyboard.text(`${token.symbol}`, `sell_token_${token.contract}`);
        }
      }

      await ctx.reply("Select a token to sell:", {
        reply_markup: tokenKeyboard,
      });
    } catch (error) {
      console.error("Error in sell command:", error);
      await ctx.reply("❌ An error occurred. Please try again later.");
    }
  },
};

// Handle token selection for selling
export async function handleSellTokenSelection(
  ctx: BotContext,
  tokenAddress: string
): Promise<void> {
  try {
    if (tokenAddress === "custom") {
      // User wants to enter a custom token address
      ctx.session.currentAction = "sell_custom_token";

      await ctx.editMessageText(
        `💱 *Sell Custom Token*\n\n` +
          `Please send the ERC-20 token address you want to sell.\n\n` +
          `The address should look like: 0x1234...5678\n\n` +
          `You can cancel this operation by typing /cancel`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Get token info
    const tokenInfo = await getTokenInfo(tokenAddress as Address);

    if (!tokenInfo) {
      await ctx.answerCallbackQuery(
        "❌ Unable to get token information. Please try again."
      );
      return;
    }

    // Update session data
    ctx.session.tempData!.fromToken = tokenInfo.address;
    ctx.session.tempData!.fromSymbol = tokenInfo.symbol;
    ctx.session.tempData!.fromDecimals = tokenInfo.decimals;

    // Find token balance
    const token = ctx.session.tempData!.tokens.find(
      (t: any) => t.contract.toLowerCase() === tokenAddress.toLowerCase()
    );

    if (!token || BigInt(token.balance) <= BigInt(0)) {
      await ctx.answerCallbackQuery(
        "❌ You don't have any balance for this token."
      );
      return;
    }

    ctx.session.tempData!.tokenBalance = token.balance;

    // Move to amount input
    ctx.session.currentAction = "sell_amount";

    const formattedBalance = formatUnits(token.balance, tokenInfo.decimals);

    await ctx.editMessageText(
      `💱 *Sell ${tokenInfo.symbol}*\n\n` +
        `You are selling ${tokenInfo.symbol} for ETH.\n\n` +
        `Your ${tokenInfo.symbol} balance: ${formattedBalance}\n\n` +
        `Please enter the amount of ${tokenInfo.symbol} you want to sell (or type "max" for maximum):`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Error handling sell token selection:", error);
    await ctx.answerCallbackQuery("❌ An error occurred. Please try again.");
  }
}

// Handle custom token address input for selling
export async function handleSellCustomTokenInput(
  ctx: BotContext
): Promise<void> {
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
    ctx.session.tempData!.fromToken = tokenInfo.address;
    ctx.session.tempData!.fromSymbol = tokenInfo.symbol;
    ctx.session.tempData!.fromDecimals = tokenInfo.decimals;

    // Check token balance
    const token = ctx.session.tempData!.tokens.find(
      (t: any) => t.address.toLowerCase() === tokenAddress.toLowerCase()
    );

    if (!token || BigInt(token.balance) <= BigInt(0)) {
      await ctx.reply(
        `❌ You don't have any ${tokenInfo.symbol} balance to sell.\n\n` +
          `Please use /buy to buy this token first or /deposit to receive it.`
      );
      return;
    }

    ctx.session.tempData!.tokenBalance = token.balance;

    // Move to amount input
    ctx.session.currentAction = "sell_amount";

    const formattedBalance = formatUnits(token.balance, tokenInfo.decimals);

    await ctx.reply(
      `💱 *Sell ${tokenInfo.symbol}*\n\n` +
        `You are selling ${tokenInfo.symbol} for ETH.\n\n` +
        `Your ${tokenInfo.symbol} balance: ${formattedBalance}\n\n` +
        `Please enter the amount of ${tokenInfo.symbol} you want to sell (or type "max" for maximum):`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Error handling sell custom token input:", error);
    await ctx.reply("❌ An error occurred. Please try again later.");
  }
}

// Handle sell amount input
export async function handleSellAmountInput(ctx: BotContext): Promise<void> {
  try {
    const userId = ctx.session.userId;
    let amountInput = ctx.message?.text;

    if (!userId || !amountInput) {
      await ctx.reply("❌ Invalid request. Please try again.");
      return;
    }

    const { fromSymbol, fromDecimals, tokenBalance } = ctx.session.tempData!;

    // Handle "max" input
    if (amountInput.toLowerCase() === "max") {
      ctx.session.tempData!.fromAmount = tokenBalance;

      await handleSellAmountLogic(ctx, tokenBalance);
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

    // Convert amount to token units
    const amountInUnits = parseUnits(amountInput, fromDecimals).toString();

    // Check if amount is greater than balance
    if (BigInt(amountInUnits) > BigInt(tokenBalance)) {
      const formattedBalance = formatUnits(tokenBalance, fromDecimals);

      await ctx.reply(
        `❌ Insufficient balance. You only have ${formattedBalance} ${fromSymbol} available.\n\n` +
          "Please enter a smaller amount."
      );
      return;
    }

    // Update session data
    ctx.session.tempData!.fromAmount = amountInUnits;

    await handleSellAmountLogic(ctx, amountInUnits);
  } catch (error) {
    console.error("Error handling sell amount input:", error);
    await ctx.reply("❌ An error occurred. Please try again later.");
  }
}

// Common logic for handling sell amount (max or specified)
async function handleSellAmountLogic(
  ctx: BotContext,
  amountInUnits: string
): Promise<void> {
  try {
    const {
      fromToken,
      toToken,
      fromSymbol,
      toSymbol,
      fromDecimals,
      walletAddress,
    } = ctx.session.tempData!;

    await ctx.reply("⏳ Getting quote for your trade...");

    const selectedSlippage = ctx.session.settings?.slippage.toString() || "1.0";
    const selectedGasPriority = ctx.session.settings?.gasPriority || "medium";

    // Get gas parameters based on user settings
    const gasParams = await getGasParams(
      ctx.session.settings?.gasPriority || "medium"
    );

    // Store gas parameters
    ctx.session.tempData!.gasPrice = gasParams.price;
    ctx.session.tempData!.maxFeePerGas = gasParams.maxFeePerGas;
    ctx.session.tempData!.maxPriorityFeePerGas = gasParams.maxPriorityFeePerGas;

    const amountInput = formatUnits(BigInt(amountInUnits), fromDecimals);

    // Get quote from OpenOcean
    const quote = await getQuote(
      fromToken,
      toToken,
      amountInput,
      ctx.session.tempData!.gasPrice
    );

    // Store quote data
    ctx.session.tempData!.toAmount = quote.data.outAmount;
    ctx.session.tempData!.estimatedGas = quote.data.estimatedGas;

    // Format amounts for display
    const fromAmount = amountInput;
    const toAmount = formatEthBalance(quote.data.outAmount);

    // Update current action
    ctx.session.currentAction = "sell_confirm";

    // Show confirmation with transaction details
    await ctx.reply(
      formatTransactionDetails(
        fromSymbol,
        toSymbol,
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
    console.error("Error getting sell quote:", error);
    await ctx.reply(
      "❌ An error occurred while getting the quote. Please try again later."
    );
  }
}

// Handle sell confirmation
export async function handleSellConfirmation(
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

    // Skip allowance check for native ETH (selling ETH -> another token doesn't need approval)
    if (fromToken.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase()) {
      // Check token allowance
      const allowance = await getTokenAllowance(
        fromToken as Address,
        wallet.address as Address,
        swap.data.to as Address
      );

      // Check if allowance is enough for the transaction
      if (BigInt(allowance) < BigInt(swap.data.inAmount)) {
        await ctx.reply(
          "⏳ Token approval required. Sending approval transaction..."
        );

        // // Create approval transaction
        const receipt = await executeContractMethod({
          walletData: wallet,
          contractAddress: fromToken as Address,
          abi: erc20Abi,
          functionName: "approve",
          args: [swap.data.to, MAX_UINT256],
        });

        if (receipt.status !== "success") {
          await ctx.reply(
            `❌ *Approval Failed*\n\n` +
              `Unable to approve token spending. Transaction failed.\n` +
              `[View on Block Explorer](https://basescan.org/tx/${receipt.transactionHash})`,
            { parse_mode: "Markdown" }
          );
          ctx.session.currentAction = undefined;
          ctx.session.tempData = {};
          return;
        }

        await ctx.reply(
          "✅ Token approved successfully! Continuing with your transaction..."
        );

        // Check allowance again to make sure approval worked
        const newAllowance = await getTokenAllowance(
          fromToken as Address,
          wallet.address as Address,
          swap.data.to as Address
        );

        if (BigInt(newAllowance) < BigInt(fromAmount)) {
          await ctx.reply(
            `❌ *Error*\n\n` + `Token approval failed. Please try again later.`
          );
          ctx.session.currentAction = undefined;
          ctx.session.tempData = {};
          return;
        }
      }
    }

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
          `You sold ${formatUnits(
            fromAmount,
            ctx.session.tempData!.fromDecimals
          )} ${ctx.session.tempData!.fromSymbol}\n` +
          `You received ${formatEthBalance(
            ctx.session.tempData!.toAmount
          )} ETH\n` +
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
    console.error("Error processing sell confirmation:", error);
    await ctx.reply(
      "❌ An error occurred while processing your trade. Please try again later."
    );
    ctx.session.currentAction = undefined;
    ctx.session.tempData = {};
  }
}

export default sellHandler;
