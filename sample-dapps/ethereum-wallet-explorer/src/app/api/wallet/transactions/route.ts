import { ethers } from 'ethers';
import { handleError, parseAndValidateAddress } from '../../utils/helpers';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');
    try {
        const validAddress = await parseAndValidateAddress(walletAddress);
        const provider = new ethers.JsonRpcProvider(process.env.EVM_RPC_URL);
        const appearances = await provider.send("tb_getAppearances", [{"address": validAddress}]);
        const txnsData = await appearances.data
        const transactions = [];
        for (let txn of txnsData) {
            const blockNumber = await ethers.toQuantity(txn.blockNumber)
            const transactionIndex = await ethers.toQuantity(txn.transactionIndex);
            const transactionDetails = await provider.send("eth_getTransactionByBlockNumberAndIndex", [blockNumber, transactionIndex]);
            transactions.push({
                transactionHash: transactionDetails.hash,
                blockNumber: transactionDetails.blockNumber,
                from: transactionDetails.from,
                to: transactionDetails.to,
                value: transactionDetails.value
            });
        }

        return new Response(JSON.stringify({ transactions }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return handleError(error);
    }
}
