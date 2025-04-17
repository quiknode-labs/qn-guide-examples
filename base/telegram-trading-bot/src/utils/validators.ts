import { isAddress } from "viem";

/**
 * Validate if a string is a valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return isAddress(address);
}

/**
 * Validate if a string is a valid private key
 */
export function isValidPrivateKey(privateKey: string): boolean {
  // Private key should be 64 hex characters with or without 0x prefix
  const hexRegex = /^(0x)?[0-9a-fA-F]{64}$/;
  return hexRegex.test(privateKey);
}

/**
 * Validate if a string is a valid amount
 */
export function isValidAmount(amount: string): boolean {
  // Amount should be a positive number with up to 18 decimal places
  const amountRegex = /^(?!0\d)\d*(\.\d{1,18})?$/;
  return amountRegex.test(amount) && parseFloat(amount) > 0;
}

/**
 * Check if user has enough balance for a transaction
 */
export function hasEnoughBalance(
  balance: string,
  amount: string,
  gasEstimate: string = "0"
): boolean {
  try {
    const balanceBigInt = BigInt(balance);
    const amountBigInt = BigInt(amount);
    const gasEstimateBigInt = BigInt(gasEstimate);

    // For ETH transfers, we need to check if balance >= amount + gas
    return balanceBigInt >= amountBigInt + gasEstimateBigInt;
  } catch (error) {
    console.error("Error checking balance:", error);
    return false;
  }
}

/**
 * Validate slippage value
 */
export function isValidSlippage(slippage: number): boolean {
  return slippage > 0 && slippage <= 50;
}

/**
 * Validate gas priority value
 */
export function isValidGasPriority(
  priority: string
): priority is "low" | "medium" | "high" {
  return ["low", "medium", "high"].includes(priority);
}
