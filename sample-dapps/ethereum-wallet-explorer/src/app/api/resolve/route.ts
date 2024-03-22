import { ethers } from 'ethers';
import { handleError } from '../utils/helpers';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');

    if (!walletAddress) {
        return new Response(JSON.stringify({ error: 'Wallet address is required.' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 400,
        });
    }

    try {
        let address;
        if (walletAddress.startsWith("0x")) {
            address = ethers.getAddress(walletAddress);
        } else {
            const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
            const resolvedAddress = await provider.resolveName(walletAddress);
            if (resolvedAddress === null) {
                throw new Error(`The ENS name '${walletAddress}' does not resolve to an address.`);
            }
            address = resolvedAddress;
        }
        return new Response(JSON.stringify({ address }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return handleError(error);
    }
}
