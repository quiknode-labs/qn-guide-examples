import { z } from "zod";
import { formatEther, isAddress } from "viem";
import { getPublicClient } from "./clients";
import { ChainId, getChain, CHAINS } from "./chains";

// Register tools with the MCP server
export const registerTools = (server: any) => {
  // Register eth_getBalance tool
  server.tool(
    "eth_getBalance",
    balanceSchema.shape,
    async (args: z.infer<typeof balanceSchema>) => {
      try {
        const result = await getBalance(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting balance: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register eth_getCode tool
  server.tool(
    "eth_getCode",
    codeSchema.shape,
    async (args: z.infer<typeof codeSchema>) => {
      try {
        const result = await getCode(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting code: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register eth_gasPrice tool
  server.tool(
    "eth_gasPrice",
    gasPriceSchema.shape,
    async (args: z.infer<typeof gasPriceSchema>) => {
      try {
        const result = await getGasPrice(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting gas price: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
};

// Schema for eth_getBalance tool
const balanceSchema = z.object({
  address: z.string().refine(isAddress, {
    message: "Invalid Ethereum address format",
  }),
  chain: z
    .string()
    .refine((val): val is ChainId => Object.keys(CHAINS).includes(val), {
      message:
        "Unsupported chain. Use one of: ethereum, base, arbitrum, avalanche, bsc",
    }),
});

// Schema for eth_getCode tool
const codeSchema = z.object({
  address: z.string().refine(isAddress, {
    message: "Invalid Ethereum address format",
  }),
  chain: z
    .string()
    .refine((val): val is ChainId => Object.keys(CHAINS).includes(val), {
      message:
        "Unsupported chain. Use one of: ethereum, base, arbitrum, avalanche, bsc",
    }),
});

// Schema for eth_gasPrice tool
const gasPriceSchema = z.object({
  chain: z
    .string()
    .refine((val): val is ChainId => Object.keys(CHAINS).includes(val), {
      message:
        "Unsupported chain. Use one of: ethereum, base, arbitrum, avalanche, bsc",
    }),
});

/**
 * Get the balance of an Ethereum address on the specified chain
 */
export const getBalance = async (params: z.infer<typeof balanceSchema>) => {
  const { address, chain } = balanceSchema.parse(params);

  try {
    const client = getPublicClient(chain as ChainId);
    const chainInfo = getChain(chain as ChainId);

    // Get balance in wei
    const balanceWei = await client.getBalance({ address });

    // Format balance to ETH/native token
    const balanceFormatted = formatEther(balanceWei);

    return {
      address,
      chain: chainInfo.name,
      balanceWei: balanceWei.toString(),
      balanceFormatted: `${balanceFormatted} ${chainInfo.symbol}`,
      symbol: chainInfo.symbol,
      decimals: chainInfo.decimals,
    };
  } catch (error) {
    return {
      error: `Failed to get balance: ${(error as Error).message}`,
    };
  }
};

/**
 * Get the code at an Ethereum address to determine if it's a contract
 */
export const getCode = async (params: z.infer<typeof codeSchema>) => {
  const { address, chain } = codeSchema.parse(params);

  try {
    const client = getPublicClient(chain as ChainId);
    const chainInfo = getChain(chain as ChainId);

    // Get code at the address
    const code = await client.getBytecode({ address });

    // If code length is 0 or code is '0x', it's an EOA (externally owned account/wallet)
    // Otherwise, it's a contract
    const isContract = code !== undefined && code !== "0x";

    return {
      address,
      chain: chainInfo.name,
      isContract,
      bytecodeSize: code ? (code.length - 2) / 2 : 0, // Convert hex string size to bytes
      bytecode: code || "0x",
    };
  } catch (error) {
    return {
      error: `Failed to get code: ${(error as Error).message}`,
    };
  }
};

/**
 * Get the current gas price on the specified chain
 */
export const getGasPrice = async (params: z.infer<typeof gasPriceSchema>) => {
  const { chain } = gasPriceSchema.parse(params);

  try {
    const client = getPublicClient(chain as ChainId);
    const chainInfo = getChain(chain as ChainId);

    // Get gas price in wei
    const gasPriceWei = await client.getGasPrice();

    // Convert to Gwei (1 Gwei = 10^9 wei)
    const gasPriceGwei = Number(gasPriceWei) / 1e9;

    return {
      chain: chainInfo.name,
      gasPriceWei: gasPriceWei.toString(),
      gasPriceGwei: gasPriceGwei.toFixed(2),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      error: `Failed to get gas price: ${(error as Error).message}`,
    };
  }
};

// Export all tools with their schemas
// Original tools object kept for reference
export const tools = {
  eth_getBalance: {
    handler: getBalance,
    schema: balanceSchema,
    description: "Get the ETH/native token balance of an address",
  },
  eth_getCode: {
    handler: getCode,
    schema: codeSchema,
    description: "Detect whether an address is a contract or wallet",
  },
  eth_gasPrice: {
    handler: getGasPrice,
    schema: gasPriceSchema,
    description: "Get the current gas price on the specified chain",
  },
};
