import { Connection, Keypair, PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import {
    getMinimumBalanceForRentExemptMint,
    getAssociatedTokenAddressSync,
    MINT_SIZE, TOKEN_PROGRAM_ID,
    createInitializeMintInstruction,
    createMintToInstruction,
    createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";

const amountToDecimalAmount = (amount: number, decimals: number) => {
    return amount * (10 ** decimals);
}

interface createNewTokenReturn {
    instructions: TransactionInstruction[],
    signers: Keypair[]
}

interface createNewTokenParams {
    authority: PublicKey,
    connection: Connection,
    numDecimals?: number,
    numTokens?: number
}

export async function createNewToken({
    authority,
    connection,
    numDecimals = 0,
    numTokens = 0
}: createNewTokenParams): Promise<createNewTokenReturn> {
    const instructions: TransactionInstruction[] = [];
    // Instruction 1 - Create a new account
    const requiredBalance = await getMinimumBalanceForRentExemptMint(connection);
    const mintKeypair = Keypair.generate();
    const ix1 = SystemProgram.createAccount({
        fromPubkey: authority,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: requiredBalance,
        programId: TOKEN_PROGRAM_ID,
    });

    // Instruction 2 - Initialize the new account as a mint
    const ix2 = createInitializeMintInstruction(
        mintKeypair.publicKey,
        numDecimals,
        authority,
        authority
    );
    instructions.push(ix1, ix2)

    // If no tokens are to be minted, return the init instructions without appending any minting instructions
    if (numTokens === 0) return { instructions, signers: [mintKeypair] };

    // Instruction 3 - Create an associated token account for the mint
    const tokenATA = getAssociatedTokenAddressSync(mintKeypair.publicKey, authority);
    const ix3 = createAssociatedTokenAccountIdempotentInstruction(
        authority,
        tokenATA,
        authority,
        mintKeypair.publicKey
    );

    // Instruction 4 - Mint tokens to the new account
    const ix4 = createMintToInstruction(
        mintKeypair.publicKey,
        tokenATA,
        authority,
        amountToDecimalAmount(numTokens, numDecimals)
    );
    instructions.push(ix3, ix4)

    return { instructions: instructions, signers: [mintKeypair] };
}