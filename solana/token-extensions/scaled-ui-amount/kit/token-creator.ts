import { getCreateAccountInstruction } from '@solana-program/system';
import {
    extension,
    Extension,
    ExtensionArgs,
    findAssociatedTokenPda,
    getCreateAssociatedTokenIdempotentInstructionAsync,
    getInitializeMintInstruction,
    getMintSize,
    getMintToInstruction,
    getPostInitializeInstructionsForMintExtensions,
    getPreInitializeInstructionsForMintExtensions,
    getUpdateMultiplierScaledUiMintInstruction,
    getTransferInstruction,
    fetchMint,
    TOKEN_2022_PROGRAM_ADDRESS
} from "@solana-program/token-2022";
import {
    airdropFactory,
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    generateKeyPairSigner,
    lamports,
    Rpc,
    sendAndConfirmTransactionFactory,
    pipe,
    createTransactionMessage,
    setTransactionMessageLifetimeUsingBlockhash,
    setTransactionMessageFeePayerSigner,
    appendTransactionMessageInstructions,
    createKeyPairSignerFromBytes,
    KeyPairSigner,
    SolanaRpcApi,
    SolanaRpcSubscriptionsApi,
    RpcSubscriptions,
    Signature,
    Address,
    TransactionSigner,
    IInstruction,
    Commitment,
    signTransactionMessageWithSigners,
    CompilableTransactionMessage,
    TransactionMessageWithBlockhashLifetime,
    getSignatureFromTransaction,
} from "@solana/kit"

import * as fs from 'fs';
import * as path from 'path';

const CONFIG = {
    DECIMAL_PLACES: 6,
    INITIAL_UI_AMOUNT_MULTIPLIER: 1.0,
    MODIFIED_UI_AMOUNT_MULTIPLIER: 2.0,
    TOKEN_NAME: "Scaled Demo Token",
    TOKEN_SYMBOL: "SDT",
    MINT_AMOUNT: 100,
    TRANSFER_AMOUNT: 10,
    HTTP_CONNECTION_URL: 'http://127.0.0.1:8899',
    WSS_CONNECTION_URL: 'ws://127.0.0.1:8900',
    KEYPAIR_DIR: path.join(__dirname, 'keys')
};
const LAMPORTS_PER_SOL = BigInt(1_000_000_000);

interface StatusLog {
    step: string;
    timestamp: string;
    multiplier: number;
    rawBalance: string;
    uiBalance: string;
    description: string;
}

interface Client {
    rpc: Rpc<SolanaRpcApi>;
    rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
}

const demoLogs: StatusLog[] = [];

async function getTokenMultiplier(
    client: Client,
    mintAddress: Address
): Promise<number> {
    try {
        const mint = await fetchMint(client.rpc, mintAddress);
        if (!mint.data.extensions || mint.data.extensions.__option === 'None') {
            return 1.0; // Default if no extensions
        }
        
        const extensionArray = mint.data.extensions.__option === 'Some' ? mint.data.extensions.value : [];
        const extensionData = extensionArray.find(
            (ext: Extension) => ext.__kind === 'ScaledUiAmountConfig'
        );
        
        if (!extensionData) {
            return 1.0; // Default if no extension data
        } else {
            const currentTime = new Date().getTime();
            if (Number(extensionData.newMultiplierEffectiveTimestamp) < currentTime) {
                return extensionData.newMultiplier;
            } else {
                return extensionData.multiplier;
            }
        }
    } catch (error) {
        console.error('Error getting token multiplier:', error);
        return 1.0; // Default on error
    }
}

async function logStatus(
    client: Client,
    step: string,
    mintAddress: Address,
    tokenAccount: Address | null,
    description: string
): Promise<void> {
    const now = new Date();
    const timestamp = now.toLocaleTimeString();

    const multiplier = await getTokenMultiplier(client, mintAddress);
    let rawBalance = 'n/a';
    let uiBalance = 'n/a';

    if (tokenAccount) {
        const balance = await client.rpc.getTokenAccountBalance(tokenAccount).send();
        rawBalance = balance.value.amount;
        uiBalance = balance.value.uiAmountString;
    }

    demoLogs.push({
        step,
        timestamp,
        multiplier,
        rawBalance,
        uiBalance,
        description
    });
}

