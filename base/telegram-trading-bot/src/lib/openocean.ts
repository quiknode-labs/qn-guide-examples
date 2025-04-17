import axios from "axios";
import { Address, formatUnits } from "viem";
import {
  OpenOceanErrorResponse,
  QuoteResponse,
  SwapResponse,
} from "../types/config";
import {
  QUICKNODE_RPC_URL,
  OPENOCEAN_ADDON_ID,
  COMMON_TOKENS,
  NATIVE_TOKEN_ADDRESS,
} from "../utils/constants";

const ADDON_ID = OPENOCEAN_ADDON_ID;
const CHAIN = "base";

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
