import { QuickNodeSolana } from './src';
import { getAddMemoInstruction } from "@solana-program/memo";
import { createKeyPairSignerFromBytes, lamports } from "@solana/web3.js";
import { getTransferSolInstruction } from "@solana-program/system";
import secret from "./secret.json";

// Initialize QuickNode client
const quickNode = new QuickNodeSolana({
    endpoint: 'https://example.solana-mainnet.quiknode.pro/123/', 
});

// Create and send a transaction
async function sendTransaction() {
    // Create or import your keypair (you can generate using `solana-keygen`). Make sure file i saved as secret.json (or update imports accordingly)
    const payerSigner = await createKeyPairSignerFromBytes(new Uint8Array(secret));

    // Create instructions
    const instructions = [
        getAddMemoInstruction({
            memo: "Hello Solana!",
        }),
        getTransferSolInstruction({
            amount: lamports(BigInt(1)),
            source: payerSigner,
            destination: payerSigner.address, // use payerSigner.address for demo purposes
        })
    ];

    // Send transaction with automatic compute units and priority fees
    const signature = await quickNode.sendSmartTransaction({
        instructions,
        signer: payerSigner,
    });

    console.log(`Transaction sent! Signature: ${signature}`);
}

sendTransaction().catch((error) => {
    console.error(`❌ Error: ${error}`);
    process.exit(1);
});