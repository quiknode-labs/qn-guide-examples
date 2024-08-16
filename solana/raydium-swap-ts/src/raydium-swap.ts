import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  VersionedTransaction,
  TransactionMessage,
  GetProgramAccountsResponse,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
  SystemProgram,
  SimulatedTransactionResponse,
  TransactionConfirmationStrategy,  // Add this line
} from '@solana/web3.js';
import {
  Liquidity,
  LiquidityPoolKeys,
  jsonInfo2PoolKeys,
  TokenAccount,
  Token,
  TokenAmount,
  TOKEN_PROGRAM_ID,
  Percent,
  SPL_ACCOUNT_LAYOUT,
  LIQUIDITY_STATE_LAYOUT_V4,
  MARKET_STATE_LAYOUT_V3,
  Market,
} from '@raydium-io/raydium-sdk';
import { Wallet } from '@project-serum/anchor';
import base58 from 'bs58';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { 
  NATIVE_MINT,
  createInitializeAccountInstruction, 
  createCloseAccountInstruction,
  getMinimumBalanceForRentExemptAccount,
  createSyncNativeInstruction,
} from '@solana/spl-token';
import { CONFIG } from './config';

type SwapSide = "in" | "out";

export class RaydiumSwap {
  static RAYDIUM_V4_PROGRAM_ID = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';

  allPoolKeysJson: any[] = [];
  connection: Connection;
  wallet: Wallet;

