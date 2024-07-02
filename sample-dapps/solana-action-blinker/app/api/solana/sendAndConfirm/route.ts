import { initializeConnection, handleError } from '@/utils/solana';

export async function POST(request: Request) {

    try {
        const connection = initializeConnection();
        if (!request) {
            return handleError(new Error('Request is required'));
        }
        if (!request.body || request.bodyUsed) {
            return handleError(new Error('Request body is required and must not be used already'));
        }
        const requestBody = await request.json(); // Parses the JSON body
        const { serializedTx } = requestBody;

        if (!serializedTx) {
            return handleError(new Error('No transaction to send'));
        }

        const { value: { blockhash, lastValidBlockHeight }, context: { slot: minContextSlot } } = await connection.getLatestBlockhashAndContext('confirmed');
        const serializedTransaction = Buffer.from(serializedTx, 'base64');

        const signature = await connection.sendRawTransaction(serializedTransaction, {
            skipPreflight: true,
            preflightCommitment: 'confirmed',
            maxRetries: 0,
            minContextSlot,
        });

        const confirmation = await connection.confirmTransaction({
            blockhash,
            lastValidBlockHeight,
            signature,
            minContextSlot
        }, 'confirmed');
        if (!confirmation || confirmation.value.err) {
            throw new Error('Transaction not confirmed');
        }
        return new Response(JSON.stringify({ signature }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return handleError(error);
    }
}