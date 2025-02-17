/**
 * This Sample Code is for Educational Purposes Only
 * 
 * Supporting Guide:
 * https://www.quicknode.com/guides/solana-development/defi/pump-fun-copy-trade
 * 
 * This code is for educational purposes only and should not be considered 
 * financial advice. Trading bots can be risky and may result in financial
 * loss. Always do your own research and consider consulting with a financial
 * advisor before using trading bots or engaging in trading activities. Make
 * sure any code you run is secure and thoroughly tested before using it 
 * with real funds.
 * 
 */

require("dotenv").config();
const fs = require("fs");
const fetch = require("node-fetch");
const bs58 = require("bs58").default;
const {
    Connection,
    Keypair,
    VersionedTransaction,
    LAMPORTS_PER_SOL,
    PublicKey,
} = require("@solana/web3.js");
const Client = require("@triton-one/yellowstone-grpc").default;
const { CommitmentLevel } = require("@triton-one/yellowstone-grpc");

class CopyTradeBot {
    config = {
        WATCH_LIST: [
            "WALLET_TO_TRACK_1",
            "WALLET_TO_TRACK_2",
            "WALLET_TO_TRACK_3",
            //...
        ],
        PUMP_FUN: {
            PROGRAM_ID: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
            FEE_ACCOUNT: "CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM",
            BUY_DISCRIMINATOR: Buffer.from([102, 6, 61, 18, 1, 218, 235, 234]),
            SELL_DISCRIMINATOR: Buffer.from([51, 230, 133, 164, 1, 127, 131, 173]),
            TOKEN_DECIMALS: 6,
            TARGET_ACCOUNTS: {
                BUY: [
                    { name: "mint", index: 2 },
                    { name: "user", index: 6 },
                ],
                SELL: [
                    { name: "mint", index: 2 },
                    { name: "user", index: 6 },
                ],
            },
        },
        MIN_TX_AMOUNT: LAMPORTS_PER_SOL / 1000,
        BUY_AMOUNT: LAMPORTS_PER_SOL / 1000,
        LOG_FILE: "pump_fun_swaps.json",
        COMMITMENT: CommitmentLevel.CONFIRMED,
        TEST_MODE: true
    };

    constructor() {
        this.validateEnv();

        this.connection = new Connection(process.env.SOLANA_RPC);
        this.wallet = Keypair.fromSecretKey(
            Uint8Array.from(JSON.parse(process.env.SECRET_KEY))
        );

        console.log("🤖 Bot wallet:", this.wallet.publicKey.toBase58());
        console.log("Watching addresses:");
        this.config.WATCH_LIST.forEach((address) => console.log("   -", address));
    }

    validateEnv = () => {
        const requiredEnvs = [
            "SOLANA_RPC",
            "SECRET_KEY",
            "METIS_ENDPOINT",
            "YELLOWSTONE_ENDPOINT",
            "YELLOWSTONE_TOKEN",
        ];
        requiredEnvs.forEach((env) => {
            if (!process.env[env]) {
                throw new Error(`Missing required environment variable: ${env}`);
            }
        });
    };

