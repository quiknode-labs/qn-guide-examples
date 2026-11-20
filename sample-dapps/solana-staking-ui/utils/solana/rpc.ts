import { createSolanaRpc, SolanaRpcApi, type Rpc } from "@solana/kit";
import { ValidatorStakingError } from "../errors";

export function createRpcConnection(): Rpc<SolanaRpcApi> {
  const { endpoint, token } = getRpcConfig();
  const currentNetwork =
    process.env.NEXT_PUBLIC_NETWORK_ENV?.toLowerCase() || "devnet";
  const endpointName = currentNetwork.toUpperCase() + "_RPC_ENDPOINT";
  if (!endpoint) {
    throw new ValidatorStakingError(
      `${endpointName} environment variable not set`,
      "RPC_ENDPOINT_MISSING"
    );
  }
  try {
    return createSolanaRpc(endpoint, token ? { headers: { "x-token": token } } : undefined);
  } catch (error) {
    throw new ValidatorStakingError(
      "Failed to create Solana RPC connection",
      "RPC_CONNECTION_FAILED",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

function getRpcConfig(): { endpoint: string; token: string | undefined } {
  const currentNetwork =
    process.env.NEXT_PUBLIC_NETWORK_ENV?.toLowerCase() || "devnet";
  switch (currentNetwork) {
    case "mainnet":
      return { endpoint: process.env.MAINNET_RPC_ENDPOINT || "", token: process.env.MAINNET_RPC_TOKEN };
    case "devnet":
      return { endpoint: process.env.DEVNET_RPC_ENDPOINT || "", token: process.env.DEVNET_RPC_TOKEN };
    case "testnet":
      return { endpoint: process.env.TESTNET_RPC_ENDPOINT || "", token: process.env.TESTNET_RPC_TOKEN };
    default:
      throw new ValidatorStakingError(
        "Invalid network environment variable",
        "INVALID_NETWORK_ENV"
      );
  }
}
