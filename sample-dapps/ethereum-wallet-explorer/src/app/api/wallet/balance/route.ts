import { ethers } from 'ethers';
import { handleError, parseAndValidateAddress } from '../../utils/helpers';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');
    try {
        // Validate the Ethereum address
        const validAddress = await parseAndValidateAddress(walletAddress);
        // Initialize an ethers.js provider using an Ethereum RPC URL
        const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
        // Fetch the balance of the address
        const balance = await provider.getBalance(validAddress, "latest");
        // Convert the balance from wei to ether
        const ethBalance = ethers.formatEther(balance);
        console.log("ETH BALANCE: ", ethBalance)

        return new Response(JSON.stringify({ ethBalance }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return handleError(error);
    }
}