    fetchSwapTransaction = async ({
        wallet,
        type,
        mint,
        inAmount,
        priorityFeeLevel = "high",
        slippageBps = "100",
    }) => {
        const body = JSON.stringify({
            wallet,
            type,
            mint,
            inAmount,
            priorityFeeLevel,
            slippageBps,
        });
        const res = await fetch(`${process.env.METIS_ENDPOINT}/pump-fun/swap`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
        });
        if (!res.ok) {
            throw new Error(`Swap instructions fetch error: ${await res.text()}`);
        }
        return res.json();
    };

    signTransaction = async (swapTransaction) => {
        const transaction = VersionedTransaction.deserialize(
            Buffer.from(swapTransaction, "base64")
        );
        const latestBlockHash = await this.connection.getLatestBlockhash();
        transaction.message.recentBlockhash = latestBlockHash.blockhash;
        transaction.sign([this.wallet]);
        const txBuffer = Buffer.from(transaction.serialize());
        const txBase64 = txBuffer.toString("base64");
        return txBase64;
    };

    sendAndConfirmTransaction = async (signedTxBase64) => {
        try {
            const txid = await this.connection.sendEncodedTransaction(signedTxBase64, {
                skipPreflight: false,
                encoding: 'base64'
            });
            const timeout = 30 * 1000;
            const pollInterval = 3 * 1000;
            const start = Date.now();

            while (Date.now() - start < timeout) {
                const response = await this.connection.getSignatureStatuses([txid]);
                if (!response) {
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                    continue;
                }

                const statuses = response.value;

                if (!statuses || statuses.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                    continue;
                }

                const status = statuses[0];

                if (status === null) {
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                    continue;
                }

                if (status.err) {
                    throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
                }

                if (status.confirmationStatus && (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized')) {
                    return txid;
                }

                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
            throw new Error(`Transaction confirmation timeout after ${timeout}ms`);

        } catch (error) {
            throw { error, base64: Buffer.from(rawTransaction).toString("base64") };
        }
    };

    logSwap = (swapLog) => {
        const logs = fs.existsSync(this.config.LOG_FILE)
            ? JSON.parse(fs.readFileSync(this.config.LOG_FILE, "utf-8"))
            : [];
        logs.push(swapLog);
        fs.writeFileSync(this.config.LOG_FILE, JSON.stringify(logs, null, 2));
    };

    handleWhaleBuy = async (whalePubkey, tokenMint, lamportsSpent, copiedTxid) => {
        if (lamportsSpent < this.config.MIN_TX_AMOUNT) return;
        try {
            const inAmount = this.config.BUY_AMOUNT;
            const response = await this.fetchSwapTransaction({
                wallet: this.wallet.publicKey.toBase58(),
                type: "BUY",
                mint: tokenMint,
                inAmount,
                slippageBps: "300",
            });

            if (!response.tx) {
                throw new Error(`Unexpected response format: ${JSON.stringify(response)}`);
            }
            const { tx } = response;
            const signedTransaction = await this.signTransaction(tx);
            let txid = 'Simulated-TxID';
            if (!this.config.TEST_MODE) {
                txid = await this.sendAndConfirmTransaction(signedTransaction);
            }

            console.log("🎯 - COPY - TxID:", txid);

            this.logSwap({
                event: "COPY_BUY",
                txid,
                copiedTxid,
                tokenMint,
                lamportsSpent,
                whalePubkey,
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            this.logSwap({
                event: "COPY_BUY_ERROR",
                error:
                    typeof err === "string"
                        ? err
                        : err && typeof err.message === "string"
                            ? err.message
                            : JSON.stringify(err, null, 2) || "Unknown error",
                copiedTxid,
                timestamp: new Date().toISOString(),
            });
        }
    };

    createSubscribeRequest = () => {
        const { WATCH_LIST, PUMP_FUN, COMMITMENT } = this.config;
        return {
            accounts: {},
            slots: {},
            transactions: {
                pumpFun: {
                    accountInclude: WATCH_LIST,
                    accountExclude: [],
                    accountRequired: [PUMP_FUN.FEE_ACCOUNT, PUMP_FUN.PROGRAM_ID],
                },
            },
            transactionsStatus: {},
            entry: {},
            blocks: {},
            blocksMeta: {},
            commitment: COMMITMENT,
            accountsDataSlice: [],
            ping: undefined,
        };
    };

    sendSubscribeRequest = (stream, request) => {
        return new Promise((resolve, reject) => {
            stream.write(request, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    };

    handleStreamEvents = (stream) => {
        return new Promise((resolve, reject) => {
            stream.on("data", this.handleData);
            stream.on("error", (error) => {
                console.error("Stream error:", error);
                reject(error);
                stream.end();
            });
            stream.on("end", () => {
                console.log("Stream ended");
                resolve();
            });
            stream.on("close", () => {
                console.log("Stream closed");
                resolve();
            });
        });
    };

    handleData = (data) => {
        if (
            !this.isSubscribeUpdateTransaction(data) ||
            !data.filters.includes("pumpFun")
        ) {
            return;
        }
        const transaction = data.transaction?.transaction;
        const message = transaction?.transaction?.message;
        const innerInstructions = transaction?.meta?.innerInstructions;
        const flattenedInnerInstructions =
            innerInstructions?.flatMap((ix) => ix.instructions || []) || [];

        const allInstructions = [
            ...message.instructions,
            ...flattenedInnerInstructions,
        ];

        if (!transaction || !message || transaction?.meta?.err) return;

        const formattedSignature = this.convertSignature(transaction.signature);
        const matching = allInstructions.find(this.matchesInstructionDiscriminator);
        if (!matching) {
            console.log(`❓ - Unknown - TxID: ${formattedSignature.base58}`);
            return;
        }

        const { amount, solAmount } = this.getInstructionData(matching.data);
        if (solAmount < this.config.MIN_TX_AMOUNT) return;

        const txType = this.getTransactionType(matching.data);
        const icon = txType === "SELL" ? "📉" : txType === "BUY" ? "🎯" : "❓";
        console.log(`${icon} - ${txType} - TxID: ${formattedSignature.base58}`);

        const accountKeys = message.accountKeys;
        const accountsToInclude = this.config.PUMP_FUN.TARGET_ACCOUNTS[txType];
        const includedAccounts = accountsToInclude.reduce((acc, { name, index }) => {
            const accountIndex = matching.accounts[index];
            const publicKey = accountKeys[accountIndex];
            acc[name] = new PublicKey(publicKey).toBase58();
            return acc;
        }, {});

        if (includedAccounts.mint) {
            console.log("            Mint:", includedAccounts.mint);
        }
        if (includedAccounts.user) {
            console.log("            User:", includedAccounts.user);
        }
        console.log(
            "            Token Amount:",
            amount / Math.pow(10, this.config.PUMP_FUN.TOKEN_DECIMALS)
        );
        console.log("            SOL Amount:", solAmount / LAMPORTS_PER_SOL);

        if (txType === "BUY") {
            (async () => {
                try {
                    await this.handleWhaleBuy(
                        includedAccounts.user,
                        includedAccounts.mint,
                        solAmount,
                        formattedSignature.base58
                    );
                } catch (error) {
                    console.error("Error in handleWhaleBuy:", error);
                }
            })();
        }
    };

    isSubscribeUpdateTransaction = (data) => {
        return (
            "transaction" in data &&
            typeof data.transaction === "object" &&
            data.transaction !== null &&
            "slot" in data.transaction &&
            "transaction" in data.transaction
        );
    };

    convertSignature = (signature) => {
        return { base58: bs58.encode(Buffer.from(signature)) };
    };

    parseU64 = (data, offset) => {
        const slice = data.slice(offset, offset + 8);
        const dataView = new DataView(
            slice.buffer,
            slice.byteOffset,
            slice.byteLength
        );
        return Number(dataView.getBigUint64(0, true));
    };

    getInstructionData = (instructionData) => {
        const amount = this.parseU64(instructionData, 8);
        const solAmount = this.parseU64(instructionData, 16);
        return { amount, solAmount };
    };

    getTransactionType = (instructionData) => {
        if (!instructionData) return "Unknown";
        if (
            this.config.PUMP_FUN.SELL_DISCRIMINATOR.equals(
                instructionData.slice(0, 8)
            )
        ) {
            return "SELL";
        } else if (
            this.config.PUMP_FUN.BUY_DISCRIMINATOR.equals(
                instructionData.slice(0, 8)
            )
        ) {
            return "BUY";
        }
        return "Unknown";
    };

    matchesInstructionDiscriminator = (ix) => {
        if (!ix?.data) return false;
        return (
            this.config.PUMP_FUN.SELL_DISCRIMINATOR.equals(ix.data.slice(0, 8)) ||
            this.config.PUMP_FUN.BUY_DISCRIMINATOR.equals(ix.data.slice(0, 8))
        );
    };

    monitorWhales = async () => {
        console.log("Monitoring whales...");
        const client = new Client(
            process.env.YELLOWSTONE_ENDPOINT,
            process.env.YELLOWSTONE_TOKEN,
            {}
        );
        const stream = await client.subscribe();
        const request = this.createSubscribeRequest();

        try {
            await this.sendSubscribeRequest(stream, request);
            console.log(
                "Geyser connection established - watching whale Pump.fun activity."
            );
            await this.handleStreamEvents(stream);
        } catch (error) {
            console.error("Error in subscription process:", error);
            stream.end();
        }
    };

    start = async () => {
        console.log("🤖 Pump.fun Copy Trading Bot Starting...");
        this.monitorWhales();
    };

}

async function main() {
    const bot = new CopyTradeBot();
    await bot.start();
}

main().catch(console.error);