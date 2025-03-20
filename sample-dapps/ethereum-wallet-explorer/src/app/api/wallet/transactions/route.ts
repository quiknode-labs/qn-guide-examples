import { ethers } from 'ethers';
import { handleError, parseAndValidateAddress } from '../../utils/helpers';

interface Transaction {
    txid?: string;
    blockHeight?: number;
    vin?: Array<{ addresses?: string[] }>;
    vout?: Array<{ addresses?: string[] }>;
    value?: string;
    ethereumSpecific?: {
        internalTransfers?: Array<{
            from: string;
            to: string;
        }>;
    };
}

interface ProcessedTransaction {
    transactionHash: string;
    blockNumber: string;
    from: string;
    to: string | null;
    value: string;
    internal: string;
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');
    try {
        if (!walletAddress) {
            throw new Error("No walletAddress provided in query parameters");
        }
        
        const validAddress = await parseAndValidateAddress(walletAddress);
        const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
        const result = await provider.send("bb_getAddress", [
            validAddress,
            {
                page: 1,
                size: 100,
                details: "txs"
            }
        ]);

        if (!result || !Array.isArray(result.transactions)) {
            throw new Error(`Invalid API response: transactions array missing or malformed`);
        }

        const transactions = result.transactions.map((txn: Transaction, index: number) => {
            try {
                const from = txn.vin?.[0]?.addresses?.[0] || "unknown";
                const to = txn.vout?.[0]?.addresses?.[0] || null;
                const value = ethers.formatEther(txn.value || "0");
                const hasInternal = txn.ethereumSpecific?.internalTransfers?.some(
                    (transfer: { from: string; to: string }) =>
                        transfer.from.toLowerCase() === validAddress.toLowerCase() ||
                        transfer.to.toLowerCase() === validAddress.toLowerCase()
                ) || false;

                return {
                    transactionHash: txn.txid || `missing_txid_${index}`,
                    blockNumber: txn.blockHeight?.toString() || "unknown",
                    from,
                    to,
                    value,
                    internal: hasInternal ? "✅" : "❌"
                };
            } catch (error) {
                return null;
            }
        }).filter((txn: ProcessedTransaction | null) => txn !== null);

        return new Response(JSON.stringify({ transactions }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            status: 200
        });

    } catch (error) {
        return handleError(error);
    }
}