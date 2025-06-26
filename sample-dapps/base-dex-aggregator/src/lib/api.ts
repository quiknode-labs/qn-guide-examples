import axios from "axios";
import { Address, createPublicClient, http, parseAbi } from "viem";
import { base } from "viem/chains";
import { BASE_CHAIN_ID, QUICKNODE_ENDPOINT_URL } from "./constants";
import type { Token } from "../types";

// QUICKNODE ENDPOINT HAS `/` AT THE END
const OPENOCEAN_API_URL = `${QUICKNODE_ENDPOINT_URL}addon/807/v4/base`;

// Create a public client for Base
const publicClient = createPublicClient({
  chain: base,
  transport: http(QUICKNODE_ENDPOINT_URL),
});

// Cache for token balances
const tokenBalanceCache: Record<
  string,
  { balance: string; timestamp: number }
> = {};
const BALANCE_CACHE_DURATION = 30000; // 30 seconds

// Fetch token list from OpenOcean API
export async function fetchTokenList(): Promise<Token[]> {
  try {
    const response = await axios.get(`${OPENOCEAN_API_URL}/tokenList`);
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching token list:", error);
    throw error;
  }
}

// Fetch token balance with caching
export async function fetchTokenBalance(
  tokenAddress: Address,
  userAddress: Address,
  decimals: number
): Promise<string> {
  const cacheKey = `${tokenAddress}-${userAddress}`;
  const now = Date.now();

  // Return cached balance if available and not expired
  if (
    tokenBalanceCache[cacheKey] &&
    now - tokenBalanceCache[cacheKey].timestamp < BALANCE_CACHE_DURATION
  ) {
    return tokenBalanceCache[cacheKey].balance;
  }

  try {
    // For native ETH
    if (tokenAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
      const balance = await publicClient.getBalance({
        address: userAddress,
      });
      const balanceStr = balance.toString();

      // Cache the result
      tokenBalanceCache[cacheKey] = { balance: balanceStr, timestamp: now };
      return balanceStr;
    }

    // For ERC20 tokens
    const erc20Abi = parseAbi([
      "function balanceOf(address owner) view returns (uint256)",
    ]);

    const balance = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [userAddress],
    });

    const balanceStr = balance.toString();

    // Cache the result
    tokenBalanceCache[cacheKey] = { balance: balanceStr, timestamp: now };
    return balanceStr;
  } catch (error) {
    console.error(`Error fetching balance for token ${tokenAddress}:`, error);
    return "0";
  }
}

// Fetch gas estimates
export async function fetchGasEstimates() {
  try {
    const response = await axios.post(
      QUICKNODE_ENDPOINT_URL,
      {
        id: 1,
        jsonrpc: "2.0",
        method: "sentio_gasPrice",
        params: { chainId: BASE_CHAIN_ID },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.blockPrices[0].estimatedPrices;
  } catch (error) {
    console.error("Error fetching gas estimates:", error);
    throw error;
  }
}

// Fetch swap quote
export async function fetchSwapQuote({
  inTokenAddress,
  outTokenAddress,
  amount,
  gasPrice,
}: {
  inTokenAddress: Address;
  outTokenAddress: Address;
  amount: string;
  gasPrice: string;
}) {
  try {
    const response = await axios.get(`${OPENOCEAN_API_URL}/quote`, {
      params: {
        inTokenAddress,
        outTokenAddress,
        amount,
        gasPrice,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching swap quote:", error);
    throw error;
  }
}

// Execute swap
export async function executeSwap({
  inTokenAddress,
  outTokenAddress,
  amount,
  slippage,
  gasPrice,
  userAddress,
}: {
  inTokenAddress: Address;
  outTokenAddress: Address;
  amount: string;
  slippage: string;
  gasPrice: string;
  userAddress: Address;
}) {
  try {
    // 1. Get the swap transaction data from OpenOcean
    const swapResponse = await axios.get(`${OPENOCEAN_API_URL}/swap`, {
      params: {
        inTokenAddress,
        outTokenAddress,
        amount,
        slippage,
        gasPrice,
        account: userAddress,
      },
    });

    const swapData = swapResponse.data.data;

    return swapData;
  } catch (error) {
    console.error("Error executing swap:", error);
    throw error;
  }
}

