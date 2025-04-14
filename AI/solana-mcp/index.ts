import {
    McpServer,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
    createSolanaRpc,
    address,
    isSolanaError,
    assertIsAddress,
    assertIsSignature,
} from "@solana/kit";

const CONFIG = {
    rpcEndpoint:
        process.env.SOLANA_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com",
};
const SPL_PROGRAM_KEYS = {
    TOKEN_PROGRAM: address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    TOKEN_2022_PROGRAM: address("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
};

const solanaRpc = createSolanaRpc(CONFIG.rpcEndpoint);

const server = new McpServer({
    name: "SolanaMCP",
    version: "1.0.0",
});

server.tool(
    "getBalance",
    {
        walletAddress: z
            .string()
            .describe("Solana wallet address to check the balance for"),
    },
    async (args: { walletAddress: string }) => {
        try {
            assertIsAddress(args.walletAddress);
            const accountAddress = address(args.walletAddress);

            const { value: lamports } = await solanaRpc
                .getBalance(accountAddress)
                .send();

            const solBalance = Number(lamports) / 1_000_000_000;

            return {
                content: [
                    {
                        type: "text" as const,
                        text: `Balance for ${args.walletAddress}: ${solBalance} SOL (${lamports.toString()} lamports)`,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error while getting balance: ${isSolanaError(error) ? error.message : "Unknown error"}`,
                    },
                ],
                isError: true,
            };
        }
    },
);

server.tool(
    "getTokenAccounts",
    {
        walletAddress: z
            .string()
            .describe("Solana wallet address to check token accounts for"),
    },
    async ({ walletAddress }) => {
        try {
            assertIsAddress(walletAddress);

            const accounts = await Promise.all([
                solanaRpc
                    .getTokenAccountsByOwner(
                        walletAddress,
                        { programId: SPL_PROGRAM_KEYS.TOKEN_PROGRAM },
                        { encoding: "jsonParsed" },
                    )
                    .send(),
                solanaRpc
                    .getTokenAccountsByOwner(
                        walletAddress,
                        { programId: SPL_PROGRAM_KEYS.TOKEN_2022_PROGRAM },
                        { encoding: "jsonParsed" },
                    )
                    .send(),
            ]);
            const tokenAccounts = accounts.flat();

            const tokenAccountDetails = tokenAccounts.flatMap((account) => {
                return account.value.map((account) => {
                    const address = account.pubkey;
                    const mint = account.account.data.parsed.info.mint;
                    const amount = account.account.data.parsed.info.tokenAmount.uiAmount;
                    const decimals =
                        account.account.data.parsed.info.tokenAmount.decimals;
                    return { address, mint, amount, decimals };
                });
            });

            // Format data as a markdown table
            let markdownTable = "| Token Address | Mint | Amount | Decimals |\n";
            markdownTable += "|-------------|------|--------|----------|\n";

            tokenAccountDetails
                .filter((account) => account.amount !== null)
                .filter((account) => account.amount !== 0)
                .filter((account) => account.amount !== 1) // removing possible NFTs
                .sort((a, b) => b.amount! - a.amount!) // we already removed null and 0 amounts
                .forEach((account) => {
                    markdownTable += `| ${account.address} | ${account.mint} | ${account.amount} | ${account.decimals} |\n`;
                });

            return {
                content: [
                    {
                        type: "text",
                        text: `Found ${tokenAccountDetails.length} token accounts for ${walletAddress}`,
                    },
                    {
                        type: "text",
                        text: markdownTable,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error while getting balance: ${isSolanaError(error) ? error.message : "Unknown error"}`,
                    },
                ],
                isError: true,
            };
        }
    },
);

server.tool("networkStatus", {}, async () => {
    try {
        await solanaRpc.getHealth().send();
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Network is down`,
                },
            ],
        };
    }
    try {
        const { epoch, blockHeight, absoluteSlot } = await solanaRpc
            .getEpochInfo()
            .send();

        const status = {
            health: "okay",
            currentEpoch: epoch.toString(),
            blockHeight: blockHeight.toString(),
            currentSlot: absoluteSlot.toString(),
        };

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(status, null, 2),
                },
            ],
        };
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error while getting network status: ${isSolanaError(error) ? error.message : "Unknown error"}`,
                },
            ],
            isError: true,
        };
    }
});

