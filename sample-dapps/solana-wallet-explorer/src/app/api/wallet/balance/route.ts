import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { handleError, initializeConnection, parseAndValidateAddress } from '@walletUtils/helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');
    try {
        const publicKey = await parseAndValidateAddress(walletAddress);
        const connection = initializeConnection();
        const balance = await connection.getBalance(publicKey);
        const solBalance = balance / LAMPORTS_PER_SOL;

        return new Response(JSON.stringify({ solBalance }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return handleError(error);
    }
}