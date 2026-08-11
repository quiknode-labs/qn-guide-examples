// Guide walkthrough: How to Send Transactions with Solana Web3.js 2.0
// https://www.quicknode.com/guides/solana-development/solana-web3.js-2.0/transfer-sol

import {
    airdropFactory,
    createKeyPairSignerFromBytes,
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    generateKeyPairSigner,
    lamports,
    sendAndConfirmTransactionFactory,
    pipe,
    createTransactionMessage,
    setTransactionMessageFeePayer,
    assertIsTransactionWithBlockhashLifetime,
    setTransactionMessageLifetimeUsingBlockhash,
    appendTransactionMessageInstruction,
    signTransactionMessageWithSigners,
    getSignatureFromTransaction,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import user2secret from "./keypair.json"; // Create with `solana-keygen new -o ./keypair.json --no-bip39-passphrase`

const LAMPORTS_PER_SOL = BigInt(1_000_000_000);

async function main() {
    // 1 - Establish connection to Solana cluster
    //     Change as needed to the network you're using.
    //     Get a free Devnet or Mainnet endpoint from:
    //     https://www.quicknode.com/signup?utm_source=internal&utm_campaign=sample-apps&utm_content=solana-web3.js-2.0-transfer-sol
    const httpProvider = 'http://127.0.0.1:8899';
    const wssProvider = 'ws://127.0.0.1:8900';
    const rpc = createSolanaRpc(httpProvider);
    const rpcSubscriptions = createSolanaRpcSubscriptions(wssProvider);
    console.log(`✅ - Established connection to ${httpProvider}`);

    // 2 - Generate signers
    const user1 = await generateKeyPairSigner();
    console.log(`✅ - New user1 address created: ${user1.address}`);
    const user2 = await createKeyPairSignerFromBytes(new Uint8Array(user2secret));
    console.log(`✅ - user2 address generated from file: ${user2.address}`);

    // 3 - Airdrop SOL to accounts
    // Using RPC method
    const tx1 = await rpc.requestAirdrop(
        user1.address,
        lamports(LAMPORTS_PER_SOL),
        { commitment: 'processed' }
    ).send();
    console.log(`✅ - user1 airdropped 1 SOL using RPC methods`);
    console.log(`✅ - tx1: ${tx1}`);

    // Using factory function
    const airdrop = airdropFactory({ rpc, rpcSubscriptions });
    const tx2 = await airdrop({
        commitment: 'processed',
        lamports: lamports(LAMPORTS_PER_SOL),
        recipientAddress: user2.address
    });
    console.log(`✅ - user2 airdropped 1 SOL using Factory Function`);
    console.log(`✅ - tx2: ${tx2}`);

    // 4 - Create transfer transaction
    const otherAccount = await generateKeyPairSigner();

    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
    const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        tx => setTransactionMessageFeePayer(user1.address, tx),
        tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        tx => appendTransactionMessageInstruction(
            getTransferSolInstruction({
                amount: lamports(LAMPORTS_PER_SOL / BigInt(2)),
                destination: user2.address,
                source: user1,
            }),
            tx
        ),
        /* OPTIONAL: Uncomment to add another transfer instruction
            tx => appendTransactionMessageInstruction(
                getTransferSolInstruction({
                    amount: lamports(LAMPORTS_PER_SOL / BigInt(3)),
                    destination: address(otherAccount.address),
                    source: user1,
                }),
                tx
            )
        */
    );

    // 5 - Sign and send transaction
    const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
    const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });

    // Ensure this transaction uses a recent blockhash.
    assertIsTransactionWithBlockhashLifetime(signedTransaction);

    try {
        await sendAndConfirmTransaction(
            signedTransaction,
            { commitment: 'confirmed', skipPreflight: true }
        );
        const signature = getSignatureFromTransaction(signedTransaction);
        console.log('✅ - Transfer transaction:', signature);
    } catch (e) {
        console.error('Transfer failed:', e);
    }
}

main();
