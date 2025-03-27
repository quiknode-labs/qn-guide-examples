import { Address, address } from "@solana/kit";

export type NetworkConfig = {
  identifier: NetworkType;
  explorerCluster: string;
};

export type NetworkType = "mainnet" | "devnet";
export const VALID_NETWORKS: NetworkType[] = ["mainnet", "devnet"];
export interface Config {
  network: NetworkType;
  networks: Record<NetworkType, NetworkConfig>;
}

const networks: Record<NetworkType, NetworkConfig> = {
  mainnet: {
    identifier: "mainnet",
    explorerCluster: "mainnet-beta"
  },
  devnet: {
    identifier: "devnet",
    explorerCluster: "devnet"
  }
};

function isValidNetwork(network: string): network is NetworkType {
  return VALID_NETWORKS.includes(network as NetworkType);
}

function getNetworkConfig(): NetworkConfig {
  const currentNetwork =
    process.env.NEXT_PUBLIC_NETWORK_ENV?.toLowerCase() || "devnet";
  if (!isValidNetwork(currentNetwork)) {
    throw new Error(`Invalid network specified: ${currentNetwork}`);
  }
  return networks[currentNetwork];
}

export function getValidatorAddress(): Address {
  const validatorAddress = process.env.NEXT_PUBLIC_VALIDATOR_ADDRESS;
  if (!validatorAddress) {
    throw new Error("Validator ENV is not set");
  }
  return address(validatorAddress);
}

export function getCurrentChain(): `solana:${string}` {
  return `solana:${getNetworkConfig().identifier}`;
}

interface ExplorerTxUrlParams {
  signature: string;
  explorer: "solana-explorer" | "solscan" | "solana-fm";
}
interface ExplorerAccountUrlParams {
  account: string;
  explorer: "solana-explorer" | "solscan" | "solana-fm";
}

export function getExplorerTxUrl({
  signature,
  explorer
}: ExplorerTxUrlParams): string {
  const networkConfig = getNetworkConfig();
  let baseUrl: string;
  switch (explorer) {
    case "solana-explorer":
      baseUrl = "https://explorer.solana.com/tx/";
      break;
    case "solscan":
      baseUrl = "https://solscan.io/tx/";
      break;
    case "solana-fm":
      baseUrl = "https://solana.fm/tx/";
      break;
    default:
      throw new Error(`Invalid explorer specified: ${explorer}`);
  }

  const clusterExtension =
    networkConfig.identifier === "devnet"
      ? `?cluster=devnet${explorer === "solana-fm" ? "-alpha" : ""}`
      : "";

  return `${baseUrl}${signature}${clusterExtension}`;
}

export function getNetworkIdentifier(): NetworkType {
  return getNetworkConfig().identifier;
}

export function getExplorerAccountUrl({
  account,
  explorer
}: ExplorerAccountUrlParams): string {
  const networkConfig = getNetworkConfig();
  let baseUrl: string;
  switch (explorer) {
    case "solana-explorer":
      baseUrl = "https://explorer.solana.com/address/";
      break;
    case "solscan":
      baseUrl = "https://solscan.io/account/";
      break;
    case "solana-fm":
      baseUrl = "https://solana.fm/address/";
      break;
    default:
      throw new Error(`Invalid explorer specified: ${explorer}`);
  }

  const clusterExtension =
    networkConfig.identifier === "devnet"
      ? `?cluster=devnet${explorer === "solana-fm" ? "-alpha" : ""}`
      : "";

  return `${baseUrl}${account}${clusterExtension}`;
}
