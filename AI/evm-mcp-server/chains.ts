// Chain configuration with Quicknode RPC endpoints
export type ChainConfig = {
  network: string;
  rpc: string;
  name: string;
  symbol: string;
  decimals: number;
};

export type ChainId = keyof typeof CHAINS;

// Make sure all environment variables are properly set
const validateEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Environment variable ${name} is not set. Please check your .env file.`
    );
  }
  return value;
};

// Get the endpoint name and token ID from environment variables
const QN_ENDPOINT_NAME = validateEnvVar("QN_ENDPOINT_NAME");
const QN_TOKEN_ID = validateEnvVar("QN_TOKEN_ID");

// Function to build Quicknode RPC URL based on network name
const buildRpcUrl = (networkName: string): string => {
  // Special case for Ethereum mainnet
  if (networkName === "mainnet") {
    return `https://${QN_ENDPOINT_NAME}.quiknode.pro/${QN_TOKEN_ID}/`;
  }

  // Special case for Avalanche mainnet
  if (networkName ==="avalanche-mainnet") {
    return `https://${QN_ENDPOINT_NAME}.${networkName}.quiknode.pro/${QN_TOKEN_ID}/ext/bc/C/rpc`;
  }
  
  // For other networks, include network name in the URL
  return `https://${QN_ENDPOINT_NAME}.${networkName}.quiknode.pro/${QN_TOKEN_ID}/`;
};

export const CHAINS = {
  ethereum: {
    network: "mainnet",
    rpc: buildRpcUrl("mainnet"),
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  base: {
    network: "base-mainnet",
    rpc: buildRpcUrl("base-mainnet"),
    name: "Base",
    symbol: "ETH",
    decimals: 18,
  },
  arbitrum: {
    network: "arbitrum-mainnet",
    rpc: buildRpcUrl("arbitrum-mainnet"),
    name: "Arbitrum",
    symbol: "ETH",
    decimals: 18,
  },
  avalanche: {
    network: "avalanche-mainnet",
    rpc: buildRpcUrl("avalanche-mainnet"),
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
  },
  bsc: {
    network: "bsc",
    rpc: buildRpcUrl("bsc"),
    name: "Binance Smart Chain",
    symbol: "BNB",
    decimals: 18,
  },
};

// Helper to get a chain by ID
export const getChain = (chainId: ChainId): ChainConfig => {
  const chain = CHAINS[chainId];
  if (!chain) {
    throw new Error(
      `Chain ${chainId} not supported. Supported chains: ${Object.keys(
        CHAINS
      ).join(", ")}`
    );
  }
  return chain;
};

// Get a list of all supported chains
export const getSupportedChains = (): string[] => {
  return Object.keys(CHAINS);
};
