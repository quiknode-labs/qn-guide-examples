import { createSolanaRpc, createSolanaRpcSubscriptions, address, Address, KeyPairSigner, createKeyPairSignerFromBytes, Instruction, AccountRole, pipe, createTransactionMessage, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, appendTransactionMessageInstructions, compressTransactionMessageUsingAddressLookupTables, signTransactionMessageWithSigners, getSignatureFromTransaction, sendAndConfirmTransactionFactory, AddressesByLookupTableAddress } from "@solana/kit";
import { createJupiterApiClient, SwapApi, ResponseError, QuoteGetRequest, QuoteResponse, Instruction as JupiterInstruction, AccountMeta } from '@jup-ag/api';
import { findAssociatedTokenPda } from "@solana-program/token";
import { fetchAddressLookupTable } from "@solana-program/address-lookup-table";
import * as fs from 'fs';
import * as path from 'path';

const LAMPORTS_PER_SOL = 1_000_000_000n;

interface ArbBotConfig {
    solanaEndpoint: string; // e.g., "https://ex-am-ple.solana-mainnet.quiknode.pro/123456/"
    metisEndpoint: string;  // e.g., "https://jupiter-swap-api.quiknode.pro/123456/"
    secretKey: Uint8Array;
    firstTradePrice: number; // e.g. 94 USDC/SOL
    targetGainPercentage?: number;
    checkInterval?: number;
    initialInputToken: SwapToken;
    initialInputAmount: number;
}

interface NextTrade extends QuoteGetRequest {
    nextTradeThreshold: number;
}

export enum SwapToken {
    SOL,
    USDC
}

interface LogSwapArgs {
    inputToken: string;
    inAmount: string;
    outputToken: string;
    outAmount: string;
    txId: string;
    timestamp: string;
}

