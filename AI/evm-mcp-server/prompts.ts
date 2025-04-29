import { z } from "zod";
import { isAddress } from "viem";
import { ChainId, CHAINS } from "./chains";

// Register prompts with the MCP server
export const registerPrompts = (server: any) => {
  // Register check-wallet prompt
  server.prompt(
    "check-wallet",
    checkWalletSchema.shape,
    ({ address, chain }: { address: string; chain: string }) => ({
      description: "Guide for analyzing a wallet's balance and context",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please analyze this Ethereum wallet address: ${address} on ${chain} chain.
            
You need to analyze a wallet address on an EVM blockchain.

First, use the eth_getBalance tool to check the wallet's balance.
Next, use the eth_getCode tool to verify if it's a regular wallet or a contract.

Once you have this information, provide a summary of:
1. The wallet's address
2. The chain it's on
3. Its balance in the native token
4. Whether it's a regular wallet (EOA) or a contract
5. Any relevant observations about the balance (e.g., if it's empty, has significant funds, etc.)

Aim to be concise but informative in your analysis.`,
          },
        },
      ],
    })
  );

  // Register check-contract prompt
  server.prompt(
    "check-contract",
    checkContractSchema.shape,
    ({ address, chain }: { address: string; chain: string }) => ({
      description: "Prompt contract code introspection and analysis",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please analyze this contract address: ${address} on ${chain} chain.
            
You need to analyze a contract address on an EVM blockchain.

First, use the eth_getCode tool to verify if the address actually contains contract code.
If it's a contract, note the bytecode size as an indicator of complexity.
Then, use the eth_getBalance tool to check if the contract holds any native tokens.

Provide a summary with:
1. Confirmation if it's a contract or not
2. The contract's size in bytes
3. Any balance of native tokens it holds
4. What these findings might indicate (e.g., active contract with funds, abandoned contract, etc.)

Be analytical but accessible in your explanation.`,
          },
        },
      ],
    })
  );

  // Register gas-analysis prompt
  server.prompt("gas-analysis", gasAnalysisSchema.shape, ({ chain }: { chain: string }) => ({
    description: "Analyze gas price trends and evaluate timing",
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please analyze the current gas prices on the ${chain} chain.
            
You need to analyze the current gas price on an EVM blockchain.

Use the eth_gasPrice tool to retrieve the current gas price.

Provide a short analysis:
1. The current gas price in Gwei
2. What this means for transaction costs
3. Whether this is relatively high, medium, or low based on recent trends
4. Recommendations for users (wait for lower gas, proceed with transactions, etc.)

Keep your analysis concise, focusing on actionable insights.`,
        },
      },
    ],
  }));

  return server;
};

// Schema for check-wallet prompt
const checkWalletSchema = z.object({
  address: z.string().refine(isAddress, {
    message: "Invalid Ethereum address format",
  }),
  chain: z.string().refine(
    (val): val is ChainId => Object.keys(CHAINS).includes(val),
    {
      message: "Unsupported chain. Use one of: ethereum, base, arbitrum, avalanche, bsc",
    }
  ),
});

// Schema for check-contract prompt
const checkContractSchema = z.object({
  address: z.string().refine(isAddress, {
    message: "Invalid Ethereum address format",
  }),
  chain: z.string().refine(
    (val): val is ChainId => Object.keys(CHAINS).includes(val),
    {
      message: "Unsupported chain. Use one of: ethereum, base, arbitrum, avalanche, bsc",
    }
  ),
});

// Schema for gas-analysis prompt
const gasAnalysisSchema = z.object({
  chain: z.string().refine(
    (val): val is ChainId => Object.keys(CHAINS).includes(val),
    {
      message: "Unsupported chain. Use one of: ethereum, base, arbitrum, avalanche, bsc",
    }
  ),
});

// Original prompts object kept for reference
export const prompts = {
  'check-wallet': {
    schema: checkWalletSchema,
    prompt: `
You need to analyze a wallet address on an EVM blockchain.

First, use the eth_getBalance tool to check the wallet's balance.
Next, use the eth_getCode tool to verify if it's a regular wallet or a contract.

Once you have this information, provide a summary of:
1. The wallet's address
2. The chain it's on
3. Its balance in the native token
4. Whether it's a regular wallet (EOA) or a contract
5. Any relevant observations about the balance (e.g., if it's empty, has significant funds, etc.)

Aim to be concise but informative in your analysis.
    `,
  },
  
  'check-contract': {
    schema: checkContractSchema,
    prompt: `
You need to analyze a contract address on an EVM blockchain.

First, use the eth_getCode tool to verify if the address actually contains contract code.
If it's a contract, note the bytecode size as an indicator of complexity.
Then, use the eth_getBalance tool to check if the contract holds any native tokens.

Provide a summary with:
1. Confirmation if it's a contract or not
2. The contract's size in bytes
3. Any balance of native tokens it holds
4. What these findings might indicate (e.g., active contract with funds, abandoned contract, etc.)

Be analytical but accessible in your explanation.
    `,
  },
  
  'gas-analysis': {
    schema: gasAnalysisSchema,
    prompt: `
You need to analyze the current gas price on an EVM blockchain.

Use the eth_gasPrice tool to retrieve the current gas price.

Provide a short analysis:
1. The current gas price in Gwei
2. What this means for transaction costs
3. Whether this is relatively high, medium, or low based on recent trends
4. Recommendations for users (wait for lower gas, proceed with transactions, etc.)

Keep your analysis concise, focusing on actionable insights.
    `,
  },
};