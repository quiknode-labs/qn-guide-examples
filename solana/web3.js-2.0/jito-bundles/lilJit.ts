import {
    Rpc,
    createDefaultRpcTransport,
    createRpc,
    createJsonRpcApi, // note: in older versions of this library, this function was called: createRpcApi
    Address,
    mainnet,
    Base58EncodedBytes,
    createSolanaRpc,
    createKeyPairSignerFromBytes,
    createTransactionMessage,
    setTransactionMessageFeePayerSigner,
    pipe,
    setTransactionMessageLifetimeUsingBlockhash,
    appendTransactionMessageInstruction,
    TransactionPartialSigner,
    signTransactionMessageWithSigners,
    getBase64EncodedWireTransaction,
    Base64EncodedWireTransaction,
    getTransactionEncoder,
    getBase58Decoder,
} from "@solana/web3.js";
import secret from "./secret.json";
import { getAddMemoInstruction } from "@solana-program/memo";
import { getTransferSolInstruction } from "@solana-program/system";

const MINIMUM_JITO_TIP = 1_000; // lamports
const NUMBER_TRANSACTIONS = 5;
const SIMULATE_ONLY = true;
const ENDPOINT = 'https://example.quiknode.pro/123456/'; // 👈 Replace with your own endpoint
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 30000;
const DEFAULT_WAIT_BEFORE_POLL_MS = 5000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type JitoBundleSimulationResponse = {
    context: {
        apiVersion: string;
        slot: number;
    };
    value: {
        summary: 'succeeded' | {
            failed: {
                error: {
                    TransactionFailure: [number[], string];
                };
                tx_signature: string;
            };
        };
        transactionResults: Array<{
            err: null | unknown;
            logs: string[];
            postExecutionAccounts: null | unknown;
            preExecutionAccounts: null | unknown;
            returnData: null | unknown;
            unitsConsumed: number;
        }>;
    };
};

type LilJitAddon = {
    getRegions(): string[];
    getTipAccounts(): Address[];
    getBundleStatuses(bundleIds: string[]): {
        context: { slot: number };
        value: {
            bundleId: string;
            transactions: Base58EncodedBytes[];
            slot: number;
            confirmationStatus: string;
            err: any;
        }[]
    };
    getInflightBundleStatuses(bundleIds: string[]): {
        context: { slot: number };
        value: {
            bundle_id: string;
            status: "Invalid" | "Pending" | "Landed" | "Failed";
            landed_slot: number | null;
        }[];
    };
    sendTransaction(transactions: Base64EncodedWireTransaction[]): string;
    simulateBundle(transactions: [Base64EncodedWireTransaction[]]): JitoBundleSimulationResponse;
    sendBundle(transactions: Base58EncodedBytes[]): string;
}

function createJitoBundlesRpc({ endpoint }: { endpoint: string }): Rpc<LilJitAddon> {
    const api = createJsonRpcApi<LilJitAddon>({
        // parametersTransformer: (params: any[]) => params[0],
        responseTransformer: (response: any) => response.result,
    });
    const transport = createDefaultRpcTransport({
        url: mainnet(endpoint),
    });
    return createRpc({ api, transport });
}

function isFailedSummary(summary: JitoBundleSimulationResponse['value']['summary']): summary is { failed: any } {
    return typeof summary === 'object' && summary !== null && 'failed' in summary;
}

function validateSimulation(simulation: JitoBundleSimulationResponse) {
    if (simulation.value.summary !== 'succeeded' && isFailedSummary(simulation.value.summary)) {
        throw new Error(`Simulation Failed: ${simulation.value.summary.failed.error.TransactionFailure[1]}`);
    }
}


async function createTransaction(
    index: number,
    latestBlockhash: Parameters<
        typeof setTransactionMessageLifetimeUsingBlockhash
    >[0],
    payerSigner: TransactionPartialSigner,
    includeTip?: Address
) {
    const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(payerSigner, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) =>
            appendTransactionMessageInstruction(
                getAddMemoInstruction({
                    memo: `lil jit demo transaction # ${index}`,
                }),
                tx
            ),
        (tx) =>
            includeTip
                ? appendTransactionMessageInstruction(
                    getTransferSolInstruction({
                        source: payerSigner,
                        destination: includeTip,
                        amount: MINIMUM_JITO_TIP,
                    }),
                    tx
                )
                : tx
    );
    return await signTransactionMessageWithSigners(transactionMessage);
}

