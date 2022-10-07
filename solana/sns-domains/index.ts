import { Connection, PublicKey } from "@solana/web3.js"
import { getDomainKey, NameRegistryState, getAllDomains, performReverseLookup } from "@bonfida/spl-name-service"
import "dotenv/config"

const { QUICKNODE_RPC_ENDPOINT } = process.env

const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC_ENDPOINT as string)

async function getPublicKeyFromSolDomain(domain: string): Promise<string>{
  const { pubkey } = await getDomainKey(domain)
  const owner = (await NameRegistryState.retrieve(
    SOLANA_CONNECTION, pubkey
  )).registry.owner.toBase58()
  console.log(`The owner of SNS Domain "${domain}" is:`, owner)
  return owner
}

async function getSolDomainsFromPublicKey(wallet: string): Promise<string[]>{
  const ownerWallet = new PublicKey(wallet)
  const allDomainKeys = await getAllDomains(SOLANA_CONNECTION, ownerWallet)
  const allDomainNames = await Promise.all(
    allDomainKeys.map(
      key=>{return performReverseLookup(SOLANA_CONNECTION, key)}
    )
  )
  console.log(`\n${wallet} owns the following SNS domains:`)
  allDomainNames.forEach((domain, i) => console.log(` ${i+1}.`, domain))
  return allDomainNames
}

// You can replace these search examples with your own wallet or other Solana Naming Service queries.
const DOMAIN_TO_SEARCH = 'bonfida'
const WALLET_TO_SEARCH = 'E645TckHQnDcavVv92Etc6xSWQaq8zzPtPRGBheviRAk'

getPublicKeyFromSolDomain(DOMAIN_TO_SEARCH)
getSolDomainsFromPublicKey(WALLET_TO_SEARCH)