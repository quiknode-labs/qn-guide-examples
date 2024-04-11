import { initializeConnection, handleError, parseAndValidateAddress } from '@/utils/solana';

export async function POST(request: Request) {
    try {
        if (!request) {
            return handleError(new Error('Request is required'));
        }
        if (!request.body || request.bodyUsed) {
            return handleError(new Error('Request body is required and must not be used already'));
        }
        const requestBody = await request.json();
        const { address } = requestBody;
        if (!address) {
            return handleError(new Error('No address to query'));
        }

        const connection = initializeConnection();
        const publicKey = await parseAndValidateAddress(address);
        const balance = await connection.getBalance(publicKey);

        return new Response(JSON.stringify({ balance }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return handleError(error);
    }
}