import { ethers } from 'ethers';
import { handleError, initializeConnection, parseAndValidateAddress } from '../../utils/helpers';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');
    try {
        const validAddress = await parseAndValidateAddress(walletAddress);
        const provider = initializeConnection();
        const balance = await provider.getBalance(validAddress, "latest");
        const ethBalance = ethers.formatEther(balance);

        return new Response(JSON.stringify({ ethBalance }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return handleError(error);
    }
}
