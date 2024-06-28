import {
    ActionPostResponse,
    ACTIONS_CORS_HEADERS,
    createPostResponse,
    ActionGetResponse,
    ActionPostRequest,
} from "@solana/actions";
import {
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";
import { initializeConnection, handleError } from "@/utils/solana";

const DEFAULT_SOL_AMOUNT = 1.0;
const DEFAULT_SOL_ADDRESS = new PublicKey("QN484oyeerMKQY2t9pEhT3XAjVpd1q4bF8y3Covobbn");

export const GET = async (req: Request) => {
    try {
        const requestUrl = new URL(req.url);
        const { toPubkey } = validatedQueryParams(requestUrl);

        const baseHref = new URL(
            `/api/actions/donate?to=${toPubkey.toBase58()}`,
            requestUrl.origin,
        ).toString();

        const payload: ActionGetResponse = {
            title: "Quick Actions Example - Donate SOL",
            icon: new URL("/qn-pixel.png", new URL(req.url).origin).toString(),
            description: "Donate SOL to another Solana wallet",
            label: "Donate SOL", // this value will be ignored since `links.actions` exists
            links: {
                actions: [
                    {
                        label: "Send 1 SOL", // button text
                        href: `${baseHref}&amount=${"1"}`,
                    },
                    {
                        label: "Send 5 SOL", // button text
                        href: `${baseHref}&amount=${"5"}`,
                    },
                    {
                        label: "Send 10 SOL", // button text
                        href: `${baseHref}&amount=${"10"}`,
                    },
                    {
                        label: "Send SOL", // button text
                        href: `${baseHref}&amount={amount}`, // this href will have a text input
                        parameters: [
                            {
                                name: "amount", // parameter name in the `href` above
                                label: "Enter the amount of SOL to send", // placeholder of the text input
                                required: true,
                            },
                        ],
                    },
                ],
            },
        };

        return Response.json(payload, {
            headers: ACTIONS_CORS_HEADERS,
        });
    } catch (err) {
        return handleError(err);
    }
};

// DO NOT FORGET TO INCLUDE THE `OPTIONS` HTTP METHOD
// THIS WILL ENSURE CORS WORKS FOR BLINKS
export const OPTIONS = GET;

export const POST = async (req: Request) => {
    try {
        const requestUrl = new URL(req.url);
        const { amount, toPubkey } = validatedQueryParams(requestUrl);

        const body: ActionPostRequest = await req.json();

        // validate the client provided input
        let account: PublicKey;
        try {
            account = new PublicKey(body.account);
        } catch (err) {
            return handleError('Invalid "account" provided');
        }

        const connection = initializeConnection();

        const transaction = new Transaction();
        transaction.feePayer = account;

        transaction.add(
            SystemProgram.transfer({
                fromPubkey: account,
                toPubkey: toPubkey,
                lamports: amount * LAMPORTS_PER_SOL,
            }),
        );

        transaction.feePayer = account;

        transaction.recentBlockhash = (
            await connection.getLatestBlockhash()
        ).blockhash;

        const payload: ActionPostResponse = await createPostResponse({
            fields: {
                transaction,
                message: `Send ${amount} SOL to ${toPubkey.toBase58()}`,
            },
            // note: no additional signers are needed
            // signers: [],
        });

        return Response.json(payload, {
            headers: ACTIONS_CORS_HEADERS,
        });
    } catch (err) {
        handleError(err);
    }
};

function validatedQueryParams(requestUrl: URL) {
    let toPubkey: PublicKey = DEFAULT_SOL_ADDRESS;
    let amount: number = DEFAULT_SOL_AMOUNT;

    try {
        if (requestUrl.searchParams.get("to")) {
            toPubkey = new PublicKey(requestUrl.searchParams.get("to")!);
        }
    } catch (err) {
        throw "Invalid input query parameter: to";
    }

    try {
        if (requestUrl.searchParams.get("amount")) {
            amount = parseFloat(requestUrl.searchParams.get("amount")!);
        }

        if (amount <= 0) throw "amount is too small";
    } catch (err) {
        throw "Invalid input query parameter: amount";
    }

    return {
        amount,
        toPubkey,
    };
}