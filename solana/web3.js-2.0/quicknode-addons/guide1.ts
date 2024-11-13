// Source code for Guide: How to Use QuickNode Add-ons using Solana Web3.js 2.0 (Part 1)
// https://www.quicknode.com/guides/solana-development/tooling/web3-2/qn-add-ons

import {
    Rpc,
    createDefaultRpcTransport,
    createRpc,
    RpcTransport,
    createJsonRpcApi, // note: in older versions of this library, this function was called: createRpcApi
    RpcRequest,
    createSolanaRpcApi,
} from "@solana/web3.js";
import {
    EstimatePriorityFeesResponse,
    EstimatePriorityFeesParams
} from "./types";

type PriorityFeeApi = {
    qn_estimatePriorityFees(params: EstimatePriorityFeesParams): EstimatePriorityFeesResponse;
}

interface createQuickNodeTransportParams {
    endpoint: string;
}

function createQuickNodeTransport({ endpoint }: createQuickNodeTransportParams): RpcTransport {
    const jsonRpcTransport = createDefaultRpcTransport({ url: endpoint });

    return async <TResponse>(...args: Parameters<RpcTransport>): Promise<TResponse> => {
        return await jsonRpcTransport(...args);
    };
}

/**
 * 
 * @param endpoint - Solana HTTP Endpoint
 * Establish connection to Solana cluster
 * Change as needed to the network you're using. 
 * Get a free Devnet or Mainnet endpoint from:
 * https://www.quicknode.com/signup?utm_source=internal&utm_campaign=sample-apps&utm_content=solana-web3.js-2.0-add-ons
 * @returns RPC instance with priority fee API
 */
export function createPriorityFeeApi(endpoint: string): Rpc<PriorityFeeApi> {
    const api0 = createSolanaRpcApi();
    const api = createJsonRpcApi<PriorityFeeApi>({
        requestTransformer: (request: RpcRequest<any>) => request.params[0],
        responseTransformer: (response: any) => response.result,
    });
    const transport = createQuickNodeTransport({
        endpoint,
    });
    return createRpc({ api, transport });
}



async function main() {
    const quickNodeRpc = createPriorityFeeApi('https://example.solana-mainnet.quiknode.pro/123456/');

    const priorityFees = await quickNodeRpc.qn_estimatePriorityFees({
        account: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
        last_n_blocks: 100,
        api_version: 2,
    }).send();

    console.log(priorityFees);
}

main();