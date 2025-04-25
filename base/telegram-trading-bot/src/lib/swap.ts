import axios from "axios";
import { Address, formatEther } from "viem";
import {
  OpenOceanErrorResponse,
  QuoteResponse,
  SwapResponse,
  GasPriceInfo,
  BlockPrices,
} from "../types/config";
import {
  QUICKNODE_RPC_URL,
  OPENOCEAN_ADDON_ID,
  BASE_CHAIN_ID,
  GAS_PRIORITY,
} from "../utils/constants";

const ADDON_ID = OPENOCEAN_ADDON_ID;
const CHAIN = "base";

// ** SWAP FUNCTIONS ** //

// Type guard to check if response contains an error
function isErrorResponse(data: any): data is OpenOceanErrorResponse {
  return data && typeof data.error !== "undefined";
}

/**
 * Get quote for a swap
 * OpenOcean requires the amount as non-wei value. e.g. for 1.00 ETH, set as 1.
 * OpenOcean requires the gas price as a string and in gwei, not wei
 */
export async function getQuote(
  inTokenAddress: string,
  outTokenAddress: string,
  amount: string,
  gasPrice: string
): Promise<QuoteResponse> {
  try {
    // Construct URL - QUICKNODE_RPC_URL has `/` at the end in default
    let url = `${QUICKNODE_RPC_URL}addon/${ADDON_ID}/v4/${CHAIN}/quote?inTokenAddress=${inTokenAddress}&outTokenAddress=${outTokenAddress}&amount=${amount}`;

    if (gasPrice) {
      url += `&gasPrice=${gasPrice}`;
    }

    // Fetch quote
    const response = await axios.get(url);

    const data = response.data;

    if (isErrorResponse(data)) {
      throw new Error(`OpenOcean API error: ${data.error}`);
    }

    return data;
  } catch (error) {
    console.error(
      "Failed to get quote:",
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}

/**
 * Get swap transaction data
 */
export async function getSwap(
  inTokenAddress: Address,
  outTokenAddress: Address,
  amount: string,
  gasPrice: string,
  slippage: string,
  account: Address
): Promise<SwapResponse> {
  try {
    // Construct URL
    let url =
      `${QUICKNODE_RPC_URL}addon/${ADDON_ID}/v4/${CHAIN}/swap` +
      `?inTokenAddress=${inTokenAddress}` +
      `&outTokenAddress=${outTokenAddress}` +
      `&amount=${amount}` +
      `&gasPrice=${gasPrice}` +
      `&slippage=${slippage}` +
      `&account=${account}`;

    // Optionally add referrer
    // url += `&referrer=0x...`;

    const response = await axios.get<SwapResponse | OpenOceanErrorResponse>(
      url
    );

    const data = response.data;

    if (isErrorResponse(data)) {
      throw new Error(`OpenOcean API error: ${data.error}`);
    }

    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Axios error in getSwap:",
        error.response?.data || error.message
      );
    } else {
      console.error("Unexpected error in getSwap:", error);
    }
    throw error;
  }
}

// ** GAS ESTIMATION FUNCTIONS ** //

/**
 * Get gas price estimates from Sentio API
 */
export async function getGasEstimates(): Promise<BlockPrices> {
  try {
    const response = await axios.post(
      QUICKNODE_RPC_URL,
      {
        jsonrpc: "2.0",
        method: "sentio_gasPrice",
        params: { chainId: BASE_CHAIN_ID },
        id: 1,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = response.data;

    if (data.error) {
      throw new Error(`Error fetching gas price: ${data.error.message}`);
    }

    return data as BlockPrices;
  } catch (error) {
    console.error("Failed to fetch gas estimates:", error);
    // Return fallback values if API call fails
    return {
      blockPrices: [
        {
          estimatedPrices: [
            {
              confidence: 99,
              price: 0.1,
              maxFeePerGas: 1.5,
              maxPriorityFeePerGas: 0.1,
            },
            {
              confidence: 95,
              price: 0.1,
              maxFeePerGas: 1.2,
              maxPriorityFeePerGas: 0.08,
            },
            {
              confidence: 90,
              price: 0.05,
              maxFeePerGas: 1.0,
              maxPriorityFeePerGas: 0.05,
            },
          ],
        },
      ],
    };
  }
}

/**
 * Get gas price info for a specific priority level
 */
export async function getGasPriceForPriority(
  priority: "low" | "medium" | "high" = "medium"
): Promise<GasPriceInfo> {
  const gasEstimates = await getGasEstimates();

  const confidenceLevel = GAS_PRIORITY[priority];

  // Find the estimate with the closest confidence level
  const estimatedPrices = gasEstimates.blockPrices[0].estimatedPrices;
  const estimate =
    estimatedPrices.find((e) => e.confidence === confidenceLevel) ||
    estimatedPrices[0];

  return {
    confidence: estimate.confidence,
    price: estimate.price,
    maxFeePerGas: estimate.maxFeePerGas,
    maxPriorityFeePerGas: estimate.maxPriorityFeePerGas,
  };
}

/**
 * Get gas parameters for transaction
 */
export async function getGasParams(
  priority: "low" | "medium" | "high" = "medium"
): Promise<{
  price: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}> {
  
  const gasPriceInfo = await getGasPriceForPriority(priority);
  // OpenOcean requires the gas price as a string and in gwei, not wei
  const price = gasPriceInfo.price.toString();
  const maxFeePerGas = gasPriceInfo.maxFeePerGas.toString();
  const maxPriorityFeePerGas = gasPriceInfo.maxPriorityFeePerGas.toString();

  // Convert from gwei to wei
  // const price = Math.round(gasPriceInfo.price * ).toString();
  // const maxFeePerGas = Math.round(gasPriceInfo.maxFeePerGas * 1e9).toString();
  // const maxPriorityFeePerGas = Math.round(
  //   gasPriceInfo.maxPriorityFeePerGas * 1e9
  // ).toString();

  return {
    price,
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
}

/**
 * Format gas cost estimate for display
 */
export function formatGasCost(gasLimit: string, maxFeePerGas: string): string {
  const gasCost = BigInt(gasLimit) * BigInt(maxFeePerGas);
  return formatEther(gasCost);
}

/**
 * Get a human-readable gas priority label
 */
export function getGasPriorityLabel(
  priority: "low" | "medium" | "high"
): string {
  const labels = {
    low: "🐢 Low (slower, cheaper)",
    medium: "🚶 Medium (balanced)",
    high: "🚀 High (faster, expensive)",
  };

  return labels[priority];
}