server.tool(
    "getTransaction",
    {
        signature: z.string().describe("Solana transaction signature to look up"),
    },
    async ({ signature }) => {
        try {
            assertIsSignature(signature);
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `not a vaid signature: ${signature}`,
                    },
                ],
                isError: true,
            };
        }
        try {
            const transaction = await solanaRpc
                .getTransaction(signature, {
                    maxSupportedTransactionVersion: 0,
                    encoding: "json",
                })
                .send();

            if (!transaction) {
                return {
                    content: [
                        { type: "text", text: `Transaction ${signature} not found` },
                    ],
                    isError: true,
                };
            }

            const programIndices = transaction.transaction.message.instructions.map(
                (instruction) => instruction.programIdIndex,
            );
            const programsInvoked = programIndices.map((index) => {
                const programId = transaction.transaction.message.accountKeys[index];
                return programId.toString();
            });

            // Format the transaction data for readability
            const formattedTx = {
                signature,
                computeUnits: transaction.meta?.computeUnitsConsumed?.toString(),
                logs: transaction.meta?.logMessages,
                accountKeys: transaction.transaction.message.accountKeys,
                programsInvoked: programsInvoked,
                instructions: transaction.transaction.message.instructions,
                slot: transaction.slot.toString(),
                blockTime: transaction.blockTime
                    ? new Date(Number(transaction.blockTime) * 1000).toISOString()
                    : null,
                fee: transaction.meta?.fee.toString(),
                status: transaction.meta?.err ? "Failed" : "Success",
                preBalances: transaction.meta?.preBalances.map((balance) =>
                    balance.toString(),
                ),
                postBalances: transaction.meta?.postBalances.map((balance) =>
                    balance.toString(),
                ),
                preTokenBalances: transaction.meta?.preTokenBalances,
                postTokenBalances: transaction.meta?.postTokenBalances,
            };

            return {
                content: [
                    {
                        type: "text",
                        text: `Transaction ${signature}:\n${JSON.stringify(formattedTx, null, 2)}`,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error while getting balance: ${isSolanaError(error) ? error.message : "Unknown error"}`,
                    },
                ],
                isError: true,
            };
        }
    },
);

server.tool(
    "getAccountInfo",
    {
        walletAddress: z
            .string()
            .describe("Solana wallet address to check account information for"),
    },
    async ({ walletAddress }) => {
        try {
            assertIsAddress(walletAddress);
            const accountAddress = address(walletAddress);

            const { value: accountInfo } = await solanaRpc
                .getAccountInfo(accountAddress)
                .send();

            if (!accountInfo) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Account ${walletAddress} not found or has no SOL balance`,
                        },
                    ],
                    isError: true,
                };
            }

            const info = {
                executable: accountInfo.executable,
                lamports: accountInfo.lamports.toString(),
                owner: accountInfo.owner.toString(),
                rentEpoch: accountInfo.rentEpoch.toLocaleString(),
                space: accountInfo.data.length,
            };

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(info, null, 2),
                    },
                ],
            };
        } catch (error) {
            console.error("Error fetching account info:", error);
            return {
                content: [
                    {
                        type: "text",
                        text: `Error while getting account info: ${isSolanaError(error) ? error.message : "Unknown error"}`,
                    },
                ],
                isError: true,
            };
        }
    },
);

server.resource(
    "transaction-optimization",
    "solana://docs/transaction-optimization",
    async (uri) => {
        const optimizationGuide = {
            title: "Solana Transaction Optimization Strategies",
            strategies: {
                priority_fees: {
                    description: "Increase transaction priority in validator queues",
                    implementation:
                        "Use ComputeBudgetProgram.setComputeUnitPrice({microLamports})",
                    best_practice:
                        "Use QN Priority Fee API to determine optimal fee based on network conditions",
                },
                compute_units: {
                    description:
                        "Optimize compute unit usage to prevent transaction drops",
                    current_limits: {
                        per_block: "48 million",
                        per_account_per_block: "12 million",
                        per_transaction: "1.4 million",
                        transaction_default: "200,000",
                    },
                    implementation:
                        "Use ComputeBudgetProgram.setComputeUnitLimit({units}) after simulation",
                },
                transaction_assembly: {
                    steps: [
                        "Create transaction with instructions",
                        "Fetch and add priority fees",
                        "Simulate transaction to determine compute usage",
                        "Set compute limit based on simulation",
                        "Add recent blockhash",
                        "Sign and send",
                    ],
                },
                jito_bundles: {
                    description: "Bundle multiple transactions for atomic execution",
                    requires: "SOL transfer to Jito Tip Account",
                },
                confirmation: {
                    description: "Poll transaction status to ensure it landed",
                    method: "Use getSignatureStatuses and implement retry logic",
                },
            },
            moreInfo: "https://www.quicknode.com/docs/solana/transactions",
        };

        return {
            contents: [
                {
                    uri: uri.href,
                    text: JSON.stringify(optimizationGuide, null, 2),
                },
            ],
        };
    },
);


server.prompt(
    "analyze-wallet",
    { walletAddress: z.string() },
    ({ walletAddress }) => ({
        description:
            "Analyze a Solana wallet address and provide a summary of its balances and activity",
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Please analyze this Solana wallet address: ${walletAddress}
  
  1. What is the SOL balance of this wallet?
  2. What token balances does this wallet hold?
  3. Provide a summary of recent activity if possible.`,
                },
            },
        ],
    }),
);

server.prompt(
    "explain-transaction",
    { signature: z.string() },
    ({ signature }) => ({
        description: "Analyze and explain a Solana transaction in simple terms",
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Please analyze this Solana transaction signature: ${signature}
  
  1. Was this transaction successful?
  2. What type of transaction is this? (e.g., token transfer, swap, NFT mint)
  3. What accounts were involved?
  4. Explain what happened in simple terms.`,
                },
            },
        ],
    }),
);

async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

runServer().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});