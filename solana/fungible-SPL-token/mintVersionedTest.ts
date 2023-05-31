//Updated for Versioned Transactions


import { SystemProgram, Keypair, Connection, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { MINT_SIZE, TOKEN_PROGRAM_ID, createInitializeMintInstruction, getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createMintToInstruction } from '@solana/spl-token';
import { DataV2, createCreateMetadataAccountV3Instruction } from '@metaplex-foundation/mpl-token-metadata';
import { bundlrStorage, keypairIdentity, Metaplex, UploadMetadataInput } from '@metaplex-foundation/js';
import secret from './guideSecret.json';

const endpoint = 'https://example.solana-devnet.quiknode.pro/000000/'; //Replace with your RPC Endpoint
const solanaConnection = new Connection(endpoint);

const MINT_CONFIG = {
  numDecimals: 6,
  numberTokens: 1337
}
const userWallet = Keypair.fromSecretKey(new Uint8Array(secret));
const metaplex = Metaplex.make(solanaConnection)
  .use(keypairIdentity(userWallet))
  .use(bundlrStorage({
    address: 'https://devnet.bundlr.network',
    providerUrl: endpoint,
    timeout: 60000,
  }));

//Reference: https://docs.metaplex.com/programs/token-metadata/token-standard#the-fungible-standard
//this will be uploaded to arweave
const MY_TOKEN_METADATA: UploadMetadataInput = {
  name: "Just a Test Token",
  symbol: "TEST",
  description: "This is a test token developed from ",
  image: "https://URL_TO_YOUR_IMAGE.png" //add public URL to image you'd like to use
}

//this will be stored on chain
const ON_CHAIN_METADATA = {
  name: MY_TOKEN_METADATA.name,
  symbol: MY_TOKEN_METADATA.symbol,
  uri: 'NEED_TO_ADD',
  sellerFeeBasisPoints: 0,
  creators: null,
  collection: null,
  uses: null
} as DataV2;


/**
 * 
 * @param wallet Solana Keypair
 * @param tokenMetadata Metaplex Fungible Token Standard object 
 * @returns 
 */
const uploadMetadata = async (tokenMetadata: UploadMetadataInput): Promise<string> => {
  //Upload to Arweave
  const { uri } = await metaplex.nfts().uploadMetadata(tokenMetadata);
  console.log(`Arweave URL: `, uri);
  return uri;

}


const createNewMintTransaction = async (connection: Connection, payer: Keypair, mintKeypair: Keypair, destinationWallet: PublicKey, mintAuthority: PublicKey, freezeAuthority: PublicKey) => {

  //Get the minimum lamport balance to create a new account and avoid rent payments
  const requiredBalance = await getMinimumBalanceForRentExemptMint(connection);
  //metadata account associated with mint
  const metadataPDA = await metaplex.nfts().pdas().metadata({ mint: mintKeypair.publicKey });
  //get associated token account of your wallet
  const tokenATA = await getAssociatedTokenAddress(mintKeypair.publicKey, destinationWallet);

  const txInstructions: TransactionInstruction[] = [];

  txInstructions.push(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports: requiredBalance,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mintKeypair.publicKey, //Mint Address
      MINT_CONFIG.numDecimals, //Number of Decimals of New mint
      mintAuthority, //Mint Authority
      freezeAuthority, //Freeze Authority
      TOKEN_PROGRAM_ID),
    createAssociatedTokenAccountInstruction(
      payer.publicKey, //Payer 
      tokenATA, //Associated token account 
      payer.publicKey, //token owner
      mintKeypair.publicKey, //Mint
    ),
    createMintToInstruction(
      mintKeypair.publicKey, //Mint
      tokenATA, //Destination Token Account
      mintAuthority, //Authority
      MINT_CONFIG.numberTokens * Math.pow(10, MINT_CONFIG.numDecimals),//number of tokens
    ),
    createCreateMetadataAccountV3Instruction({
      metadata: metadataPDA,
      mint: mintKeypair.publicKey,
      mintAuthority: mintAuthority,
      payer: payer.publicKey,
      updateAuthority: mintAuthority,
    }, {
      createMetadataAccountArgsV3: {
        data: ON_CHAIN_METADATA,
        isMutable: true,
        collectionDetails: null
      }
    })
  );
  const latestBlockhash = await connection.getLatestBlockhash();
  const messageV0 = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: txInstructions
  }).compileToV0Message();
  console.log("   ✅ - Compiled Transaction Message");
  const transaction = new VersionedTransaction(messageV0);
  transaction.sign([payer, mintKeypair]);
  return transaction;
}

const main = async () => {
  console.log(`---STEP 1: Uploading MetaData---`);
  const userWallet = Keypair.fromSecretKey(new Uint8Array(secret));
  let metadataUri = await uploadMetadata(MY_TOKEN_METADATA);
  ON_CHAIN_METADATA.uri = metadataUri;

  console.log(`---STEP 2: Creating Mint Transaction---`);
  //Create new Keypair for Mint address
  let mintKeypair = Keypair.generate();
  console.log(`New Mint Address: `, mintKeypair.publicKey.toString());

  const newMintTransaction: VersionedTransaction = await createNewMintTransaction(
    solanaConnection,
    userWallet,
    mintKeypair,
    userWallet.publicKey,
    userWallet.publicKey,
    userWallet.publicKey
  );

  console.log(`---STEP 3: Executing Mint Transaction---`);
  let { lastValidBlockHeight, blockhash } = await solanaConnection.getLatestBlockhash('finalized');
  const transactionId = await solanaConnection.sendTransaction(newMintTransaction);
  await solanaConnection.confirmTransaction({
    signature: transactionId,
    lastValidBlockHeight,
    blockhash
  })
  console.log(`Transaction ID: `, transactionId);
  console.log(`Succesfully minted ${MINT_CONFIG.numberTokens} ${ON_CHAIN_METADATA.symbol} to ${userWallet.publicKey.toString()}.`);
  console.log(`View Transaction: https://explorer.solana.com/tx/${transactionId}?cluster=devnet`);
}

main();