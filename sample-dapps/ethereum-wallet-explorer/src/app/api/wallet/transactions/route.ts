import { ethers } from 'ethers';
import { handleError, parseAndValidateAddress } from '../../utils/helpers';

export async function GET(request: Request) {
    const url = new URL(request.url);
    let internalFlag;
    const walletAddress = url.searchParams.get('walletAddress');
    try {
        const validAddress = await parseAndValidateAddress(walletAddress);
        const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
        const appearances = await provider.send("tb_getAppearances", [{"address": validAddress}]);
        const txnsData = await appearances.data.slice(-100) // Hard limit to last 100 transactions
        const transactions = [];
        for (let txn of txnsData) {
            const blockNumber = await ethers.toQuantity(txn.blockNumber)
            const transactionIndex = await ethers.toQuantity(txn.transactionIndex);
            const transactionDetails = await provider.send("eth_getTransactionByBlockNumberAndIndex", [blockNumber, transactionIndex]);
            if (transactionDetails.from !== walletAddress && transactionDetails.to !== walletAddress) {
                internalFlag = "✅";
            } else {
                internalFlag = "❌";
            }
            transactions.push({
                transactionHash: transactionDetails.hash,
                blockNumber: BigInt(transactionDetails.blockNumber).toString(),
                from: transactionDetails.from,
                to: transactionDetails.to,
                value: ethers.formatEther(BigInt(transactionDetails.value).toString()),
                internal: internalFlag
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
