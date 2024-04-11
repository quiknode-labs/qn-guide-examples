import {
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    PublicKey,
} from '@solana/web3.js';

import {
    ExtensionType,
    createInitializeMintInstruction,
    getMintLen,
    TOKEN_2022_PROGRAM_ID,
    createInitializeMetadataPointerInstruction,
    TYPE_SIZE,
    LENGTH_SIZE,
    createAssociatedTokenAccountIdempotentInstruction,
    getAssociatedTokenAddressSync,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createMintToInstruction
} from '@solana/spl-token';

import {
    createInitializeInstruction,
    pack,
    TokenMetadata,
} from "@solana/spl-token-metadata";

import { JsonMetadata } from "@/utils/types";


const metadataExtension = TYPE_SIZE + LENGTH_SIZE;

interface MintTokenProps {
    connection: Connection;
    authority: PublicKey;
    jsonMetadata: JsonMetadata;
    jsonUri: string;
    decimals: number;
    amount: number;
    mintKeypair: Keypair;
}

export const buildCreateTokenTx = async ({
    connection,
    authority,
    jsonMetadata,
    jsonUri,
    decimals,
    amount,
    mintKeypair
}: MintTokenProps) => {
    try {
        const mint = mintKeypair.publicKey;
        const metaData: TokenMetadata = {
            updateAuthority: authority,
            mint,
            name: jsonMetadata.name,
            symbol: jsonMetadata.symbol,
            uri: jsonUri,
            additionalMetadata: [],
        };
        const metadataLen = pack(metaData).length;
        const mintLen = getMintLen([ExtensionType.MetadataPointer]);

        const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataExtension + metadataLen, 'processed');
        const associatedToken = getAssociatedTokenAddressSync(mint, authority, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

        const mintTransaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: authority,
                newAccountPubkey: mint,
                space: mintLen,
                lamports: mintLamports,
                programId: TOKEN_2022_PROGRAM_ID,
            }),
            createInitializeMetadataPointerInstruction(
                mint,
                authority,
                mint,
                TOKEN_2022_PROGRAM_ID,
            ),
            createInitializeMintInstruction(
                mint,
                decimals,
                authority,
                null,
                TOKEN_2022_PROGRAM_ID,
            ),
            createInitializeInstruction({
                programId: TOKEN_2022_PROGRAM_ID,
                metadata: mint,
                updateAuthority: authority,
                mint: mint,
                mintAuthority: authority,
                name: metaData.name,
                symbol: metaData.symbol,
                uri: metaData.uri,
            }),
            createAssociatedTokenAccountIdempotentInstruction(
                authority,
                associatedToken,
                authority,
                mint,
                TOKEN_2022_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID,
            ),
            createMintToInstruction(
                mint,
                associatedToken,
                authority,
                amount * (10 ** decimals),
                undefined,
                TOKEN_2022_PROGRAM_ID
            )
        );
        return { mintTransaction };
    } catch (error) {
        console.error('Error creating token tx:', error);
        throw error;
    }


}