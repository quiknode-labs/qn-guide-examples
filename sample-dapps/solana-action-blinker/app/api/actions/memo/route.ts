import { initializeConnection, handleError } from "@/utils/solana";
import { ACTIONS_CORS_HEADERS, ActionGetResponse, ActionPostRequest, ActionPostResponse, MEMO_PROGRAM_ID, createPostResponse } from "@solana/actions";
import { ComputeBudgetProgram, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";

export const GET = async (req: Request, res: Response) => {
    const payload: ActionGetResponse = {
        title: "Quick Actions Example - Simple On-chain Memo",
        icon: new URL("/qn-pixel.png", new URL(req.url).origin).toString(),
        description: "Send a message on-chain using a Memo",
        label: "Send Memo",
    };

    return Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS,
    });
}

// DO NOT FORGET TO INCLUDE THE `OPTIONS` HTTP METHOD
// THIS WILL ENSURE CORS WORKS FOR BLINKS
export const OPTIONS = GET;

export const POST = async (req: Request) => {
    try {
        const body: ActionPostRequest = await req.json();

        let account: PublicKey;
        try {
            account = new PublicKey(body.account);
        } catch (err) {
            return handleError('Invalid "account" provided');
        }

        const connection = initializeConnection();

        const transaction = new Transaction().add(
            // note: `createPostResponse` requires at least 1 non-memo instruction
            ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: 1000,
            }),
            new TransactionInstruction({
                programId: new PublicKey(MEMO_PROGRAM_ID),
                data: Buffer.from("Sup - this is a Quick Example of Solana Actions.", "utf8"),
                keys: [],
            }),
        );

        // set the end user as the fee payer
        transaction.feePayer = account;

        transaction.recentBlockhash = (
            await connection.getLatestBlockhash()
        ).blockhash;

        const payload: ActionPostResponse = await createPostResponse({
            fields: {
                transaction,
                message: "A Quick Example memo transaction.",
            },
            // no additional signers are required for this transaction
            // signers: [],
        });

        return Response.json(payload, {
            headers: ACTIONS_CORS_HEADERS,
        });
    } catch (err) {
        return handleError(err);
    }
};