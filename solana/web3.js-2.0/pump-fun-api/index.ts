import {
    Rpc,
    createRpc,
    RpcTransport,
    createJsonRpcApi,
    address,
    getBase64Encoder,
    FullySignedTransaction,
    TransactionMessageBytes,
    getTransactionDecoder,
    signTransaction,
    createKeyPairFromBytes,
    TransactionWithBlockhashLifetime,
    getSignatureFromTransaction,
    createSolanaRpcSubscriptions,
    sendAndConfirmTransactionFactory,
    createSolanaRpc,
    SolanaRpcApi,
    RpcSubscriptions,
    SolanaRpcSubscriptionsApi,
    getAddressFromPublicKey
} from "@solana/kit";
import {
    HttpRequestMethod,
    PumpFunEndpoint,
    PumpFunQuoteParams,
    PumpFunQuoteResponse,
    PumpFunRequest,
    PumpFunSwapInstructionsResponse,
    PumpFunSwapParams,
    PumpFunSwapResponse,
    SignAndSendTransactionParams
} from "./types";
import dotenv from 'dotenv';

dotenv.config();

type MetisPumpFunApi = {
    pumpfun_quote(params: PumpFunQuoteParams): Promise<PumpFunQuoteResponse>;
    pumpfun_swap(params: PumpFunSwapParams): Promise<PumpFunSwapResponse>;
    pumpfun_swap_instructions(params: PumpFunSwapParams): Promise<PumpFunSwapInstructionsResponse>;
}

const METHOD_TO_ENDPOINT: Record<string, PumpFunEndpoint> = {
    pumpfun_quote: {
        path: 'pump-fun/quote',
        method: 'GET'
    },
    pumpfun_swap: {
        path: 'pump-fun/swap',
        method: 'POST'
    },
    pumpfun_swap_instructions: {
        path: 'pump-fun/swap-instructions',
        method: 'POST'
    }
};

function createPumpFunUrl(metisEndpoint: string, method: string): URL {
    const baseUrl = metisEndpoint.replace(/\/$/, ''); // Remove trailing slash if present
    const endpointPath = METHOD_TO_ENDPOINT[method].path;
    return new URL(`${baseUrl}/${endpointPath}`);
}

function createPumpFunTransport(metisEndpoint: string): RpcTransport {
    return async <TResponse>(...args: Parameters<RpcTransport>): Promise<TResponse> => {
        const { method, params } = args[0].payload as { method: string; params: PumpFunRequest };
        const url = createPumpFunUrl(metisEndpoint, method);
        const normalizedParams = Array.isArray(params) ? params[0] : params;
        switch (METHOD_TO_ENDPOINT[method].method) {
            case 'GET':
                return handlePumpFunGET<PumpFunRequest, TResponse>(url, normalizedParams);
            case 'POST':
                return handlePumpFunPOST<PumpFunRequest, TResponse>(url, normalizedParams);
            default:
                throw new Error(`Unknown HTTP method for PumpFun method: ${method}`);
        }
    };
}

function createPumpFunApi(metisEndpoint: string): Rpc<MetisPumpFunApi> {
    const api = createJsonRpcApi<MetisPumpFunApi>();
    const transport = createPumpFunTransport(metisEndpoint);
    return createRpc({ api, transport });
}

async function handlePumpFunGET<TParams, TResponse>(
    url: URL,
    params: TParams
): Promise<TResponse> {
    if (typeof params === 'object' && params !== null) {
        Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
            url.searchParams.append(key, String(value));
        });
    }

    const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow',
        headers: {
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) {
        throw new Error(`Error making GET request to ${url}: ${response.statusText}`);
    }

    return await response.json() as TResponse;
}

