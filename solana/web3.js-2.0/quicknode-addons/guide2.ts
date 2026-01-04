// Source code for Guide: How to Use Quicknode Add-ons using Solana Web3.js 2.0 (Part 2)
// https://www.quicknode.com/guides/solana-development/tooling/web3-2/qn-add-ons-2

import {
    Rpc,
    createDefaultRpcTransport,
    createRpc,
    RpcTransport,
    createJsonRpcApi, // note: in older versions of this library, this function was called: createRpcApi,
    RpcRequest
} from "@solana/kit";
import {
    EstimatePriorityFeesResponse,
    EstimatePriorityFeesParams,
    IpfsUploadRequest, 
    IpfsUploadResponse,
    QuoteGetRequest, QuoteResponse
} from "./types";
import * as fs from 'fs';

type PriorityFeeApi = {
    qn_estimatePriorityFees(params: EstimatePriorityFeesParams): Promise<EstimatePriorityFeesResponse>;
}

type MetisApi = {
    metis_quote(params: QuoteGetRequest): Promise<QuoteResponse>;
    // Add other Metis methods here
}

type IpfsApi = {
    ipfs_upload(params: IpfsUploadRequest): Promise<IpfsUploadResponse>;
}

type QuicknodeAddons = PriorityFeeApi & MetisApi & IpfsApi;

function createQuicknodeTransport({ endpoint, metisEndpoint, ipfsApiKey }: CreateAddonsApiParams): RpcTransport {
    const jsonRpcTransport = createDefaultRpcTransport({ url: endpoint });

    return async <TResponse>(...args: Parameters<RpcTransport>): Promise<TResponse> => {
        const { method, params } = args[0].payload as { method: string; params: unknown };
        switch (true) {
            case method.startsWith('metis_'):
                return handleMetisRequest<unknown, TResponse>(method, params, metisEndpoint);

            case method === 'ipfs_upload':
                return handleIpfsUpload<TResponse>(params as IpfsUploadRequest, ipfsApiKey);

            default:
                return jsonRpcTransport(...args);
        }
    };
}

async function handleMetisRequest<TParams, TResponse>(method: string, params: TParams, metisEndpoint?: string): Promise<TResponse> {
    const DEFAULT_METIS_ENDPOINT = 'https://public.jupiterapi.com';
    const jupiterMethod = method.replace('metis_', '');
    const url = new URL(`${metisEndpoint || DEFAULT_METIS_ENDPOINT}/${jupiterMethod}`);
    const paramsToUse = Array.isArray(params) ? params[0] : params;

    if (typeof paramsToUse === 'object' && paramsToUse !== null) {
        Object.entries(paramsToUse as Record<string, unknown>).forEach(([key, value]) => {
            url.searchParams.append(key, String(value));
        });
    }

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Error making fetch request to ${url}: ${response.statusText}`);
    }

    const data = await response.json();
    return { result: data } as TResponse;
}


async function handleIpfsUpload<T>(params: IpfsUploadRequest, ipfsApiKey?: string): Promise<T> {
    if (!ipfsApiKey) {
        throw new Error('No IPFS API key provided');
    }

    const { filePath, fileName, fileType } = params;
    const fileContent = fs.readFileSync(filePath);
    const file = new File([fileContent], fileName, { type: fileType });
    const formData = new FormData();
    formData.append("Body", file);
    formData.append("Key", file.name);
    formData.append("ContentType", file.type);

    const url = new URL('https://api.quicknode.com/ipfs/rest/v1/s3/put-object');
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'x-api-key': ipfsApiKey,
        },
        body: formData,
        redirect: "follow",
    });

    if (!response.ok) {
        throw new Error(`Error making fetch request to ${url}: ${response.statusText}`);
    }
    const data = await response.json();


    return { result: data } as T;
}

interface CreateAddonsApiParams {
    endpoint: string;
    metisEndpoint?: string;
    ipfsApiKey?: string;
}

/**
 * Creates an RPC instance with Quicknode Addons API
 * 
 * @param {CreateAddonsApiParams} params - Configuration parameters for creating the API
 * @param {string} params.endpoint - Solana HTTP Endpoint. Establish connection to Solana cluster.
 *        Change as needed to the network you're using.
 *        Get a free Devnet or Mainnet endpoint from:
 *        https://www.quicknode.com/signup?utm_source=internal&utm_campaign=sample-apps&utm_content=solana-web3.js-2.0-add-ons
 * @param {string} [params.metisEndpoint] - Optional. Endpoint for Metis services if required. (defaults to 'https://public.jupiterapi.com')
 *        More information at:
 *        https://marketplace.quicknode.com/add-on/metis-jupiter-v6-swap-api?utm_source=internal&utm_campaign=sample-apps&utm_content=solana-web3.js-2.0-add-ons
 * @param {string} [params.ipfsApiKey] - Optional. API key for IPFS services if required.
 *        More information at:
 *        hthttps://quicknode.com/ipfs?utm_source=internal&utm_campaign=sample-apps&utm_content=solana-web3.js-2.0-add-ons
 * @returns {Rpc<QuicknodeAddons>} RPC instance with Quicknode Addons API
 */


export function createAddonsApi(params: CreateAddonsApiParams): Rpc<QuicknodeAddons> {
    const api = createJsonRpcApi<QuicknodeAddons>({
        requestTransformer: (request: RpcRequest<any>) => request.params[0],
        responseTransformer: (response: any) => response.result,
    });

    const transport = createQuicknodeTransport(params);

    return createRpc({ api, transport });
}

async function main() {
    const quickNodeRpc = createAddonsApi({
        endpoint: 'https://replace-me.solana-mainnet.quiknode.pro/123456/',
        ipfsApiKey: 'QN_REPLACE_WITH_YOUR_IPFS_API_KEY',
    });

    try {
        const priorityFees = await quickNodeRpc.qn_estimatePriorityFees({
            account: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
            last_n_blocks: 100,
            api_version: 2
        }).send();
        console.log(`Priority Fees (Med Per CU): ${priorityFees.per_compute_unit.medium}`);
    } catch (error) {
        console.error('Error estimating priority fees:', error);
    }

    try {
        const metisQuote = await quickNodeRpc.metis_quote({
            inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            outputMint: "So11111111111111111111111111111111111111112",
            amount: 10.03 * 1e6,
        }).send();
        console.log(`Metis Quote (lamports): ${metisQuote.outAmount}`);
    } catch (error) {
        console.error('Error getting Metis quote:', error);
    }

    try {
        const result = await quickNodeRpc.ipfs_upload({
            filePath: 'test.png',
            fileName: 'test5.png',
            fileType: 'image/png',
        }).send();
        console.log('File uploaded successfully! CID:', result.pin.cid);
    } catch (error) {
        console.error('Error uploading file:', error);
    }
}

main().catch(console.error);