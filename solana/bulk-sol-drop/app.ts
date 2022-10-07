import {
  Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction, TransactionInstruction
} from "@solana/web3.js"
import { Drop, dropList } from "./dropList"
import secret from "./guideSecret.json"
import "dotenv/config"

const { QUICKNODE_RPC_ENDPOINT } = process.env

const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC_ENDPOINT as string)
const FROM_KEY_PAIR = Keypair.fromSecretKey(new Uint8Array(secret))
const NUM_DROPS_PER_TX = 10
const TX_INTERVAL = 1000

function generateTransactions(
  batchSize: number, dropList: Drop[], fromWallet: PublicKey
):Transaction[] {
  let result: Transaction[] = []
  let txInstructions: TransactionInstruction[] = dropList.map(drop => {
    return SystemProgram.transfer({
      fromPubkey: fromWallet,
      toPubkey: new PublicKey(drop.walletAddress),
      lamports: drop.numLamports
    })
  })
  const numTransactions = Math.ceil(txInstructions.length / batchSize)
  for (let i = 0; i < numTransactions; i++){
    let bulkTransaction = new Transaction()
    let lowerIndex = i * batchSize
    let upperIndex = (i+1) * batchSize
    for (let j = lowerIndex; j < upperIndex; j++){
      if (txInstructions[j]) bulkTransaction.add(txInstructions[j])
    }
    result.push(bulkTransaction)
  }
  return result
}

async function executeTransactions(
  solanaConnection: Connection, transactionList: Transaction[], payer: Keypair
): Promise<PromiseSettledResult<string>[]> {
  let result: PromiseSettledResult<string>[] = []
  let staggeredTransactions: Promise<string>[] = transactionList.map(
    (transaction, i, allTx) => {
      return (new Promise((resolve) => {
        setTimeout(
          () => {
            console.log(`Requesting Transaction ${i+1}/${allTx.length}`)          
            solanaConnection.getLatestBlockhash()
              .then(recentHash=>transaction.recentBlockhash = recentHash.blockhash)
              .then(()=>sendAndConfirmTransaction(solanaConnection,transaction,[payer])).then(resolve)
          },
          i * TX_INTERVAL
        )
      })
    )}
  )
  result = await Promise.allSettled(staggeredTransactions)
  return result
}

(async () => {
  console.log(`Initiating SOL drop from ${FROM_KEY_PAIR.publicKey.toString()}`)
  const transactionList = generateTransactions(
    NUM_DROPS_PER_TX,
    dropList,
    FROM_KEY_PAIR.publicKey
  )
  const txResults = await executeTransactions(
    SOLANA_CONNECTION,
    transactionList,
    FROM_KEY_PAIR
  )
  console.log(txResults)
})()