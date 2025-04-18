import { BotContext } from "../context";
import {
  getWallet,
  getEthBalance,
  withdrawEth,
} from "../lib/token-wallet";
import { CommandHandler } from "../types/commands";
import {
  formatEthBalance,
  formatWithdrawalConfirmation,
} from "../utils/formatters";
import {
  isValidAddress,
  isValidAmount,
} from "../utils/validators";
import { createConfirmationKeyboard } from "../utils/keyboardHelper";
import { parseEther} from "viem";
import { saveTransaction } from "../lib/database";
import { NATIVE_TOKEN_ADDRESS } from "../utils/constants";

const withdrawHandler: CommandHandler = {
  command: "withdraw",
  description: "Withdraw ETH to another address",
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

      // Check wallet balance
      const balance = await getEthBalance(wallet.address);

      if (BigInt(balance) <= BigInt(0)) {
        await ctx.reply(
          "❌ Your wallet has no ETH balance to withdraw.\n\n" +
            "Use /deposit to get your deposit address and add funds first."
        );
        return;
      }

      // Format balance for display
      const formattedBalance = formatEthBalance(balance);

      // Set current action
      ctx.session.currentAction = "withdraw_address";

      // Initialize withdrawal data
      ctx.session.tempData = {
        from: wallet.address,
        balance,
      };

      await ctx.reply(
        `💰 *Withdraw ETH*\n\n` +
          `Your current balance: ${formattedBalance} ETH\n\n` +
          `Please send the destination Ethereum address you want to withdraw to.\n\n` +
          `You can cancel this operation by typing /cancel`,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      console.error("Error in withdraw command:", error);
      await ctx.reply("❌ An error occurred. Please try again later.");
    }
  },
};

