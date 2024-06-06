import { ethers } from 'ethers';
import { RequestBody, CHAINS } from '@/app/utils/ethereum';
import abi from '@/app/utils/abi.json';

export async function POST(request: Request) {
    try {
        const requestBody = await request.json() as RequestBody;
        const { chainId, signerAddress, tokenName, tokenSymbol, tokenAmount } = requestBody;
        const chainConfig = CHAINS[chainId];
        if (!chainConfig) {
            return new Response(JSON.stringify({ status: 'error', message: 'Unsupported chain ID' }), { status: 400 });
        }
        const contract = new ethers.Contract(chainConfig.factoryAddress, abi);
        const apiResponse = await contract.interface.encodeFunctionData("createToken", [signerAddress, ethers.getBigInt(tokenAmount), tokenName, tokenSymbol]);
        const txn = {
            to: chainConfig.factoryAddress,
            data: apiResponse,
        }
        return new Response(JSON.stringify({
            status: 'success',
            apiResponse: txn,

        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ status: 'error', message: error }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
