import { NextApiRequest, NextApiResponse } from 'next';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import crypto from 'crypto';

// CONSTANTS
const programId = new PublicKey('yV5T4jugYYqkPfA2REktXugfJ3HvmvRLEw7JxuB2TUf'); // 👈 You can use this program or create/use your own
const counterSeed = 'counter'; // This is the seed used to generate the counter account (may be different if you use a different program)
const functionName = 'increment'; // This is the name of our anchor instruction (may be different if you use a different program)
const message = `Quicknode Demo - Increment Counter`;
const [counterPda] = PublicKey.findProgramAddressSync([Buffer.from(counterSeed)], programId);

function getConnection() {
    const { QUICKNODE_RPC_URL, QUICKNODE_RPC_TOKEN } = process.env;
    if (!QUICKNODE_RPC_URL) throw new Error('Set QUICKNODE_RPC_URL on the server.');
    return new Connection(QUICKNODE_RPC_URL, {
        commitment: 'confirmed',
        httpHeaders: QUICKNODE_RPC_TOKEN ? { 'x-token': QUICKNODE_RPC_TOKEN } : undefined,
    });
}
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
            if (!account) return res.status(400).json({ error: 'Missing account field' });
            const transaction = await generateTx(account);
            res.status(200).send({ transaction, message });
        } catch {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    else if (req.method === 'GET') {
        if (req.query.count === 'true') {
            try {
                const account = await getConnection().getAccountInfo(counterPda);
                if (!account || account.data.length < 16) {
                    return res.status(404).json({ error: 'Counter account not found' });
                }
                return res.status(200).json({ count: account.data.readBigUInt64LE(8).toString() });
            } catch {
                return res.status(502).json({ error: 'Unable to read the counter' });
            }
        }
        res.status(200).json({ label, icon });
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}

async function generateTx(account: string) {
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
    const latestBlockhash = await getConnection().getLatestBlockhash();
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