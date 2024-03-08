import { GetProgramAccountsFilter } from '@solana/web3.js';
import { handleError, initializeConnection, parseAndValidateAddress } from '@walletUtils/helpers';
import { TOKEN_PROGRAM_ID } from '@walletUtils/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');

    try {
        const publicKey = await parseAndValidateAddress(walletAddress);
        const filters: GetProgramAccountsFilter[] = [
            {
                dataSize: 165,    //size of account (bytes)
            },
            {
                memcmp: {
                    offset: 32,
                    bytes: publicKey.toBase58(),
                }
            }
        ];
        const connection = initializeConnection();
        const tokens = await connection.getParsedProgramAccounts(TOKEN_PROGRAM_ID, { filters });

        return new Response(JSON.stringify({ tokens }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return handleError(error);
    }
}


