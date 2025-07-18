import { RpcTransport, createDefaultRpcTransport } from "@solana/kit";

export function createQuickNodeTransport(endpoint: string): RpcTransport {
    const jsonRpcTransport = createDefaultRpcTransport({ url: endpoint });
    return async <TResponse>(...args: Parameters<RpcTransport>): Promise<TResponse> => {
        return await jsonRpcTransport(...args);
    };
}