async function handlePumpFunPOST<TParams, TResponse>(
    url: URL,
    params: TParams
): Promise<TResponse> {
    try {
        const response = await fetch(url.toString(), {
            method: 'POST',
            redirect: 'follow',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            throw new Error(`Error making POST request to ${url}: ${response.statusText}`);
        }

        return await response.json() as TResponse;
    } catch (error) {
        console.error('Error making POST request:', error);
        throw error;
    }
}

async function signAndSendTransaction({
    transactionBase64,
    signerSecretKey,
    solanaRpc,
    solanaRpcSubscriptions,
    commitment = 'confirmed'
}: SignAndSendTransactionParams): Promise<string> {
    // Create signer keypair from secret
    const signerKeypair = await createKeyPairFromBytes(
        new Uint8Array(signerSecretKey)
    );

    // Decode the base64 transaction
    const transactionBytes = getBase64Encoder().encode(transactionBase64) as TransactionMessageBytes;
    const transactionDecoder = getTransactionDecoder();
    const decodedTransaction = transactionDecoder.decode(transactionBytes);

    // Sign the transaction
    const signedTransaction = await signTransaction(
        [signerKeypair],
        decodedTransaction
    );
    
    // Get latest blockhash and prepare transaction with lifetime
    const { value: { lastValidBlockHeight, blockhash } } = await solanaRpc.getLatestBlockhash().send();
    const signedTransactionWithLifetime: FullySignedTransaction & TransactionWithBlockhashLifetime = {
        ...signedTransaction,
        lifetimeConstraint: {
            blockhash,
            lastValidBlockHeight,
        },
    };

    // Get transaction signature
    const transactionSignature = getSignatureFromTransaction(signedTransactionWithLifetime);

    // Create sendAndConfirm function
    const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
        rpc: solanaRpc,
        rpcSubscriptions: solanaRpcSubscriptions,
    });

    // Send and confirm transaction
    await sendAndConfirmTransaction(signedTransactionWithLifetime, {
        commitment,
    });

    return transactionSignature;
}

function validateEnv() {
    const envVars = ['WALLET_SECRET_KEY','METIS_URL','HTTP_ENDPOINT','WSS_ENDPOINT'];
    envVars.forEach((envVar) => {
        if (!process.env[envVar]) {
            throw new Error(`${envVar} environment variable is required`);
        }
    });
}

async function main() {
    validateEnv();
    const metisUrl = process.env.METIS_URL as string;
    const rpcUrl = process.env.HTTP_ENDPOINT as string;
    const rpcSubscriptionsUrl = process.env.WSS_ENDPOINT as string;
    const signerSecretKey = JSON.parse(process.env.WALLET_SECRET_KEY as string) as number[];
    const signerKeypair = await createKeyPairFromBytes(new Uint8Array(signerSecretKey));
    const wallet = await getAddressFromPublicKey(signerKeypair.publicKey);

    const targetMint = address("8gXN67Nmw9FZQjunJZzRoi2Qf1ykZtN9Q3BqxhCypump");
    const pumpFunApi = createPumpFunApi(metisUrl);
    const solanaRpc: Rpc<SolanaRpcApi> = createSolanaRpc(rpcUrl);
    const solanaRpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>
        = createSolanaRpcSubscriptions(rpcSubscriptionsUrl);

    try {
        const pumpFunQuote = await pumpFunApi.pumpfun_quote({
            type: 'BUY',
            mint: targetMint,
            amount: 1_000_000,
        }).send();
        console.log(`PumpFun Quote:\n ${JSON.stringify(pumpFunQuote.quote, null, 2)}`);
    } catch (error) {
        console.error('Error getting PumpFun quote:', error);
    }
    try {
        const pumpFunQuote = await pumpFunApi.pumpfun_swap({
            wallet,
            type: 'BUY',
            mint: targetMint,
            inAmount: 1_000_000,
            // priorityFeeLevel: 'high', // optionally set priority fee level
        }).send();

        const sig = await signAndSendTransaction({
            transactionBase64: pumpFunQuote.tx,
            signerSecretKey: JSON.parse(process.env.WALLET_SECRET_KEY as string) as number[],  
            solanaRpc,
            solanaRpcSubscriptions,
        });

        console.log(`Transaction Signature: ${sig}`);
    } catch (error) {
        console.error('Error getting PumpFun quote:', error);
    }

}