function printSummaryTable(): void {
    console.log("\n=== DEMONSTRATION SUMMARY ===");
    console.table(demoLogs.map(log => ({
        Step: log.step,
        Timestamp: log.timestamp,
        Multiplier: log.multiplier,
        "Raw Balance": log.rawBalance,
        "UI Balance": log.uiBalance
    })));
}

async function getOrCreateKeypairSigner(keyPath: string, label: string): Promise<KeyPairSigner<string>> {
    try {
        if (!fs.existsSync(keyPath)) {
            throw new Error(`Keypair file not found: ${keyPath}`);
        }
        const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
        const keypair = await createKeyPairSignerFromBytes(new Uint8Array(keyData));
        return keypair;
    } catch (error) {
        const keypair = await generateKeyPairSigner();
        console.log(`Generated new ${label} keypair as fallback: ${keypair.address}`);
        return keypair;
    }
}




export const createDefaultTransaction = async (
    client: Client,
    feePayer: TransactionSigner
) => {
    const { value: latestBlockhash } = await client.rpc
        .getLatestBlockhash()
        .send();
    return pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx)
    );
};
export const signAndSendTransaction = async (
    client: Client,
    transactionMessage: CompilableTransactionMessage &
        TransactionMessageWithBlockhashLifetime,
    commitment: Commitment = 'confirmed'
) => {
    const signedTransaction =
        await signTransactionMessageWithSigners(transactionMessage);
    const signature = getSignatureFromTransaction(signedTransaction);
    await sendAndConfirmTransactionFactory(client)(signedTransaction, {
        commitment,
    });
    return signature;
};
export const sendAndConfirmInstructions = async (
    client: Client,
    payer: TransactionSigner,
    instructions: IInstruction[]
) => {
    const signature = await pipe(
        await createDefaultTransaction(client, payer),
        (tx) => appendTransactionMessageInstructions(instructions, tx),
        (tx) => signAndSendTransaction(client, tx)
    );
    return signature;
};


async function setup(client: Client, payer: KeyPairSigner<string>) {
    try {
        const airdrop = airdropFactory({ rpc: client.rpc, rpcSubscriptions: client.rpcSubscriptions });
        const airdropTx: Signature = await airdrop({
            commitment: 'processed',
            lamports: lamports(LAMPORTS_PER_SOL),
            recipientAddress: payer.address
        });
        console.log(` ✅ Transaction airdrop confirmed: ${airdropTx}`);
    } catch (error) {
        console.error(' ❌ Error funding payer account');
    }
}

const getCreateMintInstructions = async (input: {
    authority: Address;
    client: Client;
    decimals?: number;
    extensions?: ExtensionArgs[];
    freezeAuthority?: Address;
    mint: TransactionSigner;
    payer: TransactionSigner;
    programAddress?: Address;
}) => {
    const space = getMintSize(input.extensions);
    const postInitializeExtensions: Extension['__kind'][] = [
        'TokenMetadata',
        'TokenGroup',
        'TokenGroupMember',
    ];
    const spaceWithoutPostInitializeExtensions = input.extensions
        ? getMintSize(
            input.extensions.filter(
                (e) => !postInitializeExtensions.includes(e.__kind)
            )
        )
        : space;
    const rent = await input.client.rpc
        .getMinimumBalanceForRentExemption(BigInt(space))
        .send();
    return [
        getCreateAccountInstruction({
            payer: input.payer,
            newAccount: input.mint,
            lamports: rent,
            space: spaceWithoutPostInitializeExtensions,
            programAddress: input.programAddress ?? TOKEN_2022_PROGRAM_ADDRESS,
        }),
        getInitializeMintInstruction({
            mint: input.mint.address,
            decimals: input.decimals ?? 0,
            freezeAuthority: input.freezeAuthority,
            mintAuthority: input.authority,
        }),
    ];
};