  constructor(RPC_URL: string, WALLET_SECRET_KEY: string) {
    if (!RPC_URL.startsWith('http://') && !RPC_URL.startsWith('https://')) {
      throw new Error('Invalid RPC URL. Must start with http:// or https://');
    }
    this.connection = new Connection(RPC_URL, 'confirmed');

    try {
      if (!WALLET_SECRET_KEY) {
        throw new Error('WALLET_SECRET_KEY is not provided');
      }
      const secretKey = base58.decode(WALLET_SECRET_KEY);
      if (secretKey.length !== 64) {
        throw new Error('Invalid secret key length. Expected 64 bytes.');
      }
      this.wallet = new Wallet(Keypair.fromSecretKey(secretKey));
      console.log('Wallet initialized with public key:', this.wallet.publicKey.toBase58());
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create wallet: ${error.message}`);
      } else {
        throw new Error('Failed to create wallet: Unknown error');
      }
    }
  }

  async loadPoolKeys() {
    try {
      if (existsSync('mainnet.json')) {
        const data = JSON.parse((await readFile('mainnet.json')).toString());
        this.allPoolKeysJson = data.official;
        return;
      }
      throw new Error('mainnet.json file not found');
    } catch (error) {
      this.allPoolKeysJson = [];
    }
  }

  findPoolInfoForTokens(mintA: string, mintB: string): LiquidityPoolKeys | null {
    const poolData = this.allPoolKeysJson.find(
      (i) => (i.baseMint === mintA && i.quoteMint === mintB) || (i.baseMint === mintB && i.quoteMint === mintA)
    );
    return poolData ? jsonInfo2PoolKeys(poolData) as LiquidityPoolKeys : null;
  }

  async getProgramAccounts(baseMint: string, quoteMint: string): Promise<GetProgramAccountsResponse> {
    const layout = LIQUIDITY_STATE_LAYOUT_V4;
    return this.connection.getProgramAccounts(new PublicKey(RaydiumSwap.RAYDIUM_V4_PROGRAM_ID), {
      filters: [
        { dataSize: layout.span },
        {
          memcmp: {
            offset: layout.offsetOf('baseMint'),
            bytes: new PublicKey(baseMint).toBase58(),
          },
        },
        {
          memcmp: {
            offset: layout.offsetOf('quoteMint'),
            bytes: new PublicKey(quoteMint).toBase58(),
          },
        },
      ],
    });
  }

  async findRaydiumPoolInfo(baseMint: string, quoteMint: string): Promise<LiquidityPoolKeys | null> {
    const layout = LIQUIDITY_STATE_LAYOUT_V4;
    const programData = await this.getProgramAccounts(baseMint, quoteMint);
    const collectedPoolResults = programData
      .map((info) => ({
        id: new PublicKey(info.pubkey),
        version: 4,
        programId: new PublicKey(RaydiumSwap.RAYDIUM_V4_PROGRAM_ID),
        ...layout.decode(info.account.data),
      }))
      .flat();

    const pool = collectedPoolResults[0];
    if (!pool) return null;

    const market = await this.connection.getAccountInfo(pool.marketId).then((item) => {
      if (!item) {
        throw new Error('Market account not found');
      }
      return {
        programId: item.owner,
        ...MARKET_STATE_LAYOUT_V3.decode(item.data),
      };
    });

    const authority = Liquidity.getAssociatedAuthority({
      programId: new PublicKey(RaydiumSwap.RAYDIUM_V4_PROGRAM_ID),
    }).publicKey;

    const marketProgramId = market.programId;

    return {
      id: pool.id,
      baseMint: pool.baseMint,
      quoteMint: pool.quoteMint,
      lpMint: pool.lpMint,
      baseDecimals: Number.parseInt(pool.baseDecimal.toString()),
      quoteDecimals: Number.parseInt(pool.quoteDecimal.toString()),
      lpDecimals: Number.parseInt(pool.baseDecimal.toString()),
      version: pool.version,
      programId: pool.programId,
      openOrders: pool.openOrders,
      targetOrders: pool.targetOrders,
      baseVault: pool.baseVault,
      quoteVault: pool.quoteVault,
      marketVersion: 3,
      authority: authority,
      marketProgramId,
      marketId: market.ownAddress,
      marketAuthority: Market.getAssociatedAuthority({
        programId: marketProgramId,
        marketId: market.ownAddress,
      }).publicKey,
      marketBaseVault: market.baseVault,
      marketQuoteVault: market.quoteVault,
      marketBids: market.bids,
      marketAsks: market.asks,
      marketEventQueue: market.eventQueue,
      withdrawQueue: pool.withdrawQueue,
      lpVault: pool.lpVault,
      lookupTableAccount: PublicKey.default,
    } as LiquidityPoolKeys;
  }

  async getOwnerTokenAccounts() {
    const walletTokenAccount = await this.connection.getTokenAccountsByOwner(this.wallet.publicKey, {
      programId: TOKEN_PROGRAM_ID,
    });
    return walletTokenAccount.value.map((i) => ({
      pubkey: i.pubkey,
      programId: i.account.owner,
      accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
    }));
  }

  private getSwapSide(
    poolKeys: LiquidityPoolKeys,
    wantFrom: PublicKey,
    wantTo: PublicKey,
  ): SwapSide {
    if (poolKeys.baseMint.equals(wantFrom) && poolKeys.quoteMint.equals(wantTo)) {
      return "in";
    } else if (poolKeys.baseMint.equals(wantTo) && poolKeys.quoteMint.equals(wantFrom)) {
      return "out";
    } else {
      throw new Error("Not suitable pool fetched. Can't determine swap side");
    }
  }

  async getSwapTransaction(
    toToken: string,
    amount: number,
    poolKeys: LiquidityPoolKeys,
    useVersionedTransaction = true,
    slippage: number = 5
  ): Promise<Transaction | VersionedTransaction> {
    const poolInfo = await Liquidity.fetchInfo({ connection: this.connection, poolKeys });
    
    const fromToken = poolKeys.baseMint.toString() === NATIVE_MINT.toString() ? NATIVE_MINT.toString() : poolKeys.quoteMint.toString();
    const swapSide = this.getSwapSide(poolKeys, new PublicKey(fromToken), new PublicKey(toToken));

    const baseToken = new Token(TOKEN_PROGRAM_ID, poolKeys.baseMint, poolInfo.baseDecimals);
    const quoteToken = new Token(TOKEN_PROGRAM_ID, poolKeys.quoteMint, poolInfo.quoteDecimals);

    const currencyIn = swapSide === "in" ? baseToken : quoteToken;
    const currencyOut = swapSide === "in" ? quoteToken : baseToken;

    const amountIn = new TokenAmount(currencyIn, amount, false);
    const slippagePercent = new Percent(slippage, 100);

    const { amountOut, minAmountOut } = Liquidity.computeAmountOut({
      poolKeys,
      poolInfo,
      amountIn,
      currencyOut,
      slippage: slippagePercent,
    });

    const userTokenAccounts = await this.getOwnerTokenAccounts();

    const priorityFee = await CONFIG.getPriorityFee();
    console.log(`Using priority fee: ${priorityFee} SOL`);

    const swapTransaction = await Liquidity.makeSwapInstructionSimple({
      connection: this.connection,
      makeTxVersion: useVersionedTransaction ? 0 : 1,
      poolKeys: {
        ...poolKeys,
      },
      userKeys: {
        tokenAccounts: userTokenAccounts,
        owner: this.wallet.publicKey,
      },
      amountIn,
      amountOut: minAmountOut,
      fixedSide: swapSide,
      config: {
        bypassAssociatedCheck: false,
      },
      computeBudgetConfig: {
        units: 300000,
        microLamports: Math.floor(priorityFee * LAMPORTS_PER_SOL),
      },
    });

    const recentBlockhashForSwap = await this.connection.getLatestBlockhash();
    const instructions = swapTransaction.innerTransactions[0].instructions.filter(
      (instruction): instruction is TransactionInstruction => Boolean(instruction)
    );

    if (useVersionedTransaction) {
      const versionedTransaction = new VersionedTransaction(
        new TransactionMessage({
          payerKey: this.wallet.publicKey,
          recentBlockhash: recentBlockhashForSwap.blockhash,
          instructions: instructions,
        }).compileToV0Message()
      );
      versionedTransaction.sign([this.wallet.payer]);
      console.log('Versioned transaction signed with payer:', this.wallet.payer.publicKey.toBase58());
      return versionedTransaction;
    }

    const legacyTransaction = new Transaction({
      blockhash: recentBlockhashForSwap.blockhash,
      lastValidBlockHeight: recentBlockhashForSwap.lastValidBlockHeight,
      feePayer: this.wallet.publicKey,
    });
    legacyTransaction.add(...instructions);
    console.log('Legacy transaction signed with payer:', this.wallet.payer.publicKey.toBase58());
    return legacyTransaction;
  }

  async sendLegacyTransaction(tx: Transaction): Promise<string> {
    const signature = await this.connection.sendTransaction(tx, [this.wallet.payer], {
      skipPreflight: true,
      preflightCommitment: 'confirmed',
    });
    console.log('Legacy transaction sent, signature:', signature);
    const latestBlockhash = await this.connection.getLatestBlockhash();
const confirmationStrategy: TransactionConfirmationStrategy = {
  signature: signature,
  blockhash: latestBlockhash.blockhash,
  lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
};
const confirmation = await this.connection.confirmTransaction(confirmationStrategy, 'confirmed'); // Increase timeout to 60 seconds
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
    }
    return signature;
  }

  async sendVersionedTransaction(
    tx: VersionedTransaction,
    blockhash: string,
    lastValidBlockHeight: number
  ): Promise<string> {
    const rawTransaction = tx.serialize();
    const signature = await this.connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      preflightCommitment: 'confirmed',
    });
    console.log('Versioned transaction sent, signature:', signature);
  
    const confirmationStrategy: TransactionConfirmationStrategy = {
      signature: signature,
      blockhash: blockhash,
      lastValidBlockHeight: lastValidBlockHeight,
    };
  
    const confirmation = await this.connection.confirmTransaction(confirmationStrategy, 'confirmed');
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
    }
    return signature;
  }

  async simulateLegacyTransaction(tx: Transaction): Promise<SimulatedTransactionResponse> {
    const { value } = await this.connection.simulateTransaction(tx);
    return value;
  }

  async simulateVersionedTransaction(tx: VersionedTransaction): Promise<SimulatedTransactionResponse> {
    const { value } = await this.connection.simulateTransaction(tx);
    return value;
  }

  getTokenAccountByOwnerAndMint(mint: PublicKey) {
    return {
      programId: TOKEN_PROGRAM_ID,
      pubkey: PublicKey.default,
      accountInfo: {
        mint: mint,
        amount: 0,
      },
    } as unknown as TokenAccount;
  }

  async createWrappedSolAccountInstruction(amount: number): Promise<{
    transaction: Transaction;
    wrappedSolAccount: Keypair;
  }> {
    const lamports = amount * LAMPORTS_PER_SOL;
    const wrappedSolAccount = Keypair.generate();
    const transaction = new Transaction();

    const rentExemptBalance = await getMinimumBalanceForRentExemptAccount(this.connection);

    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: this.wallet.publicKey,
        newAccountPubkey: wrappedSolAccount.publicKey,
        lamports: rentExemptBalance,
        space: 165,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeAccountInstruction(
        wrappedSolAccount.publicKey,
        NATIVE_MINT,
        this.wallet.publicKey
      ),
      SystemProgram.transfer({
        fromPubkey: this.wallet.publicKey,
        toPubkey: wrappedSolAccount.publicKey,
        lamports,
      }),
      createSyncNativeInstruction(wrappedSolAccount.publicKey)
    );

    return { transaction, wrappedSolAccount };
  }
}