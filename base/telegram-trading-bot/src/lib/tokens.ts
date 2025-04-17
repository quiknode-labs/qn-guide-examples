import { Address, formatUnits, parseUnits } from "viem";
import { createPublicClientForBase } from "./wallet";
import {
  COMMON_TOKENS,
  NATIVE_TOKEN_ADDRESS,
  MAX_UINT256,
} from "../utils/constants";
import { TokenInfo } from "../types/config";
import { erc20Abi } from "../utils/abis";

/**
 * Get token information using on-chain RPC calls
 * @param tokenAddress The token's contract address
 * @returns TokenInfo object with token details or null if failed
 */
export async function getTokenInfo(
  tokenAddress: Address
): Promise<TokenInfo | null> {
  try {
    // Handle native ETH specially
    if (tokenAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
      return {
        address: NATIVE_TOKEN_ADDRESS,
        symbol: "ETH",
        decimals: 18,
        balance: "0",
      };
    }

    const publicClient = createPublicClientForBase();

    // Make parallel requests for token data
    const [symbol, decimals] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "symbol",
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "decimals",
      }),
    ]);

    return {
      address: tokenAddress,
      symbol: symbol as string,
      decimals: Number(decimals),
      balance: "0",
    };
  } catch (error) {
    console.error("Error fetching token info:", error);
    return null;
  }
}

/**
 * Get token balance for a specific address
 * @param tokenAddress The token's contract address
 * @param walletAddress The wallet address to check balance for
 * @returns Token balance as string
 */
export async function getTokenBalance(
  tokenAddress: Address,
  walletAddress: Address
): Promise<string> {
  try {
    const publicClient = createPublicClientForBase();

    // If it's ETH, get native balance
    if (tokenAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
      const balance = await publicClient.getBalance({
        address: walletAddress,
      });
      return balance.toString();
    }

    // For ERC20 tokens
    const balance = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [walletAddress],
    });

    return balance.toString();
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return "0";
  }
}

/**
 * Get multiple token balances for a wallet
 * @param tokenAddresses Array of token addresses
 * @param walletAddress Wallet address to check balances for
 * @returns Array of token info objects with balances
 */
export async function getMultipleTokenBalances(
  tokenAddresses: Address[],
  walletAddress: Address
): Promise<TokenInfo[]> {
  try {
    const tokenPromises = tokenAddresses.map(async (address) => {
      const tokenInfo = await getTokenInfo(address);
      if (!tokenInfo) return null;

      const balance = await getTokenBalance(address, walletAddress);
      return {
        ...tokenInfo,
        balance,
      };
    });

    const tokens = await Promise.all(tokenPromises);
    return tokens.filter((token): token is TokenInfo => token !== null);
  } catch (error) {
    console.error("Error fetching multiple token balances:", error);
    return [];
  }
}

/**
 * Get token address from symbol
 * @param symbol Token symbol (e.g., "ETH", "USDC")
 * @returns Token address or null if not found
 */
export function getTokenAddressFromSymbol(symbol: string): Address | null {
  const upperSymbol = symbol.toUpperCase();

  // Check if it's in our common tokens list
  if (COMMON_TOKENS[upperSymbol as keyof typeof COMMON_TOKENS]) {
    return COMMON_TOKENS[upperSymbol as keyof typeof COMMON_TOKENS];
  }

  return null;
}

/**
 * Format token amount according to its decimals
 * @param amount Raw token amount (in base units)
 * @param decimals Token decimals
 * @param displayDecimals Number of decimals to display
 * @returns Formatted amount as string
 */
export function formatTokenAmount(
  amount: string | bigint,
  decimals: number,
  displayDecimals: number = 4
): string {
  try {
    const formatted = formatUnits(
      typeof amount === "string" ? BigInt(amount) : amount,
      decimals
    );
    return parseFloat(formatted).toFixed(displayDecimals);
  } catch (error) {
    console.error("Error formatting token amount:", error);
    return "0";
  }
}

/**
 * Get ERC20 token allowance
 * @param tokenAddress Token contract address
 * @param ownerAddress Owner address
 * @param spenderAddress Spender address (typically exchange contract)
 * @returns Allowance amount as string
 */
export async function getTokenAllowance(
  tokenAddress: Address,
  ownerAddress: Address,
  spenderAddress: Address
): Promise<string> {
  try {
    // Native token (ETH) doesn't need allowance
    if (tokenAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
      return MAX_UINT256;
    }

    const publicClient = createPublicClientForBase();

    const allowance = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "allowance",
      args: [ownerAddress, spenderAddress],
    });

    return allowance.toString();
  } catch (error) {
    console.error("Error getting token allowance:", error);
    return "0";
  }
}