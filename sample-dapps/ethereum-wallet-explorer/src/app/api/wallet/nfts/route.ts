import { ethers } from 'ethers';
import { handleError, parseAndValidateAddress } from '../../utils/helpers';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    try {
        const validAddress = await parseAndValidateAddress(walletAddress);
        const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);

        const params = [{
            wallet: validAddress,
            page,
            perPage: 7,
            omitFields: ["traits"]
        }];
        const nfts = await provider.send("qn_fetchNFTs", params);
        
        return new Response(JSON.stringify({ nfts }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return handleError(error);
    }
}