async function getTipAccount(rpc: Rpc<LilJitAddon>): Promise<Address> {
    try {
        const tipAccounts = await rpc.getTipAccounts().send();
        const jitoTipAddress = tipAccounts[Math.floor(Math.random() * tipAccounts.length)];
        if (!jitoTipAddress) {
            throw new Error("No JITO tip accounts found");
        }
        return jitoTipAddress;
    } catch {
        throw new Error("Failed to get Tip Account");
    }
}


async function pollBundleStatus(
    rpc: Rpc<LilJitAddon>,
    bundleId: string,
    timeoutMs = 30000,
    pollIntervalMs = 3000,
    waitBeforePollMs = DEFAULT_WAIT_BEFORE_POLL_MS
) {
    await sleep(waitBeforePollMs);

    const startTime = Date.now();
    let lastStatus = '';
    while (Date.now() - startTime < timeoutMs) {
        try {
            const bundleStatus = await rpc.getInflightBundleStatuses([bundleId]).send();
            const status = bundleStatus.value[0]?.status ?? 'Unknown';

            if (status !== lastStatus) {
                lastStatus = status;
            }

            if (status === 'Landed') {
                return true;
            }

            if (status === 'Failed') {
                throw new Error(`Bundle ${status.toLowerCase()} failed with status: ${status}`);
            }

            await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        } catch {
            console.error('❌ - Error polling bundle status.');
        }
    }
    throw new Error("Polling timeout reached without confirmation");
}



async function main() {
    // Step 1 - Setup
    const signer = await createKeyPairSignerFromBytes(new Uint8Array(secret));
    console.log(`Initializing Jito Bundles demo. Sending ${NUMBER_TRANSACTIONS} transactions from ${signer.address}.`);
    const quickNode = {
        solana: createSolanaRpc(ENDPOINT),
        lilJit: createJitoBundlesRpc({ endpoint: ENDPOINT }),
    }
    console.log(`✅ - Established connection to QuickNode.`);

    // Step 2 - Get a Jitotip account
    const jitoTipAddress = await getTipAccount(quickNode.lilJit);
    console.log(`✅ - Using the following Jito Tip account: ${jitoTipAddress}`);

    // Step 3 - Get Recent Blockhash
    const { value: latestBlockhash } = await quickNode.solana
        .getLatestBlockhash({ commitment: "confirmed" })
        .send();
    console.log(`✅ - Latest blockhash: ${latestBlockhash.blockhash}`);

    // Step 4 - Create Transactions
    const signedTransactions = await Promise.all(
        Array.from({ length: NUMBER_TRANSACTIONS }, (_, i) => {
            const isLastTransaction = i === NUMBER_TRANSACTIONS - 1;
            return createTransaction(
                i + 1,
                latestBlockhash,
                signer,
                isLastTransaction ? jitoTipAddress : undefined
            );
        })
    );

    const base64EncodedTransactions = signedTransactions.map((transaction) => {
        const base64EncodedTransaction = getBase64EncodedWireTransaction(transaction);
        return base64EncodedTransaction;
    }) as Base64EncodedWireTransaction[];

    const transactionEncoder = getTransactionEncoder();
    const base58Decoder = getBase58Decoder();

    const base58EncodedTransactions = signedTransactions.map((transaction) => {
        const transactionBytes = transactionEncoder.encode(transaction);
        return base58Decoder.decode(transactionBytes) as Base58EncodedBytes;
    });
    console.log(`✅ - Trannsactions assembled and encoded.`);

    // Step 5 - Simulate Bundle
    const simulation = await quickNode.lilJit
        .simulateBundle([base64EncodedTransactions])
        .send();

    validateSimulation(simulation);
    console.log(`✅ - Simulation Succeeded.`);

    if (SIMULATE_ONLY) {
        console.log("🏁 - Simulation Only Mode - Exiting script.");
        return;
    }

    // Step 6 - Send Bundle
    let bundleId: string;
    try {
        bundleId = await quickNode.lilJit
            .sendBundle(base58EncodedTransactions)
            .send();
        console.log(`✅ - Bundle sent: ${bundleId}`);
    } catch (error) {
        console.error("Error sending bundle:", error);
        throw error;
    }

    // Step 7 - Verify Bundle Landed
    await pollBundleStatus(quickNode.lilJit, bundleId, POLL_TIMEOUT_MS, POLL_INTERVAL_MS);
    console.log(`✅ - Bundle landed: ${bundleId}`);
    console.log(`     https://explorer.jito.wtf/bundle/${bundleId}`);
    console.log(`     (Note: This URL may take a few moments to become available.)`);
}

main().catch((error) => {
    console.error(`❌ - Error: ${error}`);
    process.exit(1);
});
