import { initializeConnection, handleError } from '@/utils/solana';

export async function POST(request: Request) {
    // TODO Parse the serialized transacitonparse request (buffer)


    /* 
    
        1st step: you create your transaction in the backend with your instructions.
        
        2nd step: you sign your transaction with your wallet in your backend (with transaction.partialSign(walletProvider);)
        
        3rd step: you serialize and base64 encode your transaction with const serializedTransaction = transaction.serialize({requireAllSignatures: false}); and const base64Transaction = serializedTransaction.toString('base64');
        
        4th step: you get back your transaction in the frontend and decode it, with const transaction = Transaction.from(Buffer.from(backendResponse.transaction, 'base64'))
        
        then in the frontend you can use your transaction object (sign it with a wallet, etc)
    
    
    */


    try {
        const connection = initializeConnection();

        // TODO Parse the serialized transacitonparse request (buffer)
        if (!request || !request.body) {
            throw new Error('Request body is required');
        }
        //@ts-ignore TODO add types and implment server-side tx handling
        const { transaction: base64Transaction } = JSON.parse(request.body);
        const { value: { blockhash, lastValidBlockHeight }, context: { slot: minContextSlot } } = await connection.getLatestBlockhashAndContext('confirmed');
        const transactionBuffer = Buffer.from(base64Transaction, 'base64');

        const signature = await connection.sendRawTransaction(transactionBuffer, {
            skipPreflight: true,
            preflightCommitment: 'confirmed',
            maxRetries: 0,
            minContextSlot,
        });

        const txId = await connection.confirmTransaction({
            blockhash,
            lastValidBlockHeight,
            signature,
            minContextSlot
        });

        return new Response(JSON.stringify({ txId }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return handleError(error);
    }
}