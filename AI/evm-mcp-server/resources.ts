/**
 * Resources file for useful references about EVM blockchains
 * Optional, but can be used to enhance LLM agent performance
 */

// Register resources with the MCP server
export const registerResources = (server: any) => {
  // Register gas reference resource
  server.resource(
    "gas-reference",
    "evm://docs/gas-reference",
    async (uri: URL) => {
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(gasReferencePoints, null, 2),
          },
        ],
      };
    }
  );

  // Register block explorers resource
  server.resource(
    "block-explorers",
    "evm://docs/block-explorers",
    async (uri: URL) => {
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(blockExplorers, null, 2),
          },
        ],
      };
    }
  );

  // Register supported chains resource
  server.resource(
    "supported-chains",
    "evm://docs/supported-chains",
    async (uri: URL) => {
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(supportedChains, null, 2),
          },
        ],
      };
    }
  );

  return server;
};

// Gas price reference points (in Gwei)
const gasReferencePoints = {
  ethereum: {
    low: 20,
    average: 40,
    high: 100,
    veryHigh: 200,
  },
  base: {
    low: 0.05,
    average: 0.1,
    high: 0.3,
    veryHigh: 0.5,
  },
  arbitrum: {
    low: 0.1,
    average: 0.25,
    high: 0.5,
    veryHigh: 1.0,
  },
  avalanche: {
    low: 1,
    average: 5,
    high: 20,
    veryHigh: 50,
  },
  bsc: {
    low: 3,
    average: 5,
    high: 10,
    veryHigh: 20,
  },
};

// Block explorer URLs by chain
const blockExplorers = {
  ethereum: 'https://etherscan.io',
  base: 'https://basescan.org',
  arbitrum: 'https://arbiscan.io',
  avalanche: 'https://snowtrace.io',
  bsc: 'https://bscscan.com',
};

const supportedChains = {
  ethereum: {
    network: "mainnet",
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  base: {
    network: "base-mainnet",
    name: "Base",
    symbol: "ETH",
    decimals: 18,
  },
  arbitrum: {
    network: "arbitrum-mainnet",
    name: "Arbitrum",
    symbol: "ETH",
    decimals: 18,
  },
  avalanche: {
    network: "avalanche-mainnet",
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
  },
  bsc: {
    network: "bsc",
    name: "Binance Smart Chain",
    symbol: "BNB",
    decimals: 18,
  },
};