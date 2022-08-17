import { Connection, PublicKey } from "@solana/web3.js";
import { getDomainKey, NameRegistryState, getAllDomains, performReverseLookup } from "@bonfida/spl-name-service";

const QUICKNODE_RPC = 'https://example.solana-mainnet.quiknode.pro/000000/';//replace with your HTTP Provider from https://www.quicknode.com/endpoints
const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC);

async function getPublicKeyFromSolDomain(domain: string):Promise<string>{
    const { pubkey } = await getDomainKey(domain);
    const owner = (await NameRegistryState.retrieve(SOLANA_CONNECTION, pubkey)).registry.owner.toBase58();
    console.log(`The owner of SNS Domain: ${domain} is: `,owner);
    return owner;
}

async function getSolDomainsFromPublicKey(wallet: string):Promise<string[]>{
    const ownerWallet = new PublicKey(wallet);
    const allDomainKeys = await getAllDomains(SOLANA_CONNECTION, ownerWallet);
    const allDomainNames = await Promise.all(allDomainKeys.map(key=>{return performReverseLookup(SOLANA_CONNECTION,key)}));
    console.log(`${wallet} owns the following SNS domains:`)
    allDomainNames.forEach((domain,i) => console.log(` ${i+1}.`,domain));
    return allDomainNames;
}

//Examples for our search. You can replace these with your own wallet or Solana Naming Service queries. 
const DOMAIN_TO_SEARCH = 'bonfida';
const WALLET_TO_SEARCH = 'E645TckHQnDcavVv92Etc6xSWQaq8zzPtPRGBheviRAk';  

getPublicKeyFromSolDomain(DOMAIN_TO_SEARCH);
getSolDomainsFromPublicKey(WALLET_TO_SEARCH);