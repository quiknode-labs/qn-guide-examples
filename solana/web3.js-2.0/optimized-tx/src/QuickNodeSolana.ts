import {
    Rpc,
    createRpc,
    createJsonRpcApi, // note: in older versions of this library, this function was called: createRpcApi
    RpcRequest,
    pipe,
    createTransactionMessage,
    setTransactionMessageLifetimeUsingBlockhash,
    createSolanaRpc,
    prependTransactionMessageInstruction,
    Blockhash,
    CompilableTransactionMessage,
    BaseTransactionMessage,
    setTransactionMessageFeePayer,
    Address,
    signTransaction,
    appendTransactionMessageInstructions,
    compileTransaction,
    assertIsFullySignedTransaction,
    sendAndConfirmTransactionFactory,
    createSolanaRpcSubscriptions,
    getSignatureFromTransaction,
    assertIsTransactionMessageWithBlockhashLifetime,
    SolanaRpcApi,
    RpcSubscriptions,
    SolanaRpcSubscriptionsApi
} from "@solana/kit";
import {
    getSetComputeUnitLimitInstruction,
    getSetComputeUnitPriceInstruction,
    estimateComputeUnitLimitFactory
} from "@solana-program/compute-budget";
import { DEFAULTS } from './constants/defaults';
import { QuicknodeSolanaConfig } from './types/config';
import { PrepareSmartTransactionMessageArgs, SendSmartTransactionArgs } from './types/transaction';
import { createQuicknodeTransport } from './utils/transport'
import { PriorityFeeApi, PriorityFeeQuery } from "./types";

export class QuicknodeSolana {
    private readonly solanaCore: Rpc<SolanaRpcApi>;
    private readonly priorityFeeApi: Rpc<PriorityFeeApi>;
    private readonly solanaSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
    private readonly computeMargin: number;
    
    constructor({ endpoint, wssEndpoint, computeMargin = DEFAULTS.DEFAULT_COMPUTE_MARGIN }: QuicknodeSolanaConfig) {
        if (!wssEndpoint) {
            const httpProviderUrl = new URL(endpoint);
            httpProviderUrl.protocol = "wss:";
            wssEndpoint = httpProviderUrl.toString();
        }

        this.solanaCore = createSolanaRpc(endpoint);
        this.priorityFeeApi = this.createPriorityFeeApi(endpoint);
        this.solanaSubscriptions = createSolanaRpcSubscriptions(wssEndpoint);
        this.computeMargin = computeMargin;
    }

    private createPriorityFeeApi(endpoint: string): Rpc<PriorityFeeApi> {
        const api = createJsonRpcApi<PriorityFeeApi>({
            requestTransformer: (request: RpcRequest<any>) => request.params[0],
            responseTransformer: (response: any) => response.result,
        });
        const transport = createQuicknodeTransport(endpoint);
        return createRpc({ api, transport });
    }

    private createTransactionMessageWithInstructions(
        feePayerAddress: Address<string>,
        instructions: ReadonlyArray<BaseTransactionMessage['instructions'][number]>,
        blockHash: Readonly<{
            blockhash: Blockhash;
            lastValidBlockHeight: bigint;
        }> = DEFAULTS.PLACEHOLDER_BLOCKHASH,
        computeUnits: number = DEFAULTS.PLACEHOLDER_COMPUTE_UNIT,
        priorityFeeMicroLamports: number = DEFAULTS.PLACEHOLDER_PRIORITY_FEE,
    ): CompilableTransactionMessage {
        return pipe(
            createTransactionMessage({ version: 0 }),
            (tx) => setTransactionMessageFeePayer(feePayerAddress, tx),
            (tx) => setTransactionMessageLifetimeUsingBlockhash(blockHash, tx),
            (tx) => prependTransactionMessageInstruction(
                getSetComputeUnitLimitInstruction({ units: computeUnits }),
                tx
            ),
            (tx) => prependTransactionMessageInstruction(
                getSetComputeUnitPriceInstruction({ microLamports: priorityFeeMicroLamports }),
                tx
            ),
            (tx) => appendTransactionMessageInstructions(instructions, tx)
        );
    }

    private async estimateComputeUnits(sampleMessage: CompilableTransactionMessage): Promise<number> {
        const computeUnitsEstimator = estimateComputeUnitLimitFactory({
            rpc: this.solanaCore
        });
        const estimatedComputeUnits = await computeUnitsEstimator(sampleMessage);
        return Math.ceil(estimatedComputeUnits * this.computeMargin);
    }

    private async getPriorityFeeMicroLamports(priorityFeeQuery: PriorityFeeQuery): Promise<number> {
        const priorityFees = await this.priorityFeeApi.qn_estimatePriorityFees({
            account: priorityFeeQuery.account,
            last_n_blocks: priorityFeeQuery.last_n_blocks,
            api_version: priorityFeeQuery.api_version
        }).send();
        return priorityFeeQuery.level === "recommended" 
            ? priorityFees.recommended 
            : priorityFees.per_compute_unit[priorityFeeQuery.level];
    }

    async prepareSmartTransactionMessage({
        instructions,
        feePayerAddress,
        priorityFeeQuery = { level: "extreme" },
        blockHashCommitment = "confirmed"
    }: PrepareSmartTransactionMessageArgs): Promise<CompilableTransactionMessage> {
        const sampleMessage = this.createTransactionMessageWithInstructions(
            feePayerAddress,
            instructions,
        );
        const estimatedComputeUnits = await this.estimateComputeUnits(sampleMessage);
        const priorityFeeMicroLamports = await this.getPriorityFeeMicroLamports(priorityFeeQuery);

        const { value: latestBlockhash } = await this.solanaCore
            .getLatestBlockhash({ commitment: blockHashCommitment })
            .send();

        return this.createTransactionMessageWithInstructions(
            feePayerAddress,
            instructions,
            latestBlockhash,
            estimatedComputeUnits,
            priorityFeeMicroLamports
        );
    }

    async sendSmartTransaction({
        instructions,
        signer,
        priorityFeeQuery = { level: "extreme" },
        blockHashCommitment = "confirmed",
        confirmCommitment = "confirmed"
    }: SendSmartTransactionArgs): Promise<string> {
        const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
            rpc: this.solanaCore,
            rpcSubscriptions: this.solanaSubscriptions
        });

        const smartMessage = await this.prepareSmartTransactionMessage({
            instructions,
            feePayerAddress: signer.address,
            priorityFeeQuery,
            blockHashCommitment
        });

        assertIsTransactionMessageWithBlockhashLifetime(smartMessage);
        const compiledTransaction = compileTransaction(smartMessage);
        const signedTransaction = await signTransaction([signer.keyPair], compiledTransaction);
        assertIsFullySignedTransaction(signedTransaction);
        const signature = getSignatureFromTransaction(signedTransaction);

        try {
            await sendAndConfirmTransaction(
                signedTransaction,
                { commitment: confirmCommitment }
            );
            return signature;
        } catch (error) {
            throw error;
        }
    }
}