export class ArbBot {
    private rpc: ReturnType<typeof createSolanaRpc>;
    private rpcSubscriptions: ReturnType<typeof createSolanaRpcSubscriptions>;
    private sendAndConfirmTransaction!: ReturnType<typeof sendAndConfirmTransactionFactory>;
    private jupiterApi: SwapApi;
    private wallet!: KeyPairSigner;
    private secretKey: Uint8Array;
    private usdcMint: Address = address("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
    private solMint: Address = address("So11111111111111111111111111111111111111112");
    private usdcTokenAccount!: Address;
    private solBalance: bigint = 0n;
    private usdcBalance: number = 0;
    private checkInterval: number = 1000 * 10; 
    private lastCheck: number = 0;
    private priceWatchIntervalId?: NodeJS.Timeout;
    private targetGainPercentage: number = 1;
    private nextTrade: NextTrade;
    private waitingForConfirmation: boolean = false;

    constructor(config: ArbBotConfig) {
        const { 
            solanaEndpoint, 
            metisEndpoint, 
            secretKey, 
            targetGainPercentage,
            checkInterval,
            initialInputToken,
            initialInputAmount,
            firstTradePrice
        } = config;
        this.rpc = createSolanaRpc(solanaEndpoint);
        this.rpcSubscriptions = createSolanaRpcSubscriptions(solanaEndpoint.replace('https://', 'wss://'));
        this.jupiterApi = createJupiterApiClient({ basePath: metisEndpoint });
        this.secretKey = secretKey;
        if (targetGainPercentage) { this.targetGainPercentage = targetGainPercentage }
        if (checkInterval) { this.checkInterval = checkInterval }
        this.nextTrade = {
            inputMint: initialInputToken === SwapToken.SOL ? this.solMint : this.usdcMint,
            outputMint: initialInputToken === SwapToken.SOL ? this.usdcMint : this.solMint,
            amount: initialInputAmount,
            slippageBps: 300,
            nextTradeThreshold: firstTradePrice,
        };
    }

    async init(): Promise<void> {
        this.wallet = await createKeyPairSignerFromBytes(this.secretKey);
        this.sendAndConfirmTransaction = sendAndConfirmTransactionFactory({ rpc: this.rpc, rpcSubscriptions: this.rpcSubscriptions });
        const [usdcTokenAccount] = await findAssociatedTokenPda({
            mint: this.usdcMint,
            owner: this.wallet.address,
            tokenProgram: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        });
        this.usdcTokenAccount = usdcTokenAccount;
        console.log(`🤖 Initiating arb bot for wallet: ${this.wallet.address}.`)
        await this.refreshBalances();
        console.log(`🏦 Current balances:\nSOL: ${Number(this.solBalance) / Number(LAMPORTS_PER_SOL)},\nUSDC: ${this.usdcBalance}`);
        this.initiatePriceWatch();
    }

    private async refreshBalances(): Promise<void> {
        try {
            const results = await Promise.allSettled([
                this.rpc.getBalance(this.wallet.address).send(),
                this.rpc.getTokenAccountBalance(this.usdcTokenAccount).send()
            ]);

            const solBalanceResult = results[0];
            const usdcBalanceResult = results[1];

            if (solBalanceResult.status === 'fulfilled') {
                this.solBalance = solBalanceResult.value.value;
            } else {
                console.error('Error fetching SOL balance:', solBalanceResult.reason);
            }

            if (usdcBalanceResult.status === 'fulfilled') {
                this.usdcBalance = usdcBalanceResult.value.value.uiAmount ?? 0;
            } else {
                this.usdcBalance = 0;
            }

            if (this.solBalance < LAMPORTS_PER_SOL / 100n) {
                this.terminateSession("Low SOL balance.");
            }
        } catch (error) {
            console.error('Unexpected error during balance refresh:', error);
        }
    }

    private initiatePriceWatch(): void {
        this.priceWatchIntervalId = setInterval(async () => {
            const currentTime = Date.now();
            if (currentTime - this.lastCheck >= this.checkInterval) {
                this.lastCheck = currentTime;
                try {
                    if (this.waitingForConfirmation) {
                        console.log('Waiting for previous transaction to confirm...');
                        return;
                    }
                    const quote = await this.getQuote(this.nextTrade);
                    this.evaluateQuoteAndSwap(quote);
                } catch (error) {
                    console.error('Error getting quote:', error);
                }
            }
        }, this.checkInterval);
    }

    private async getQuote(quoteRequest: QuoteGetRequest): Promise<QuoteResponse> {
        try {
            const quote: QuoteResponse | null = await this.jupiterApi.quoteGet(quoteRequest);
            if (!quote) {
                throw new Error('No quote found');
            }
            return quote;
        } catch (error) {
            if (error instanceof ResponseError) {
                console.log(await error.response.json());
            }
            else {
                console.error(error);
            }
            throw new Error('Unable to find quote');
        }
    }

    private async evaluateQuoteAndSwap(quote: QuoteResponse): Promise<void> {
        let difference = (parseInt(quote.outAmount) - this.nextTrade.nextTradeThreshold) / this.nextTrade.nextTradeThreshold;
        console.log(`📈 Current price: ${quote.outAmount} is ${difference > 0 ? 'higher' : 'lower'
            } than the next trade threshold: ${this.nextTrade.nextTradeThreshold} by ${Math.abs(difference * 100).toFixed(2)}%.`);
        if (parseInt(quote.outAmount) > this.nextTrade.nextTradeThreshold) {
            try {
                this.waitingForConfirmation = true;
                await this.executeSwap(quote);
            } catch (error) {
                console.error('Error executing swap:', error);
            }
        }
    }

    private async executeSwap(route: QuoteResponse): Promise<void> {
        try {
            const {
                computeBudgetInstructions,
                setupInstructions,
                swapInstruction,
                cleanupInstruction,
                addressLookupTableAddresses,
            } = await this.jupiterApi.swapInstructionsPost({
                swapRequest: {
                    quoteResponse: route,
                    userPublicKey: this.wallet.address,
                    prioritizationFeeLamports: {
                        priorityLevelWithMaxLamports: {
                            priorityLevel: 'high',
                            maxLamports: 1_000_000,
                        }
                    }
                },
            });

            const instructions: Instruction[] = [
                ...computeBudgetInstructions.map(this.jupiterInstructionToKitInstruction.bind(this)),
                ...setupInstructions.map(this.jupiterInstructionToKitInstruction.bind(this)),
                this.jupiterInstructionToKitInstruction(swapInstruction),
                this.jupiterInstructionToKitInstruction(cleanupInstruction),
            ].filter((ix): ix is Instruction => ix !== null);

            const alts = await this.getAddressLookupTableAccounts(addressLookupTableAddresses);

            const { value: latestBlockhash } = await this.rpc.getLatestBlockhash().send();

            const message = pipe(
                createTransactionMessage({ version: 0 }),
                (m) => setTransactionMessageFeePayerSigner(this.wallet, m),
                (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
                (m) => appendTransactionMessageInstructions(instructions, m),
                (m) => compressTransactionMessageUsingAddressLookupTables(m, alts),
            );

            const signedTx = await signTransactionMessageWithSigners(message);
            const signature = getSignatureFromTransaction(signedTx);
            await this.sendAndConfirmTransaction(signedTx, { commitment: 'confirmed', skipPreflight: true });
            await this.postTransactionProcessing(route, signature);
        } catch (error) {
            if (error instanceof ResponseError) {
                console.log(await error.response.json());
            }
            else {
                console.error(error);
            }
            throw new Error('Unable to execute swap');
        } finally {
            this.waitingForConfirmation = false;
        }
    }

    private async updateNextTrade(lastTrade: QuoteResponse): Promise<void> {
        const priceChange = this.targetGainPercentage / 100;
        this.nextTrade = {
            inputMint: this.nextTrade.outputMint,
            outputMint: this.nextTrade.inputMint,
            amount: parseInt(lastTrade.outAmount),
            slippageBps: 300,
            nextTradeThreshold: parseInt(lastTrade.inAmount) * (1 + priceChange),
        };
    }

    private async logSwap(args: LogSwapArgs): Promise<void> {
        const { inputToken, inAmount, outputToken, outAmount, txId, timestamp } = args;
        const logEntry = {
            inputToken,
            inAmount,
            outputToken,
            outAmount,
            txId,
            timestamp,
        };

        const filePath = path.join(__dirname, 'trades.json');

        try {
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, JSON.stringify([logEntry], null, 2), 'utf-8');
            } else {
                const data = fs.readFileSync(filePath, { encoding: 'utf-8' });
                const trades = JSON.parse(data);
                trades.push(logEntry);
                fs.writeFileSync(filePath, JSON.stringify(trades, null, 2), 'utf-8');
            }
            console.log(`✅ Logged swap: ${inAmount} ${inputToken} -> ${outAmount} ${outputToken},\n  TX: ${txId}}`);
        } catch (error) {
            console.error('Error logging swap:', error);
        }
    }

