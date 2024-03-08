import { handleError, initializeConnection, parseAndValidateAddress } from '@walletUtils/helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');
    const limit = 20; // url.searchParams.get('limit');
    try {
        const publicKey = await parseAndValidateAddress(walletAddress);
        const connection = initializeConnection();
        const txIds = await connection.getConfirmedSignaturesForAddress2(publicKey, { limit });
    
        return new Response(JSON.stringify({ txIds }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        });
      } catch (error) {
        return handleError(error);
      }
}