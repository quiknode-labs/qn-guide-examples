import { createSolanaRpc, SolanaRpcApi, type Rpc } from "@solana/kit";
import { ValidatorStakingError } from "../errors";

export function createRpcConnection(): Rpc<SolanaRpcApi> {
  const endpoint = getRpcEndpoint();
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
    return createSolanaRpc(endpoint);
  } catch (error) {
    throw new ValidatorStakingError(
      "Failed to create Solana RPC connection",
      "RPC_CONNECTION_FAILED",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

function getRpcEndpoint(): string {
  const currentNetwork =
    process.env.NEXT_PUBLIC_NETWORK_ENV?.toLowerCase() || "devnet";
  switch (currentNetwork) {
    case "mainnet":
      return process.env.MAINNET_RPC_ENDPOINT || "";
    case "devnet":
      return process.env.DEVNET_RPC_ENDPOINT || "";
    case "testnet":
      return process.env.TESTNET_RPC_ENDPOINT || "";
    default:
      throw new ValidatorStakingError(
        "Invalid network environment variable",
        "INVALID_NETWORK_ENV"
      );
  }
}
