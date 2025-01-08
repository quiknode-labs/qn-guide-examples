import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import dotenv from 'dotenv';
import { PumpFunQuoteParams, PumpFunQuoteResponse, PumpFunSwapParams, PumpFunSwapResponse } from './types';

dotenv.config();

const SIMULATE = process.env.SIMULATE === 'true';

async function main() {
    const metisUrl = process.env.METIS_URL as string;
    const rpcUrl = process.env.HTTP_ENDPOINT as string;
    const connection = new Connection(rpcUrl, 'confirmed');
    const signerSecretKey = JSON.parse(process.env.WALLET_SECRET_KEY as string) as number[];
    const signerKeypair = Keypair.fromSecretKey(new Uint8Array(signerSecretKey));
    const wallet = signerKeypair.publicKey.toBase58();

    const quoteParams: PumpFunQuoteParams = {
        type: 'BUY',
        mint: "8gXN67Nmw9FZQjunJZzRoi2Qf1ykZtN9Q3BqxhCypump",
        amount: 1_000_000,
    };
    const requestOptions: RequestInit = {
        method: "GET",
        redirect: "follow"
    };

    console.log("------PumpFun Quote------");
    const quoteResponse = await getQuote(quoteParams, requestOptions);
    console.log(quoteResponse);

    console.log("------------------------\n\n");
    console.log("------PumpFun Swap------");

    const swapParams: PumpFunSwapParams = {
        wallet,
        type: 'BUY',
        mint: '8gXN67Nmw9FZQjunJZzRoi2Qf1ykZtN9Q3BqxhCypump',
        inAmount: 1_000_000,
        // priorityFeeLevel: 'high',
    };

    const swapResponse = await executeSwap(swapParams, requestOptions);
    const swapTransactionBuf = Buffer.from(swapResponse.tx, 'base64');
    let transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    console.log(transaction);
    transaction.sign([signerKeypair]);
    if (SIMULATE) {
        const simulation = await connection.simulateTransaction(transaction);
        console.log(simulation)
    } else {
        const rawTransaction = transaction.serialize()
        const txid = await connection.sendRawTransaction(rawTransaction, {
          skipPreflight: true,
        });
        console.log(txid);    
    }
}

async function getQuote(
    params: PumpFunQuoteParams,
    requestOptions: RequestInit = {},
    metisUrl = process.env.METIS_URL as string
): Promise<PumpFunQuoteResponse> {
    const url = createUrlWithParams(metisUrl, 'pump-fun/quote', params);
    
    const response = await fetch(url, {
        ...requestOptions,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...requestOptions.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`PumpFun quote request failed: ${response.statusText}`);
    }

    return response.json();
}

async function executeSwap(
    params: PumpFunSwapParams,
    requestOptions: RequestInit = {},
    metisUrl = process.env.METIS_URL as string
): Promise<PumpFunSwapResponse> {
    const url = `${metisUrl}/pump-fun/swap`;
    
    const response = await fetch(url, {
        ...requestOptions,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...requestOptions.headers,
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        throw new Error(`PumpFun swap request failed: ${response.statusText}`);
    }

    return response.json();
}

function createUrlWithParams(baseUrl: string, path: string, params?: Record<string, any>): string {
    const url = new URL(`${baseUrl}/${path}`);
    
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        });
    }
    
    return url.toString();
}

main().catch(console.error);