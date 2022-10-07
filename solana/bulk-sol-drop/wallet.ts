import { Keypair, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js"
import * as fs from "fs"
import "dotenv/config"

const { QUICKNODE_RPC_ENDPOINT } = process.env

const solanaConnection = new Connection(QUICKNODE_RPC_ENDPOINT as string)
const keypair = Keypair.generate()
console.log(`Generated new KeyPair.\nWallet PublicKey:`, keypair.publicKey.toString())

const secret_array = keypair.secretKey    
  .toString()
  .split(',')
  .map(value=>Number(value))

const secret = JSON.stringify(secret_array)

fs.writeFile(
  'guideSecret.json', secret, 'utf8', function(err) {
    if (err) throw err
    console.log(`\nWrote secret key to guideSecret.json.`)
  }
);

(async () => {
  const airdropSignature = solanaConnection.requestAirdrop(
    keypair.publicKey,
    LAMPORTS_PER_SOL,
  )
  try {
    const txId = await airdropSignature
    console.log(`\nAirdrop Transaction Id: ${txId}`)     
    console.log(`\nhttps://explorer.solana.com/tx/${txId}?cluster=devnet`)
  }
  catch(err) {
    console.log(err)
  }    
})()