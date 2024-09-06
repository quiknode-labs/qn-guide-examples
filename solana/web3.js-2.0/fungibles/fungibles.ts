import { getCreateAccountInstruction } from "@solana-program/system";
import {
    findAssociatedTokenPda,
    getCreateAssociatedTokenIdempotentInstructionAsync,
    getInitializeMintInstruction,
    getMintSize,
    getMintToInstruction,
    TOKEN_PROGRAM_ADDRESS,    
} from "@solana-program/token";
import {
    airdropFactory,
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    generateKeyPairSigner,
    lamports,
    sendAndConfirmTransactionFactory,
    pipe,
    createTransactionMessage,
    setTransactionMessageLifetimeUsingBlockhash,
    setTransactionMessageFeePayerSigner,
    appendTransactionMessageInstructions,
} from "@solana/web3.js";
import { createSignAndSendTransaction } from "../helpers";

const LAMPORTS_PER_SOL = BigInt(1_000_000_000);
const DECIMALS = 9;
const DROP_AMOUNT = 100;

async function main() {
    // 1 - Establish connection to Solana cluster
    //     Change as needed to the network you're using.
    //     Get a free Devnet or Mainnet endpoint from:
    //     https://www.quicknode.com/signup?utm_source=internal&utm_campaign=sample-apps&utm_content=solana-web3.js-2.0-fungibles
    const httpEndpoint = 'http://127.0.0.1:8899';
    const wsEndpoint = 'ws://127.0.0.1:8900';
    const rpc = createSolanaRpc(httpEndpoint);
    const rpcSubscriptions = createSolanaRpcSubscriptions(wsEndpoint);
    console.log(`✅ - Established connection to ${httpEndpoint}`);

    // 2 - Generate key pairs
    const mintAuthority = await generateKeyPairSigner();
    const payer = await generateKeyPairSigner();
    const owner = await generateKeyPairSigner();
    const mint = await generateKeyPairSigner();

    const [ata] = await findAssociatedTokenPda({
        mint: mint.address,
        owner: owner.address,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    console.log(`✅ - Generated key pairs`);
    console.log(`     Mint Authority: ${mintAuthority.address}`);
    console.log(`     Payer: ${payer.address}`);
    console.log(`     Owner: ${owner.address}`);
    console.log(`     Mint: ${mint.address}`);
    console.log(`     Associated Token Account: ${ata}`);

    // 3 - Airdrop SOL to payer account
    const airdrop = airdropFactory({ rpc, rpcSubscriptions });
    const airdropTx = await airdrop({
        commitment: 'processed',
        lamports: lamports(LAMPORTS_PER_SOL),
        recipientAddress: payer.address
    });
    console.log(`✅ - Airdropped 1 SOL to payer: ${airdropTx}`);

    // 4 - Create mint account and initialize mint
    const mintSpace = BigInt(getMintSize());
    const mintRent = await rpc.getMinimumBalanceForRentExemption(mintSpace).send();

    const instructions = [
        // Create the Mint Account
        getCreateAccountInstruction({
            payer,
            newAccount: mint,
            lamports: mintRent,
            space: mintSpace,
            programAddress: TOKEN_PROGRAM_ADDRESS,
        }),
        // Initialize the Mint
        getInitializeMintInstruction({
            mint: mint.address,
            decimals: DECIMALS,
            mintAuthority: mintAuthority.address
        }),
    ];

    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
    const signAndSendTransaction = createSignAndSendTransaction(sendAndConfirmTransaction);

    const createMintTxid = await pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(payer, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) => appendTransactionMessageInstructions(instructions, tx),
        (tx) => signAndSendTransaction(tx)
    );
    console.log(`✅ - Mint account created and initialized: ${createMintTxid}`);

    // 5 - Create Associated Token Account and mint tokens
    const mintInstructions = [
        // Create the Destination Associated Token Account
        await getCreateAssociatedTokenIdempotentInstructionAsync({
            mint: mint.address,
            payer,
            owner: owner.address,
        }),
        // Mint To the Destination Associated Token Account
        getMintToInstruction({
            mint: mint.address,
            token: ata,
            // DROP_AMOUNT X 10^ DECIMALS
            amount: BigInt(DROP_AMOUNT * 10 ** DECIMALS),
            mintAuthority, // Signs by including the signer rather than the public key
        })
    ];

    const mintTxid = await pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(payer, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) => appendTransactionMessageInstructions(mintInstructions, tx),
        (tx) => signAndSendTransaction(tx)
    );
    console.log(`✅ - Tokens minted to ATA: ${mintTxid}`);
}

main();



