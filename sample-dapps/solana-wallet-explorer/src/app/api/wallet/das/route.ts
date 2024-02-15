import { getDasEndpoint, handleError, parseAndValidateAddress } from '@walletUtils/helpers';
import { DasApiAssetList, JsonResponse } from './types';

export const dynamic = 'force-dynamic';

interface RequestBody {
    jsonrpc: string;
    id: number;
    method: string;
    params: {
        ownerAddress: string;
        limit: number;
        page: number;
    };
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');
    const limit = Number(url.searchParams.get('limit')) || 10;
    const page = Number(url.searchParams.get('page')) || 1;

    try {
        const publicKey = await parseAndValidateAddress(walletAddress);
        const requestBody: RequestBody = {
            jsonrpc: "2.0",
            id: 1,
            method: "getAssetsByOwner",
            params: {
                ownerAddress: publicKey.toBase58(),
                limit,
                page
            }
        };
        const endpoint = getDasEndpoint();
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        })
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data: JsonResponse = await response.json();
        const assets: DasApiAssetList = data.result;
        return new Response(JSON.stringify({ assets }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        if (error instanceof Error) {
            return handleError(error);
        }
        return handleError(new Error('An unexpected error occurred'));
    }

}