const createScaledToken = async (
    input: Omit<
        Parameters<typeof getCreateMintInstructions>[0],
        'authority' | 'mint'
    > & {
        authority: TransactionSigner;
        mint?: TransactionSigner;
    }
): Promise<Address> => {
    const mint = input.mint ?? (await generateKeyPairSigner());
    const [createAccount, initMint] = await getCreateMintInstructions({
        ...input,
        authority: input.authority.address,
        mint,
    });
    const createMintSignature = await sendAndConfirmInstructions(input.client, input.payer, [
        createAccount,
        ...getPreInitializeInstructionsForMintExtensions(
            mint.address,
            input.extensions ?? []
        ),
        initMint,
        ...getPostInitializeInstructionsForMintExtensions(
            mint.address,
            input.authority,
            input.extensions ?? []
        ),
    ]);
    console.log(` ✅ Token created! Transaction signature: ${createMintSignature}`);
    console.log(`    Mint address: ${mint.address}`);

    return mint.address;
};

async function createAta(client: Client, payer: TransactionSigner, mint: TransactionSigner, owner: TransactionSigner): Promise<Address> {
    const createAta = await getCreateAssociatedTokenIdempotentInstructionAsync({
        payer,
        mint: mint.address,
        owner: owner.address,
        tokenProgram: TOKEN_2022_PROGRAM_ADDRESS
    });
    await sendAndConfirmInstructions(client, payer, [createAta]);
    const [ata] = await findAssociatedTokenPda({
        mint: mint.address,
        owner: owner.address,
        tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
    });
    console.log(` ✅ Associated token account created: ${ata}`);
    return ata;
}

async function transferTokens(client: Client, payer: TransactionSigner, source: Address, sourceOwner: TransactionSigner, mint: TransactionSigner, amount: bigint) {
    try {
        const destination = await generateKeyPairSigner();
        const destinationTokenAccount = await createAta(client, payer, mint, destination);
        const transferInstruction = getTransferInstruction({
            source: source,
            destination: destinationTokenAccount,
            authority: sourceOwner,
            amount: amount,
        }, {
            programAddress: TOKEN_2022_PROGRAM_ADDRESS
        });
        const txid = await sendAndConfirmInstructions(client, payer, [transferInstruction]);
        console.log(` ✅ Transfer transaction confirmed: ${txid}`);
        return txid;
    } catch (error) {
        console.error(' ❌ Error transferring tokens');
        throw error;
    }
}


async function mintTokens(client: Client, payer: TransactionSigner, mintAuthority: TransactionSigner,mint: TransactionSigner,  tokenAccount: Address, amount: bigint) {
    try {
        const mintToInstruction = getMintToInstruction({
            mint: mint.address,
            token: tokenAccount,
            amount,
            mintAuthority
        }, {
            programAddress: TOKEN_2022_PROGRAM_ADDRESS
        });
        const txid = await sendAndConfirmInstructions(client, payer, [mintToInstruction]);
        console.log(` ✅ Mint transaction confirmed: ${txid}`);
        return txid;
    } catch (error) {
        console.error(' ❌ Error minting tokens');
        throw error;
    }
}

async function updateMultiplier(client: Client, payer: TransactionSigner, mint: TransactionSigner, mintAuthority: TransactionSigner, newMultiplier: number) {
    try {
        const updateMultiplierInstruction = getUpdateMultiplierScaledUiMintInstruction({
            mint: mint.address,
            authority: mintAuthority,
            effectiveTimestamp: BigInt(0),
            multiplier: newMultiplier,
        }, {
            programAddress: TOKEN_2022_PROGRAM_ADDRESS
        });
        const txid = await sendAndConfirmInstructions(client, payer, [updateMultiplierInstruction]);
        console.log(` ✅ Update multiplier transaction confirmed: ${txid}`);
        return txid;
    } catch (error) {
        console.error(' ❌ Error updating multiplier');
        throw error;
    }
}


