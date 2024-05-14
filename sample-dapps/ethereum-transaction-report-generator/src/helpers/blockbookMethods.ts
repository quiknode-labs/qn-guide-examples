// Import necessary types and libraries
import { Result } from "../interfaces";
import axios from "axios";

// Retrieve the QuickNode endpoint URL from environment variables
const QUICKNODE_ENDPOINT = import.meta.env.VITE_QUICKNODE_ENDPOINT as string;

// Fetches detailed transaction data for a specified Ethereum address
export async function bb_getAddress(address: string): Promise<Result> {
  try {
    // Prepare the request payload for the bb_getAddress method
    const postData = {
      method: "bb_getAddress",
      params: [
        address,
        { page: "1", size: "1000", fromHeight: "0", details: "txs" }, // Query parameters
      ],
      id: 1,
      jsonrpc: "2.0",
    };

    // Make the POST request to the QuickNode endpoint
    const response = await axios.post(QUICKNODE_ENDPOINT, postData, {
      headers: { "Content-Type": "application/json" },
      maxBodyLength: Infinity,
    });

    // Check for a successful response and return the data
    if (response.status === 200 && response.data) {
      return response.data.result;
    } else {
      throw new Error("Failed to fetch transactions");
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}