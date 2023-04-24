import { NextApiRequest, NextApiResponse } from 'next';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import crypto from 'crypto';

// CONSTANTS
const programId = new PublicKey('yV5T4jugYYqkPfA2REktXugfJ3HvmvRLEw7JxuB2TUf'); // 👈 You can use this program or create/use your own
const counterSeed = 'counter'; // This is the seed used to generate the counter account (may be different if you use a different program)
const functionName = 'increment'; // This is the name of our anchor instruction (may be different if you use a different program)
const message = `QuickNode Demo - Increment Counter`;
const quickNodeEndpoint = 'https://example.solana-devnet.quiknode.pro/0123456/'; // 👈 Replace with your own devnet endpoint
const connection = new Connection(quickNodeEndpoint, 'confirmed');
const label = 'QuickCount +1';
const icon = 'https://www.arweave.net/wtjT0OwnRfwRuUhe9WXzSzGMUCDlmIX7rh8zqbapzno?ext=png';

// Utility function to generate data for a specific Anchor instruction
function getInstructionData(instructionName: string) {
    return Buffer.from(
        crypto.createHash('sha256').update(`global:${instructionName}`).digest().subarray(0, 8)
    );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const account: string = req.body?.account;
            if (!account) res.status(400).json({ error: 'Missing account field' });
            const transaction = await generateTx(account);
            res.status(200).send({ transaction, message });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    else if (req.method === 'GET') {
        res.status(200).json({ label, icon });
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}

async function generateTx(account: string) {
    // 1. Get the counter PDA
    const [counterPda] = PublicKey.findProgramAddressSync([Buffer.from(counterSeed)], programId);
    // 2. Create the data buffer with the function selector
    const data = getInstructionData(functionName);
    // 3. Build the transaction to call the increment function
    const tx = new Transaction();
    const incrementIx = new TransactionInstruction({
      keys: [
        { pubkey: counterPda, isWritable: true, isSigner: false },
      ],
      programId: programId,
      data
    });
    // 4. Set the latest blockhash and set the fee payer
    const latestBlockhash = await connection.getLatestBlockhash();
    tx.feePayer = new PublicKey(account);
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.add(incrementIx);
    // 5. Serialize the transaction
    const serializedTransaction = tx.serialize({
      verifySignatures: false,
      requireAllSignatures: false,
    });
    // 6. Encode the transaction data as base64
    const base64Transaction = serializedTransaction.toString('base64');
    return base64Transaction;
  }