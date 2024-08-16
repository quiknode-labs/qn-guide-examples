import { RaydiumSwap } from './raydium-swap';
import { CONFIG } from './config';
import { 
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';

async function getTokenBalance(raydiumSwap: RaydiumSwap, mint: string): Promise<number> {
  const userTokenAccounts = await raydiumSwap.getOwnerTokenAccounts();
  const tokenAccount = userTokenAccounts.find(account => 
    account.accountInfo.mint.equals(new PublicKey(mint))
  );
  if (tokenAccount) {
    const balance = await raydiumSwap.connection.getTokenAccountBalance(tokenAccount.pubkey);
    return balance.value.uiAmount || 0;
  }
  return 0;
}

async function swap() {
  console.log('Starting swap process...');
  const raydiumSwap = new RaydiumSwap(CONFIG.RPC_URL, CONFIG.WALLET_SECRET_KEY);

  await raydiumSwap.loadPoolKeys();
  let poolInfo = raydiumSwap.findPoolInfoForTokens(CONFIG.BASE_MINT, CONFIG.QUOTE_MINT) 
    || await raydiumSwap.findRaydiumPoolInfo(CONFIG.BASE_MINT, CONFIG.QUOTE_MINT);

  if (!poolInfo) {
    throw new Error("Couldn't find the pool info");
  }

  await raydiumSwap.createWrappedSolAccountInstruction(CONFIG.TOKEN_A_AMOUNT);

  console.log('Fetching current priority fee...');
  const priorityFee = await CONFIG.getPriorityFee();
  console.log(`Current priority fee: ${priorityFee} SOL`);

  console.log('Creating swap transaction...');
  const swapTx = await raydiumSwap.getSwapTransaction(
    CONFIG.QUOTE_MINT,
    CONFIG.TOKEN_A_AMOUNT,
    poolInfo,
    CONFIG.USE_VERSIONED_TRANSACTION,
    CONFIG.SLIPPAGE
  );

  console.log(`Using priority fee: ${priorityFee} SOL`);
  console.log(`Transaction signed with payer: ${raydiumSwap.wallet.publicKey.toBase58()}`);

  console.log(`Swapping ${CONFIG.TOKEN_A_AMOUNT} SOL for BONK`);

  if (CONFIG.EXECUTE_SWAP) {
    try {
      let txid: string;
      if (CONFIG.USE_VERSIONED_TRANSACTION) {
        if (!(swapTx instanceof VersionedTransaction)) {
          throw new Error('Expected a VersionedTransaction but received a different type');
        }
        const latestBlockhash = await raydiumSwap.connection.getLatestBlockhash();
        txid = await raydiumSwap.sendVersionedTransaction(
          swapTx,
          latestBlockhash.blockhash,
          latestBlockhash.lastValidBlockHeight
        );
      } else {
        if (!(swapTx instanceof Transaction)) {
          throw new Error('Expected a Transaction but received a different type');
        }
        txid = await raydiumSwap.sendLegacyTransaction(swapTx);
      }
      console.log(`Transaction sent, signature: ${txid}`);
      console.log(`Transaction executed: https://explorer.solana.com/tx/${txid}`);
      
      console.log('Transaction confirmed successfully');

      // Fetch and display token balances
      const solBalance = await raydiumSwap.connection.getBalance(raydiumSwap.wallet.publicKey) / LAMPORTS_PER_SOL;
      const bonkBalance = await getTokenBalance(raydiumSwap, CONFIG.QUOTE_MINT);

      console.log('\nToken Balances After Swap:');
      console.log(`SOL: ${solBalance.toFixed(6)} SOL`);
      console.log(`BONK: ${bonkBalance.toFixed(2)} BONK`);
    } catch (error) {
      console.error('Error executing transaction:', error);
    }
  } else {
    console.log('Simulating transaction (dry run)');
    try {
      let simulationResult;
      if (CONFIG.USE_VERSIONED_TRANSACTION) {
        if (!(swapTx instanceof VersionedTransaction)) {
          throw new Error('Expected a VersionedTransaction but received a different type');
        }
        simulationResult = await raydiumSwap.simulateVersionedTransaction(swapTx);
      } else {
        if (!(swapTx instanceof Transaction)) {
          throw new Error('Expected a Transaction but received a different type');
        }
        simulationResult = await raydiumSwap.simulateLegacyTransaction(swapTx);
      }
      console.log('Simulation successful');
      console.log('Simulated transaction details:');
      console.log(`Logs:`, simulationResult.logs);
      console.log(`Units consumed:`, simulationResult.unitsConsumed);
      if (simulationResult.returnData) {
        console.log(`Return data:`, simulationResult.returnData);
      }
    } catch (error) {
      console.error('Error simulating transaction:', error);
    }
  }
}

swap().catch((error) => {
  console.error('An error occurred during the swap process:');
  console.error(error);
});