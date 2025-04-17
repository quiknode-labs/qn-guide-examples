import axios from "axios";
import { formatEther } from "viem";
import { GasPriceInfo, BlockPrices, JsonRpcResponse } from "../types/config";
import {
  BASE_CHAIN_ID,
  GAS_PRIORITY,
  QUICKNODE_RPC_URL,
} from "../utils/constants";

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
