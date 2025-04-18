import axios from "axios";
import { formatEther } from "viem";
import {
  JsonRpcResponse,
  BalanceHistoryEntry,
  TokenBalanceResult,
} from "../types/config";
import { QUICKNODE_RPC_URL } from "../utils/constants";

/**
 * Get balance history for an address using Blockbook API
 */
export async function getBalanceHistory(
  address: string,
  timeframe: "day" | "week" | "month" = "month"
): Promise<BalanceHistoryEntry[]> {
  try {
    // Calculate timeframe
    const now = Math.floor(Date.now() / 1000);
    let from: number;
    let groupBy: number;

    switch (timeframe) {
      case "day":
        from = now - 86400; // 1 day
        groupBy = 3600; // 1 hour
        break;
      case "week":
        from = now - 604800; // 1 week
        groupBy = 86400; // 1 day
        break;
      case "month":
      default:
        from = now - 2592000; // 30 days
        groupBy = 86400; // 1 day
        break;
    }

    const response = await axios.post<JsonRpcResponse<BalanceHistoryEntry[]>>(
      QUICKNODE_RPC_URL,
      {
        method: "bb_getBalanceHistory",
        params: [
          address,
          {
            from: from.toString(),
            to: now.toString(),
            fiatcurrency: "usd",
            groupBy,
          },
        ],
        id: 1,
        jsonrpc: "2.0",
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = response.data;

    if (data.error) {
      throw new Error(`Error fetching balance history: ${data.error.message}`);
    }

    return (data.result || []) as BalanceHistoryEntry[];
  } catch (error) {
    console.error("Failed to fetch balance history:", error);
    return [];
  }
}

/**
 * Format balance history as a text table
 */
export function formatBalanceHistoryTable(
  history: BalanceHistoryEntry[]
): string {
  if (history.length === 0) {
    return "No balance history available.";
  }

  let result = "*Balance History*\n\n";

  for (const entry of history) {
    const date = new Date(entry.time * 1000);
    const formattedDate = date.toLocaleString("en-US", {
      dateStyle: "short",
      timeStyle: "short",
    });

    const received = BigInt(entry.received);
    const sent = BigInt(entry.sent);
    const net = received - sent;

    const ethSent = formatEther(sent);
    const ethReceived = formatEther(received);
    const ethNet = formatEther(net);
    const usd = parseFloat(ethNet) * (entry.rates?.usd ?? 0);

    result += `📅 *${formattedDate}*\n`;
    result += `🔻 Sent: \`${ethSent}\` ETH\n`;
    result += `🔺 Received: \`${ethReceived}\` ETH\n`;
    result += `📊 Net: \`${ethNet}\` ETH\n`;
    result += `💵 USD Value: \`$${usd.toFixed(2)}\`\n\n`;
  }

  return result.trim();
}

/**
 * Get token balance history from Blockbook
 */
export async function getTokenBalance(
  address: string
): Promise<TokenBalanceResult | null> {
  try {
    const response = await fetch(QUICKNODE_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "bb_getAddress",
        params: [address],
        id: 1,
        jsonrpc: "2.0",
      }),
    });

    const data = (await response.json()) as JsonRpcResponse<TokenBalanceResult>;

    if (data.error) {
      throw new Error(`Error fetching token balances: ${data.error.message}`);
    }

    return data.result || null;
  } catch (error) {
    console.error("Failed to fetch token balances:", error);
    return null;
  }
}
