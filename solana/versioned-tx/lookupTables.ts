import { AddressLookupTableAccount, AddressLookupTableProgram, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import secret from './guideSecret.json';

const SIGNER_WALLET = Keypair.fromSecretKey(new Uint8Array(secret));
const DESTINATION_WALLET = Keypair.generate();
const LOOKUP_TABLE_ADDRESS = new PublicKey("3uBhgRWPTPLfvfqxi4M9eVZC8nS1kDG9XPkdHKgG69nw"); // 👈 replace with your value

const QUICKNODE_RPC = 'https://example.solana-devnet.quiknode.pro/0123456/';
const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC);

async function createAndSendV0Tx(txInstructions: TransactionInstruction[]) {
    // Step 1 - Fetch Latest Blockhash
    let latestBlockhash = await SOLANA_CONNECTION.getLatestBlockhash('finalized');
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
    });
    if (confirmation.value.err) { throw new Error("   ❌ - Transaction not confirmed.") }
    console.log('🎉 Transaction Successfully Confirmed!', '\n', `https://explorer.solana.com/tx/${txid}?cluster=devnet`);
}

async function createLookupTable() {
    // Step 1 - Get a lookup table address and create lookup table instruction
    const [lookupTableInst, lookupTableAddress] =
        AddressLookupTableProgram.createLookupTable({
            authority: SIGNER_WALLET.publicKey,
            payer: SIGNER_WALLET.publicKey,
            recentSlot: await SOLANA_CONNECTION.getSlot(),
        });

    // Step 2 - Log Lookup Table Address
    console.log("Lookup Table Address:", lookupTableAddress.toBase58());

    // Step 3 - Generate a transaction and send it to the network
    createAndSendV0Tx([lookupTableInst]);
}

async function addAddressesToTable() {
    // Step 1 - Create Transaction Instruction
    const addAddressesInstruction = AddressLookupTableProgram.extendLookupTable({
        payer: SIGNER_WALLET.publicKey,
        authority: SIGNER_WALLET.publicKey,
        lookupTable: LOOKUP_TABLE_ADDRESS,
        addresses: [
            Keypair.generate().publicKey,
            SystemProgram.programId
        ],
    });
    // Step 2 - Generate a transaction and send it to the network
    await createAndSendV0Tx([addAddressesInstruction]);
    console.log(`Lookup Table URL: `,`https://explorer.solana.com/address/${LOOKUP_TABLE_ADDRESS.toString()}?cluster=devnet`)
}

async function findAddressesInTable() {
    // Step 1 - Fetch our address lookup table
    const lookupTableAccount = await SOLANA_CONNECTION.getAddressLookupTable(LOOKUP_TABLE_ADDRESS)
    console.log(`Successfully found lookup table: `, lookupTableAccount.value?.key.toString());

    // Step 2 - Make sure our search returned a valid table
    if (!lookupTableAccount.value) return;

    // Step 3 - Log each table address to console
    for (let i = 0; i < lookupTableAccount.value.state.addresses.length; i++) {
        const address = lookupTableAccount.value.state.addresses[i];
        console.log(`   Address ${(i + 1)}: ${address.toBase58()}`);
    }
}

async function compareTxSize() {
    // Step 1 - Fetch the lookup table
    const lookupTable = (await SOLANA_CONNECTION.getAddressLookupTable(LOOKUP_TABLE_ADDRESS)).value;
    if (!lookupTable) return;
    console.log("   ✅ - Fetched Lookup Table:", lookupTable.key.toString());

    // Step 2 - Generate a Solana transfer instruction to an address in our lookup table
    const txInstructions: TransactionInstruction[] = [];
    for (let i = 0; i < lookupTable.state.addresses.length; i++) {
        const address = lookupTable.state.addresses[i];
        txInstructions.push(
            SystemProgram.transfer({
                fromPubkey: SIGNER_WALLET.publicKey,
                toPubkey: address,
                lamports: 0.01 * LAMPORTS_PER_SOL,
            })
        )
    }

    // Step 3 - Fetch the latest Blockhash
    let latestBlockhash = await SOLANA_CONNECTION.getLatestBlockhash('finalized');
    console.log("   ✅ - Fetched latest blockhash. Last Valid Height:", latestBlockhash.lastValidBlockHeight);

    // Step 4 - Generate and sign a transaction that uses a lookup table
    const messageWithLookupTable = new TransactionMessage({
        payerKey: SIGNER_WALLET.publicKey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: txInstructions
    }).compileToV0Message([lookupTable]); // 👈 NOTE: We DO include the lookup table
    const transactionWithLookupTable = new VersionedTransaction(messageWithLookupTable);
    transactionWithLookupTable.sign([SIGNER_WALLET]);

    // Step 5 - Generate and sign a transaction that DOES NOT use a lookup table

    const messageWithoutLookupTable = new TransactionMessage({
        payerKey: SIGNER_WALLET.publicKey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: txInstructions
    }).compileToV0Message(); // 👈 NOTE: We do NOT include the lookup table
    const transactionWithoutLookupTable = new VersionedTransaction(messageWithoutLookupTable);
    transactionWithoutLookupTable.sign([SIGNER_WALLET]);

    console.log("   ✅ - Compiled Transactions");

    // Step 6 - Log our transaction size
    console.log('Transaction Size without Address Lookup Table: ', transactionWithoutLookupTable.serialize().length, 'bytes');
    console.log('Transaction Size with Address Lookup Table:    ', transactionWithLookupTable.serialize().length, 'bytes');
}

//createLookupTable();
//addAddressesToTable();
//findAddressesInTable();
//compareTxSize();