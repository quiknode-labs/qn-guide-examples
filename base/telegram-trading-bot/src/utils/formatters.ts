import { formatEther, formatUnits, parseEther, parseUnits } from "viem";
import { TokenInfo } from "../types/config";

/**
 * Format ETH balance with proper decimals
 */
export function formatEthBalance(balanceWei: string | bigint): string {
  try {
    const formatted = formatEther(typeof balanceWei === "string" ? BigInt(balanceWei) : balanceWei);
    // Format to 6 decimal places
    return parseFloat(formatted).toFixed(6);
  } catch (error) {
    console.error("Error formatting ETH balance:", error);
    return "0.000000";
  }
}

/**
 * Format token balance based on decimals
 */
export function formatTokenBalance(balance: string, decimals: number): string {
  try {
    const formatted = formatUnits(BigInt(balance), decimals);
    // Format to 6 decimal places
    return parseFloat(formatted).toFixed(6);
  } catch (error) {
    console.error("Error formatting token balance:", error);
    return "0.000000";
  }
}

/**
 * Parse user input amount to wei
 */
export function parseAmount(amount: string, decimals: number = 18): string {
  try {
    if (decimals === 18) {
      return parseEther(amount).toString();
    } else {
      return parseUnits(amount, decimals).toString();
    }
  } catch (error) {
    console.error("Error parsing amount:", error);
    throw new Error("Invalid amount format");
  }
}

/**
 * Format address for display (0x1234...5678)
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(
    address.length - 4
  )}`;
}

/**
 * Format token balances for display in Telegram
 */
export function formatBalanceMessage(
  ethBalance: string,
  tokens: TokenInfo[]
): string {
  let message = `💰 *Your Balances*\n\n`;
  message += `*ETH*: ${formatEthBalance(ethBalance)} ETH\n\n`;

  if (tokens.length > 0) {
    message += `*Tokens:*\n`;
    tokens.forEach((token) => {
      const formattedBalance = formatTokenBalance(
        token.balance,
        token.decimals
      );
      message += `${token.symbol}: ${formattedBalance}\n`;
    });
  } else {
    message += `No other token balances found.`;
  }

  return message;
}

/**
 * Format transaction details for confirmation
 */
export function formatTransactionDetails(
  fromToken: string,
  toToken: string,
  fromAmount: string,
  toAmount: string,
  selectedGasPriority: string,
  selectedSlippage: string
): string {
  return (
    `*Transaction Details*\n\n` +
    `From: ${fromAmount} ${fromToken}\n` +
    `To: ${toAmount} ${toToken}\n` +
    `Gas Priority: ${selectedGasPriority}\n` +
    `Slippage: ${selectedSlippage}%\n` +
    `Do you want to proceed with this transaction?`
  );
}

/**
 * Format transaction receipt
 */
export function formatTransactionReceipt(
  hash: string,
  status: string,
  gasUsed: string
): string {
  const statusEmoji = status === "success" ? "✅" : "❌";

  return (
    `*Transaction ${statusEmoji}*\n\n` +
    `Transaction Hash: \`${hash}\`\n` +
    `Status: ${status}\n` +
    `Gas Used: ${formatEther(BigInt(gasUsed))} ETH\n`
  );
}

/**
 * Format withdrawal confirmation message
 */
export function formatWithdrawalConfirmation(
  amount: string,
  toAddress: string,
): string {
  return (
    `*Withdrawal Confirmation*\n\n` +
    `Amount: ${formatEthBalance(amount)} ETH\n` +
    `To: ${formatAddress(toAddress)}\n` +
    `Do you want to proceed with this withdrawal?`
  );
}
