import { ethers } from 'ethers';
import { handleError, parseAndValidateAddress } from '../../utils/helpers';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');

    try {
        // Validate and ensure the wallet address is in the correct format for Ethereum
        const validAddress = await parseAndValidateAddress(walletAddress);
        
        // Initialize an ethers.js provider with your QuickNode Ethereum RPC URL
        // Ensure to replace "YOUR_QUICKNODE_RPC_URL" with your actual QuickNode Ethereum RPC endpoint
        const provider = new ethers.JsonRpcProvider("YOUR_QUICKNODE_RPC_URL");
        
        // Use the custom QuickNode RPC method to get token balances for the wallet
        const tokens = await provider.send("qn_getWalletTokenBalance", [{ wallet: validAddress }]);

        return new Response(JSON.stringify({ tokens }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return handleError(error);
    }
}