async function demonstrateScaledToken(): Promise<void> {
    try {
        console.log(`=== SCALED TOKEN DEMONSTRATION ===`);
        console.log(`\n=== Setup ===`);

        const client: Client = {
            rpc: createSolanaRpc(CONFIG.HTTP_CONNECTION_URL),
            rpcSubscriptions: createSolanaRpcSubscriptions(CONFIG.WSS_CONNECTION_URL)
        };

        const payer = await getOrCreateKeypairSigner(path.join(CONFIG.KEYPAIR_DIR, 'payer.json'), 'payer');
        const mintAuthority = await getOrCreateKeypairSigner(path.join(CONFIG.KEYPAIR_DIR, 'mint-authority.json'), 'mint authority');
        const mint = await getOrCreateKeypairSigner(path.join(CONFIG.KEYPAIR_DIR, 'mint.json'), 'mint');
        const holder = await getOrCreateKeypairSigner(path.join(CONFIG.KEYPAIR_DIR, 'holder.json'), 'token holder');
        await setup(client, payer);

        console.log(`\n=== Step 1: Creating Token Mint ===`);
        const mintAddress = await createScaledToken({
            authority: mintAuthority,
            client,
            extensions: [
                extension('ScaledUiAmountConfig', {
                    authority: mintAuthority.address,
                    multiplier: CONFIG.INITIAL_UI_AMOUNT_MULTIPLIER,
                    newMultiplierEffectiveTimestamp: BigInt(0),
                    newMultiplier: CONFIG.INITIAL_UI_AMOUNT_MULTIPLIER,
                }),
            ],
            payer: payer,
            mint
        });
        await logStatus(
            client,
            "1. Token Created",
            mintAddress,
            null,
            "Token created with Scaled UI Amount extension"
        );
        console.log(`\n=== Step 2: Creating Holder's Token Account ===`);
        const holderTokenAccount = await createAta(client, payer, mint, holder);
        await logStatus(
            client,
            "2. Ata Created",
            mint.address,
            holderTokenAccount,
            "Holder's token account created"
        );

        console.log(`\n=== Step 3: Minting Initial Tokens ===`);
        await mintTokens(client, payer, mintAuthority, mint, holderTokenAccount, BigInt(CONFIG.MINT_AMOUNT));
        await logStatus(
            client,
            "3. After Mint #1",
            mint.address,
            holderTokenAccount,
            "Initial tokens minted"
        );

        console.log(`\n=== Step 4: Transferring Tokens ===`);
        await transferTokens(client, payer, holderTokenAccount, holder, mint, BigInt(CONFIG.TRANSFER_AMOUNT));
        await logStatus(
            client,
            "4. After Transfer",
            mint.address,
            holderTokenAccount,
            "Tokens transferred"
        );

        console.log(`\n=== Step 5: Updating Scale Multiplier ===`);
        await updateMultiplier(client, payer, mint, mintAuthority, CONFIG.MODIFIED_UI_AMOUNT_MULTIPLIER);
        await logStatus(
            client,
            "5. After Update Multiplier",
            mint.address,
            holderTokenAccount,
            "Multiplier updated"
        );
        console.log(`\n=== Step 6: Minting Additional Tokens ===`);
        await mintTokens(client, payer, mintAuthority, mint, holderTokenAccount, BigInt(CONFIG.MINT_AMOUNT));
        await logStatus(
            client,
            "6. After Mint #2",
            mint.address,
            holderTokenAccount,
            "Additional tokens minted"
        );

        console.log(`\n=== Step 7: Transferring Additional Tokens ===`);
        await transferTokens(client, payer, holderTokenAccount, holder, mint, BigInt(CONFIG.TRANSFER_AMOUNT));
        await logStatus(
            client,
            "7. After Transfer #2",
            mint.address,
            holderTokenAccount,
            "Additional tokens transferred"
        );

        printSummaryTable();
    }
    catch (error) {

    }
}

if (require.main === module) {
    console.log('Starting the Token-2022 Scaled UI Amount demonstration...');
    demonstrateScaledToken()
        .then(() => console.log(`=== DEMONSTRATION COMPLETED ===`))
        .catch(error => console.error('Demonstration failed with error:', error));
}

