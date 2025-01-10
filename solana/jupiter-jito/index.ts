import { 
    QuoteGetRequest, 
    QuoteResponse, 
    createJupiterApiClient, 
    ResponseError, 
    SwapResponse 
} from '@jup-ag/api';
import { 
    Keypair, 
    LAMPORTS_PER_SOL, 
    Connection, 
    SystemProgram, 
    PublicKey, 
    Transaction, 
    VersionedTransaction 
} from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const CONFIG = {
    METIS_ENDPOINT: process.env.METIS_ENDPOINT || 'https://public.jupiterapi.com',
    JITO_ENDPOINT: process.env.JITO_ENDPOINT || '',
    WALLET_SECRET: process.env.WALLET_SECRET?.split(',').map(Number) || [],
    JITO_TIP_AMOUNT: 0.0005 * LAMPORTS_PER_SOL, // 500,000 lamports
    POLL_TIMEOUT_MS: 30000,
    POLL_INTERVAL_MS: 3000,
    DEFAULT_WAIT_BEFORE_POLL_MS: 5000
};

// Quote request configuration
const QUOTE_REQUEST: QuoteGetRequest = {
    inputMint: "So11111111111111111111111111111111111111112", // SOL
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
    amount: LAMPORTS_PER_SOL / 1000, // 0.001 SOL
    restrictIntermediateTokens: true // https://station.jup.ag/docs/apis/landing-transactions#:~:text=()%3B-,restrictIntermediateTokens,-%3A%20Mkae%20sure%20that
};

interface BundleStatus {
    bundle_id: string;
    status: string;
    landed_slot?: number;
}

class JitoSwapManager {
    private jupiterApi;
    private wallet: Keypair;
    private connection: Connection;

    constructor() {
        this.jupiterApi = createJupiterApiClient({ basePath: CONFIG.METIS_ENDPOINT });
        this.wallet = Keypair.fromSecretKey(new Uint8Array(CONFIG.WALLET_SECRET));
        this.connection = new Connection(CONFIG.JITO_ENDPOINT);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async getSwapQuote(): Promise<QuoteResponse> {
        const quote = await this.jupiterApi.quoteGet(QUOTE_REQUEST);
        if (!quote) throw new Error('No quote found');
        return quote;
    }

    async getSwapTransaction(quote: QuoteResponse): Promise<SwapResponse> {
        const swapResult = await this.jupiterApi.swapPost({
            swapRequest: {
                quoteResponse: quote,
                userPublicKey: this.wallet.publicKey.toBase58(),
            },
        });
        if (!swapResult) throw new Error('No swap result found');
        return swapResult;
    }

    async createTipTransaction(jitoTipAccount: string): Promise<Transaction> {
        const tipTx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: this.wallet.publicKey,
                toPubkey: new PublicKey(jitoTipAccount),
                lamports: CONFIG.JITO_TIP_AMOUNT,
            })
        );
        tipTx.feePayer = this.wallet.publicKey;
        tipTx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
        tipTx.sign(this.wallet);
        return tipTx;
    }

    private convertBase64ToBase58(base64String: string): string {
        return bs58.encode(Buffer.from(base64String, 'base64'));
    }

    async getTipAccount(): Promise<string> {
        //@ts-ignore can use _rpcRequest
        const { result: tipAccounts } = await this.connection._rpcRequest("getTipAccounts", []);
        return tipAccounts[Math.floor(Math.random() * tipAccounts.length)];
    }

    async simulateBundle(b64Transactions: string[]): Promise<void> {
        //@ts-ignore can use _rpcRequest
        const result = await this.connection._rpcRequest(
            "simulateBundle",
            [{ encodedTransactions: b64Transactions }]
        );
        if (result.error) throw new Error(`Simulation failed: ${result.error}`);
        return result;
    }

    async sendBundle(base58Transactions: string[]): Promise<string> {
        //@ts-ignore can use _rpcRequest
        const { result } = await this.connection._rpcRequest(
            "sendBundle",
            [base58Transactions]
        );
        return result;
    }

    async pollBundleStatus(bundleId: string): Promise<boolean> {
        await this.sleep(CONFIG.DEFAULT_WAIT_BEFORE_POLL_MS);

        const startTime = Date.now();
        let lastStatus = '';
        
        while (Date.now() - startTime < CONFIG.POLL_TIMEOUT_MS) {
            try {
                //@ts-ignore can use _rpcRequest
                const response = await this.connection._rpcRequest("getInflightBundleStatuses", [[bundleId]]);
                const bundleStatuses: BundleStatus[] = response.result.value;
                
                const status = bundleStatuses[0].status;
                if (status !== lastStatus) {
                    lastStatus = status;
                    console.log(`Bundle status: ${status}`);
                }

                if (status === 'Landed') {
                    console.log(`Bundle landed at slot: ${bundleStatuses[0].landed_slot}`);
                    return true;
                }

                if (status === 'Failed') {
                    throw new Error(`Bundle failed with status: ${status}`);
                }

                await new Promise(resolve => setTimeout(resolve, CONFIG.POLL_INTERVAL_MS));
            } catch (error) {
                console.error('Error polling bundle status:', error);
            }
        }
        throw new Error("Polling timeout reached without confirmation");
    }

    private async checkEnvironment(): Promise<void> {
        if (!CONFIG.WALLET_SECRET.length) {
            throw new Error('No wallet secret provided');
        }
        if (!CONFIG.JITO_ENDPOINT) {
            throw new Error('No Jito endpoint provided');
        }
    }

    async executeSwap(): Promise<void> {
        try {
            await this.checkEnvironment();
            console.log(`Using Wallet: ${this.wallet.publicKey.toBase58()}`);
            
            // Get Jupiter quote and swap transaction
            console.log('Getting Swap Quote...');
            const quote = await this.getSwapQuote();
            const swapResult = await this.getSwapTransaction(quote);
            
            // Process swap transaction
            const swapTxBuf = Buffer.from(swapResult.swapTransaction, 'base64');
            const swapVersionedTx = VersionedTransaction.deserialize(swapTxBuf);
            swapVersionedTx.sign([this.wallet]);
            
            // Convert swap transaction to required formats
            const serializedSwapTx = swapVersionedTx.serialize();
            const b64SwapTx = Buffer.from(serializedSwapTx).toString('base64');
            const b58SwapTx = this.convertBase64ToBase58(b64SwapTx);
            
            // Create and process tip transaction
            const jitoTipAccount = await this.getTipAccount();
            console.log(`Using JITO Tip Account: ${jitoTipAccount}`);
            const tipTx = await this.createTipTransaction(jitoTipAccount);
            const b64TipTx = tipTx.serialize().toString('base64');
            const b58TipTx = this.convertBase64ToBase58(b64TipTx);
            
            // Simulate and send bundle
            console.log("Simulating Bundle...");
            await this.simulateBundle([b64SwapTx, b64TipTx]);
            console.log('Simulation successful');
            
            console.log("Sending Bundle...");
            const bundleId = await this.sendBundle([b58SwapTx, b58TipTx]);
            console.log('Bundle ID:', bundleId);
            
            await this.pollBundleStatus(bundleId);
            console.log(`Bundle landed successfully`);
            console.log(`https://explorer.jito.wtf/bundle/${bundleId}`);
        } catch (error) {
            if (error instanceof ResponseError) {
                console.error('API Error:', await error.response.json());
            } else {
                console.error('Error:', error);
            }
            throw error;
        }
    }
}

// Execute the swap
const swapManager = new JitoSwapManager();
swapManager.executeSwap().catch(console.error);