    private terminateSession(reason: string): void {
        console.warn(`❌ Terminating bot...${reason}`);
        console.log(`Current balances:\nSOL: ${Number(this.solBalance) / Number(LAMPORTS_PER_SOL)},\nUSDC: ${this.usdcBalance}`);
        if (this.priceWatchIntervalId) {
            clearInterval(this.priceWatchIntervalId);
            this.priceWatchIntervalId = undefined; // Clear the reference to the interval
        }
        setTimeout(() => {
            console.log('Bot has been terminated.');
            process.exit(1);
        }, 1000);
    }

    private jupiterInstructionToKitInstruction(
        instruction: JupiterInstruction | undefined
    ): Instruction | null {
        if (instruction === null || instruction === undefined) return null;
        return {
            programAddress: address(instruction.programId),
            accounts: instruction.accounts.map((key: AccountMeta) => ({
                address: address(key.pubkey),
                role: key.isWritable && key.isSigner ? AccountRole.WRITABLE_SIGNER
                    : key.isSigner ? AccountRole.READONLY_SIGNER
                    : key.isWritable ? AccountRole.WRITABLE
                    : AccountRole.READONLY,
            })),
            data: new Uint8Array(Buffer.from(instruction.data, 'base64')),
        };
    };

    private async getAddressLookupTableAccounts(
        keys: string[]
    ): Promise<AddressesByLookupTableAddress> {
        const result: AddressesByLookupTableAddress = {};
        await Promise.all(
            keys.map(async (key) => {
                const altAccount = await fetchAddressLookupTable(this.rpc, address(key));
                result[address(key)] = altAccount.data.addresses;
            })
        );
        return result;
    };

    private async postTransactionProcessing(quote: QuoteResponse, txid: string): Promise<void> {
        const { inputMint, inAmount, outputMint, outAmount } = quote;
        await this.updateNextTrade(quote);
        await this.refreshBalances();
        await this.logSwap({ inputToken: inputMint, inAmount, outputToken: outputMint, outAmount, txId: txid, timestamp: new Date().toISOString() });
    }
}


