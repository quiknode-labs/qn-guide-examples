import { initializeConnection, handleError } from '@/utils/solana';
import { buildCreateTokenTx } from '@/utils/spl';
import { Keypair, PublicKey } from '@solana/web3.js';
import { JsonMetadata } from '@/utils/types';   

interface RequestBody {
    authority: string;
    jsonMetadata: JsonMetadata;
    jsonUri: string;
    decimals: string;
    amount: string;
}

export async function POST(request: Request) {
    const endpoint = process.env.QN_ENDPOINT;
    if (!endpoint) {
        return handleError(new Error('QN_ENDPOINT is required'));
    }
    try {
        if (!request) {
            return handleError(new Error('Request is required'));
        }
        if (!request.body || request.bodyUsed) {
            return handleError(new Error('Request body is required and must not be used already'));
        }

        const requestBody = await request.json();

        const {
            authority,
            jsonMetadata,
            jsonUri,
            decimals,
            amount
        }: RequestBody = requestBody;

        const connection = initializeConnection();
        const mintKeypair = Keypair.generate();
        const authorityPublicKey = new PublicKey(authority);
        const buildCreateTokenArgs = {
            connection,
            authority: authorityPublicKey,
            jsonMetadata,
            jsonUri,
            decimals: parseInt(decimals, 10),
            mintKeypair,
            amount: parseInt(amount, 10)
        };

        const { mintTransaction } = await buildCreateTokenTx(buildCreateTokenArgs);
        const { value: { blockhash, lastValidBlockHeight }, context: { slot: minContextSlot } } = await connection.getLatestBlockhashAndContext('confirmed');

        mintTransaction.recentBlockhash = blockhash;
        mintTransaction.lastValidBlockHeight = lastValidBlockHeight;
        mintTransaction.minNonceContextSlot = minContextSlot;
        mintTransaction.lastValidBlockHeight = lastValidBlockHeight;
        mintTransaction.feePayer = authorityPublicKey;
        mintTransaction.partialSign(mintKeypair);
        const serializedTransaction = mintTransaction.serialize({ requireAllSignatures: false });
        const transaction = serializedTransaction.toString('base64');

        return new Response(JSON.stringify({ transaction }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return handleError(error);
    }
}