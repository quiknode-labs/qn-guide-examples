import { Connection, GetProgramAccountsFilter } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import 'dotenv/config'

const { QUICKNODE_RPC_ENDPOINT, WALLET_PUBLIC_KEY } = process.env

const solanaConnection = new Connection(QUICKNODE_RPC_ENDPOINT as string)
const walletToQuery = WALLET_PUBLIC_KEY as string // example: vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg

async function getTokenAccounts(wallet: string, solanaConnection: Connection) {
  const filters:GetProgramAccountsFilter[] = [
    { dataSize: 165 },    // size of account (bytes)
    {
      memcmp: {
        offset: 32,       // location of our query in the account (bytes)
        bytes: wallet,    // our search criteria, a base58 encoded string
      },
    }
  ]

  const accounts = await solanaConnection.getParsedProgramAccounts(
    TOKEN_PROGRAM_ID,     // new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
    { filters: filters }
  )

  console.log(`Found ${accounts.length} token account(s) for wallet ${wallet}.`)

  accounts.forEach((account, i) => {
    const parsedAccountInfo:any = account.account.data
    const mintAddress:string = parsedAccountInfo["parsed"]["info"]["mint"]
    const tokenBalance: number = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"]

    console.log(`Token Account No. ${i + 1}: ${account.pubkey.toString()}`)
    console.log(`--Token Mint: ${mintAddress}`)
    console.log(`--Token Balance: ${tokenBalance}`)
  })
}

getTokenAccounts(walletToQuery, solanaConnection)