// Handler for recipient address input
export async function handleWithdrawAddress(ctx: BotContext): Promise<void> {
  try {
    const userId = ctx.session.userId;
    const toAddress = ctx.message?.text;

    if (!userId || !toAddress) {
      await ctx.reply("❌ Invalid request. Please try again.");
      return;
    }

    // Validate address format
    if (!isValidAddress(toAddress)) {
      await ctx.reply(
        "❌ Invalid Ethereum address format. Please provide a valid address.\n\n" +
          "Try again or type /cancel to abort."
      );
      return;
    }

    // Store address and update action
    ctx.session.tempData!.to = toAddress;
    ctx.session.currentAction = "withdraw_amount";

    // Get balance for reference
    const balance = ctx.session.tempData!.balance;
    const formattedBalance = formatEthBalance(balance);

    await ctx.reply(
      `📤 *Withdraw ETH*\n\n` +
        `Destination address: \`${toAddress}\`\n\n` +
        `Your current balance: ${formattedBalance} ETH\n\n` +
        `Please enter the amount of ETH you wish to withdraw\n\n` +
        `Please leave a small amount of ETH in your wallet for gas fees.\n\n` +
        `You can cancel this operation by typing /cancel`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Error handling withdrawal address:", error);
    await ctx.reply("❌ An error occurred. Please try again later.");
  }
}

// Handler for withdrawal amount input
export async function handleWithdrawAmount(ctx: BotContext): Promise<void> {
  try {
    const userId = ctx.session.userId;
    let amountInput = ctx.message?.text;

    if (!userId || !amountInput) {
      await ctx.reply("❌ Invalid request. Please try again.");
      return;
    }

    const balance = ctx.session.tempData!.balance;
    const toAddress = ctx.session.tempData!.to;

    // Validate amount format
    if (!isValidAmount(amountInput)) {
      await ctx.reply(
        "❌ Invalid amount format. Please enter a valid positive number.\n\n" +
          "Try again or type /cancel to abort."
      );
      return;
    }

    // Check for decimal inputs that start with a period and modify the original variable
    if (amountInput.startsWith(".")) {
      amountInput = "0" + amountInput;
      await ctx.reply("ℹ️ I've interpreted your input as " + amountInput);
    }

    // Convert amount to wei
    const amountWei = parseEther(amountInput).toString();

    if (BigInt(balance) < BigInt(amountWei)) {
      await ctx.reply(
        `❌ Insufficient balance for this withdrawal.\n\n` +
          `Amount requested: ${amountInput} ETH\n` +
          `Your balance: ${formatEthBalance(balance)} ETH\n\n` +
          `Please enter a smaller amount`
      );
      return;
    }

    // Store amount and continue to confirmation
    ctx.session.tempData!.amount = amountWei;
    await showWithdrawalConfirmation(ctx, amountWei, toAddress);
  } catch (error) {
    console.error("Error handling withdrawal amount:", error);
    await ctx.reply("❌ An error occurred. Please try again later.");
  }
}

// Show withdrawal confirmation
async function showWithdrawalConfirmation(
  ctx: BotContext,
  amount: string,
  toAddress: string
): Promise<void> {
  try {
    // Update current action
    ctx.session.currentAction = "withdraw_confirm";

    // Show confirmation with details
    await ctx.reply(formatWithdrawalConfirmation(amount, toAddress), {
      parse_mode: "Markdown",
      reply_markup: createConfirmationKeyboard(),
    });
  } catch (error) {
    console.error("Error showing withdrawal confirmation:", error);
    await ctx.reply("❌ An error occurred. Please try again later.");
  }
}

// Handle withdrawal confirmation
export async function handleWithdrawConfirmation(
  ctx: BotContext,
  confirmed: boolean
): Promise<void> {
  try {
    // Remove the confirmation keyboard
    await ctx.editMessageReplyMarkup({ reply_markup: undefined });

    if (!confirmed) {
      await ctx.reply("Withdrawal cancelled.");
      ctx.session.currentAction = undefined;
      ctx.session.tempData = {};
      return;
    }

    const userId = ctx.session.userId;

    if (!userId) {
      await ctx.reply("❌ Session expired. Please use /start to begin again.");
      return;
    }

    // Get withdrawal data
    const { from, to, amount, gasPrice, gasLimit } = ctx.session.tempData!;

    // Get user's wallet
    const wallet = await getWallet(userId);

    if (!wallet) {
      await ctx.reply(
        "❌ Wallet not found. Please create or import a wallet first."
      );
      return;
    }

    await ctx.reply("⏳ Processing your withdrawal...");

    // Execute withdrawal
    const receipt = await withdrawEth(wallet, {
      from,
      to,
      amount,
      gasPrice,
    });

    // Save transaction to database
    saveTransaction(
      receipt.transactionHash,
      userId,
      wallet.address,
      NATIVE_TOKEN_ADDRESS,
      to,
      amount,
      receipt.status,
      "0",
      receipt.gasUsed
    );

    // Format receipt for display
    if (receipt.status === "success") {
      await ctx.reply(
        `✅ *Withdrawal Successful*\n\n` +
          `Amount: ${formatEthBalance(amount)} ETH\n` +
          `To: \`${to}\`\n` +
          `Transaction Hash: \`${receipt.transactionHash}\`\n` +
          `Gas Used: ${formatEthBalance(receipt.gasUsed)} ETH\n\n` +
          `You can view this transaction on the block explorer:\n` +
          `https://basescan.org/tx/${receipt.transactionHash}`,
        { parse_mode: "Markdown" }
      );
    } else {
      await ctx.reply(
        `❌ *Withdrawal Failed*\n\n` +
          `[View on Block Explorer](https://basescan.org/tx/${receipt.transactionHash})`,
        { parse_mode: "Markdown" }
      );
    }

    // Reset state
    ctx.session.currentAction = undefined;
    ctx.session.tempData = {};
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    await ctx.reply(
      "❌ An error occurred while processing your withdrawal. Please try again later."
    );
    ctx.session.currentAction = undefined;
    ctx.session.tempData = {};
  }
}

export default withdrawHandler;
