import axios from "axios";
import { OverallStats } from "../interfaces/OverallStats";
import { TokenPerformanceResult } from "../interfaces/TokenPerformance";

const QUICKNODE_ENDPOINT = import.meta.env.VITE_QUICKNODE_ENDPOINT as string;

const makeRpcCall = async (method: string, params: any) => {
  const response = await axios.post(
    QUICKNODE_ENDPOINT,
    {
      method,
      params,
      id: 1,
      jsonrpc: "2.0",
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (response.data.error) {
    throw new Error(response.data.error.message);
  }

  return response.data.result;
};

export const getWalletLatestTotalPerformance = async (
  walletAddress: string
): Promise<OverallStats> => {
  const result = await makeRpcCall("v1/getWalletLatestTotalPerformance", {
    wallet_address: walletAddress,
    max_size_ok: "true",
  });
  return result as OverallStats;
};

export const getWalletLatestPerformancePerToken = async (
  walletAddress: string
): Promise<TokenPerformanceResult> => {
  const result = await makeRpcCall("v1/getWalletLatestPerformancePerToken", {
    wallet_address: walletAddress,
    max_size_ok: "true",
  });
  return result as TokenPerformanceResult;
};
