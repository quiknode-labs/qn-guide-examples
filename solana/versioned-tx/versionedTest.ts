import { Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, TransactionInstruction, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import secret from './guideSecret.json';

const SIGNER_WALLET = Keypair.fromSecretKey(new Uint8Array(secret));
const DESTINATION_WALLET = Keypair.generate();

const QUICKNODE_RPC = 'https://example.solana-devnet.quiknode.pro/0123456/';
const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC);

const instructions: TransactionInstruction[] = [
    SystemProgram.transfer({
        fromPubkey: SIGNER_WALLET.publicKey,
        toPubkey: DESTINATION_WALLET.publicKey,
        lamports: 0.01 * LAMPORTS_PER_SOL,
    }),
];

async function createAndSendV0Tx(txInstructions: TransactionInstruction[]) {
    // Step 1 - Fetch Latest Blockhash
    let latestBlockhash = await SOLANA_CONNECTION.getLatestBlockhash('confirmed');
    console.log("   ✅ - Fetched latest blockhash. Last Valid Height:", latestBlockhash.lastValidBlockHeight);

    // Step 2 - Generate Transaction Message
    const messageV0 = new TransactionMessage({
        payerKey: SIGNER_WALLET.publicKey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: txInstructions
    }).compileToV0Message();
    console.log("   ✅ - Compiled Transaction Message");
    const transaction = new VersionedTransaction(messageV0);

    // Step 3 - Sign your transaction with the required `Signers`
    transaction.sign([SIGNER_WALLET]);
    console.log("   ✅ - Transaction Signed");

    // Step 4 - Send our v0 transaction to the cluster
    const txid = await SOLANA_CONNECTION.sendTransaction(transaction, { maxRetries: 5 });
    console.log("   ✅ - Transaction sent to network");

    // Step 5 - Confirm Transaction 
    const confirmation = await SOLANA_CONNECTION.confirmTransaction({
        signature: txid,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
    })
    if (confirmation.value.err) { throw new Error("   ❌ - Transaction not confirmed.") }
    console.log('🎉 Transaction Succesfully Confirmed!', '\n', `https://explorer.solana.com/tx/${txid}?cluster=devnet`);
}

createAndSendV0Tx(instructions);