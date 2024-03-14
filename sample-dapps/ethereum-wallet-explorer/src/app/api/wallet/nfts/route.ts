import { ethers } from 'ethers';
import { handleError, parseAndValidateAddress } from '../../utils/helpers';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');
    try {
        // Validate and ensure the wallet address is in the correct format for Ethereum
        const validAddress = await parseAndValidateAddress(walletAddress);
        
        // Initialize an ethers.js provider with your QuickNode Ethereum RPC URL
        const provider = new ethers.JsonRpcProvider(process.env.EVM_RPC_URL);

        // Use the custom QuickNode RPC method to get NFTs for the wallet
        const params = [{
            wallet: validAddress,
            omitFields: ["traits"] // Omit traits from the response for simplicity
        }];
        const nfts = await provider.send("qn_fetchNFTs", params);
        console.log(nfts);
        
        return new Response(JSON.stringify({ nfts }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return handleError(error);
    }
}
