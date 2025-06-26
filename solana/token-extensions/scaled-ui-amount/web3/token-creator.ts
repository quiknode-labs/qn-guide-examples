import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction
  } from '@solana/web3.js';
  
  import {
    ExtensionType,
    TOKEN_2022_PROGRAM_ID,
    createInitializeMintInstruction,
    createInitializeScaledUiAmountConfigInstruction,
    getMintLen,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    updateMultiplier,
    getScaledUiAmountConfig,
    unpackMint,
    createTransferInstruction
  } from '@solana/spl-token';
  
  import * as fs from 'fs';
  import * as path from 'path';
  
  const CONFIG = {
    DECIMAL_PLACES: 6,
    INITIAL_UI_AMOUNT_MULTIPLIER: 1.0,
    MODIFIED_UI_AMOUNT_MULTIPLIER: 2.0,
    TOKEN_NAME: "Scaled Demo Token",
    TOKEN_SYMBOL: "SDT",
    MINT_AMOUNT: 100,
    TRANSFER_AMOUNT: 10,
    CONNECTION_URL: 'http://127.0.0.1:8899',
    KEYPAIR_DIR: path.join(__dirname, 'keys')
  };
  
  interface StatusLog {
    step: string;
    timestamp: string;
    multiplier: number;
    rawBalance: string;
    uiBalance: string;
    description: string;
  }
  
  const demoLogs: StatusLog[] = [];
  
  async function getTokenMultiplier(
    connection: Connection,
    mintPublicKey: PublicKey
  ): Promise<number> {
    const mintInfo = await connection.getAccountInfo(mintPublicKey);
    if (!mintInfo) {
      throw new Error(`Mint account not found: ${mintPublicKey.toString()}`);
    }
  
    const unpackedMint = unpackMint(mintPublicKey, mintInfo, TOKEN_2022_PROGRAM_ID);
    const extensionData = getScaledUiAmountConfig(unpackedMint);
    if (!extensionData) {
      return 1.0; // Default if no extension data
    } else {
      const currentTime = new Date().getTime();
      if (Number(extensionData.newMultiplierEffectiveTimestamp) < currentTime) {
        return extensionData.newMultiplier;
      } else {
        return extensionData.multiplier;
      }
    }
  }
  
  async function getTokenBalance(
    connection: Connection,
    tokenAccount: PublicKey,
  ): Promise<{ rawAmount: string, uiAmount: string }> {
    try {
      const balanceDetail = await connection.getTokenAccountBalance(tokenAccount);
      return {
        rawAmount: balanceDetail.value.amount,
        uiAmount: balanceDetail.value.uiAmountString || '0'
      };
    } catch (error) {
      return {
        rawAmount: 'n/a',
        uiAmount: 'n/a'
      };
    }
  }
  
  async function logStatus(
    connection: Connection,
    step: string,
    mintPublicKey: PublicKey,
    tokenAccount: PublicKey | null,
    description: string
  ): Promise<void> {
    const now = new Date();
    const timestamp = now.toLocaleTimeString();
  
    const multiplier = await getTokenMultiplier(connection, mintPublicKey);
  
    let rawBalance = 'n/a';
    let uiBalance = 'n/a';
  
    if (tokenAccount) {
      const balance = await getTokenBalance(connection, tokenAccount);
      rawBalance = balance.rawAmount;
      uiBalance = balance.uiAmount;
    }
  
    demoLogs.push({
      step,
      timestamp,
      multiplier,
      rawBalance,
      uiBalance,
      description
    });
  }
  
  function printSummaryTable(): void {
    console.log("\n=== DEMONSTRATION SUMMARY ===");
    console.table(demoLogs.map(log => ({
      Step: log.step,
      Timestamp: log.timestamp,
      Multiplier: log.multiplier,
      "Raw Balance": log.rawBalance,
      "UI Balance": log.uiBalance
    })));
  }
  
  async function waitForTransaction(
    connection: Connection,
    signature: string,
    timeout = 30000,
    transactionNote: string
  ): Promise<string> {
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          let done = false;
          while (!done && Date.now() - startTime < timeout) {
            const status = await connection.getSignatureStatus(signature);
  
            if (status?.value?.confirmationStatus === 'confirmed' ||
              status?.value?.confirmationStatus === 'finalized') {
              done = true;
              console.log(` ✅ Transaction ${transactionNote} confirmed: ${signature}`);
              resolve(signature);
            } else {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
  
          if (!done) {
            reject(new Error(` ❌ Transaction confirmation timeout after ${timeout}ms`));
          }
        } catch (error) {
          reject(error);
        }
      })();
    });
  }
  
  async function getOrCreateKeypair(keyPath: string, label: string): Promise<Keypair> {
    try {
      if (fs.existsSync(keyPath)) {
        const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
        const keypair = Keypair.fromSecretKey(new Uint8Array(keyData));
        return keypair;
      } else {
        const keypair = Keypair.generate();
        fs.writeFileSync(keyPath, JSON.stringify(Array.from(keypair.secretKey)));
        return keypair;
      }
    } catch (error) {
      const keypair = Keypair.generate();
      console.log(`Generated new ${label} keypair as fallback: ${keypair.publicKey.toString()}`);
      return keypair;
    }
  }
  
  async function setup(connection: Connection, payer: Keypair) {
    try {
      const airdropSignature = await connection.requestAirdrop(
        payer.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await waitForTransaction(connection, airdropSignature, 30000, "airdrop");
    } catch (error) {
      console.error('Error funding payer account:', error);
      console.log('If you are not using a local validator, you need to fund the payer account manually.');
    }
  }
  
  async function createScaledToken(connection: Connection, payer: Keypair, mint: Keypair, mintAuthority: Keypair) {
    try {
      // Calculate space needed for the mint account with Scaled UI Amount extension
      const extensions = [ExtensionType.ScaledUiAmountConfig];
      const mintLen = getMintLen(extensions);
  
      // Calculate lamports needed for rent-exemption
      const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen);
  
      // Create a new token with Token-2022 program & Scaled UI Amount extension
      const transaction = new Transaction().add(
        // Create account for the mint
        SystemProgram.createAccount({
          fromPubkey: payer.publicKey,
          newAccountPubkey: mint.publicKey,
          space: mintLen,
          lamports: mintLamports,
          programId: TOKEN_2022_PROGRAM_ID,
        }),
        // Initialize Scaled UI Amount extension
        createInitializeScaledUiAmountConfigInstruction(
          mint.publicKey,
          mintAuthority.publicKey,
          CONFIG.INITIAL_UI_AMOUNT_MULTIPLIER,
          TOKEN_2022_PROGRAM_ID
        ),
        // Initialize the mint
        createInitializeMintInstruction(
          mint.publicKey,
          CONFIG.DECIMAL_PLACES,
          mintAuthority.publicKey,
          mintAuthority.publicKey,
          TOKEN_2022_PROGRAM_ID
        )
      );
  
      const createMintSignature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer, mint],
        { commitment: 'confirmed' }
      );
  
      console.log(` ✅ Token created! Transaction signature: ${createMintSignature}`);
      console.log(`    Mint address: ${mint.publicKey.toString()}`);
  
      return;
    } catch (error) {
      console.error('Error creating token:', error);
      throw error;
    }
  }
  
  async function updateScaledUiAmountMultiplier(
    connection: Connection,
    mint: Keypair,
    mintAuthority: Keypair,
    payer: Keypair,
    newMultiplier: number,
    startTimestamp: number = 0 // default, 0, is effective immediately
  ): Promise<string> {
    try {
      const signature = await updateMultiplier(
        connection,
        payer,
        mint.publicKey,
        mintAuthority,
        newMultiplier,
        BigInt(startTimestamp),
        [payer, mintAuthority],
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
  
      await waitForTransaction(connection, signature, 30000, "multiplier update");
  
      console.log(` UI amount multiplier updated! Transaction signature: ${signature}`);
  
      return signature;
    } catch (error) {
      console.error(' Error updating UI amount multiplier:', error);
      throw error;
    }
  }
  
  async function transferTokens(
    connection: Connection,
    payer: Keypair,
    source: PublicKey,
    sourceOwner: Keypair,
    mint: PublicKey
  ): Promise<string> {
    try {
      const amount = CONFIG.TRANSFER_AMOUNT * (10 ** CONFIG.DECIMAL_PLACES);
  
      const destinationOwner = Keypair.generate();
      const destinationAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        destinationOwner.publicKey,
        false,
        'confirmed',
        {},
        TOKEN_2022_PROGRAM_ID
      );
  
      const tx = new Transaction().add(
        createTransferInstruction(
          source,
          destinationAccount.address,
          sourceOwner.publicKey,
          amount,
          [sourceOwner],
          TOKEN_2022_PROGRAM_ID
        )
      );
  
      const transferSignature = await sendAndConfirmTransaction(
        connection,
        tx,
        [payer, sourceOwner],
        { commitment: 'confirmed' }
      );
  
      console.log(` ✅ Tokens transferred! Transaction signature: ${transferSignature}`);
  
      return transferSignature;
    } catch (error) {
      console.error(' ❌ Error transferring tokens');
      throw error;
    }
  }
  
  async function demonstrateScaledToken(): Promise<void> {
    try {
      console.log(`=== SCALED TOKEN DEMONSTRATION ===`);
      console.log(`\n=== Setup ===`);
      const connection = new Connection(CONFIG.CONNECTION_URL, 'confirmed');
      const payer = await getOrCreateKeypair(path.join(CONFIG.KEYPAIR_DIR, 'payer.json'), 'payer');
      const mintAuthority = await getOrCreateKeypair(path.join(CONFIG.KEYPAIR_DIR, 'mint-authority.json'), 'mint authority');
      const mint = await getOrCreateKeypair(path.join(CONFIG.KEYPAIR_DIR, 'mint.json'), 'mint');
      const holder = await getOrCreateKeypair(path.join(CONFIG.KEYPAIR_DIR, 'holder.json'), 'token holder');
      await setup(connection, payer);
  
      console.log(`\n=== Step 1: Creating Token Mint ===`);
      await createScaledToken(connection, payer, mint, mintAuthority);
  
      await logStatus(
        connection,
        "Initial Setup",
        mint.publicKey,
        null,
        "Token created with Scaled UI Amount extension"
      );
  
      console.log(`\n=== Step 2: Creating Holder's Token Account ===`);
      const holderTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint.publicKey,
        holder.publicKey,
        false,
        'confirmed',
        {},
        TOKEN_2022_PROGRAM_ID
      );
  
      console.log(` ✅ Holder's token account created: ${holderTokenAccount.address.toString()}`);
      await logStatus(
        connection,
        "After ATA Created",
        mint.publicKey,
        holderTokenAccount.address,
        "Holder's token account created"
      );
  
      console.log(`\n=== Step 3: Minting Initial Tokens ===`);
      const initialMintAmount = CONFIG.MINT_AMOUNT * (10 ** CONFIG.DECIMAL_PLACES);
  
      const mintToSignature = await mintTo(
        connection,
        payer,
        mint.publicKey,
        holderTokenAccount.address,
        mintAuthority,
        initialMintAmount,
        [],
        {},
        TOKEN_2022_PROGRAM_ID
      );
  
      await waitForTransaction(connection, mintToSignature, 30000, "initial mint");
  
      await logStatus(
        connection,
        "After Mint #1",
        mint.publicKey,
        holderTokenAccount.address,
        `Minted ${CONFIG.MINT_AMOUNT} tokens with initial multiplier`
      );
  
      console.log(`\n=== Step 4: Transferring Tokens ===`);
      await transferTokens(
        connection,
        payer,
        holderTokenAccount.address,
        holder,
        mint.publicKey
      );
  
      await logStatus(
        connection,
        "After Transfer #1",
        mint.publicKey,
        holderTokenAccount.address,
        `Transferred ${CONFIG.TRANSFER_AMOUNT} tokens to another account`
      );
  
      console.log(`\n=== Step 5: Updating Scale Multiplier ===`);
      await updateScaledUiAmountMultiplier(
        connection,
        mint,
        mintAuthority,
        payer,
        CONFIG.MODIFIED_UI_AMOUNT_MULTIPLIER
      );
  
      await logStatus(
        connection,
        "After Multiplier Update",
        mint.publicKey,
        holderTokenAccount.address,
        `Updated multiplier to ${CONFIG.MODIFIED_UI_AMOUNT_MULTIPLIER}x`
      );
  
      console.log(`\n=== Step 6: Minting Additional Tokens ===`);
      const additionalMintSignature = await mintTo(
        connection,
        payer,
        mint.publicKey,
        holderTokenAccount.address,
        mintAuthority,
        initialMintAmount, // Same raw amount as before
        [],
        {},
        TOKEN_2022_PROGRAM_ID
      );
  
      await waitForTransaction(connection, additionalMintSignature, 30000, "additional mint");
  
      await logStatus(
        connection,
        "After Mint #2",
        mint.publicKey,
        holderTokenAccount.address,
        `Minted additional ${CONFIG.MINT_AMOUNT} tokens with current multiplier`
      );
  
      console.log(`\n=== Step 7: Transferring Additional Tokens ===`);
      await transferTokens(
        connection,
        payer,
        holderTokenAccount.address,
        holder,
        mint.publicKey
      );
  
      await logStatus(
        connection,
        "After Transfer #2",
        mint.publicKey,
        holderTokenAccount.address,
        `Transferred ${CONFIG.TRANSFER_AMOUNT} tokens to another account (with multiplier)`
      );
  
      printSummaryTable();
    } catch (error) {
      console.error('Error in scaled token demonstration:', error);
    }
  }
  
  if (require.main === module) {
    console.log('Starting the Token-2022 Scaled UI Amount demonstration...');
    demonstrateScaledToken()
      .then(() => console.log(`=== DEMONSTRATION COMPLETED ===`))
      .catch(error => console.error('Demonstration failed with error:', error));
  }