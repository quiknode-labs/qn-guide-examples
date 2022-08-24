/**
 * This script will generate a new .json secret key to guideSecret.json and log your wallet addres and airdrop tx Id.
 * 
 * First Update endpoint with your QuickNode HTTP Url from quicknode.com/endpoints.
 * Run ts-node wallet.ts
 * This script will perform 4 tasks: 
 * 1. Connect to the Solana Network (Make sure you replace `endpoint` with your Quicknode Endpoint URL).
 * 2. Generate a new Wallet Keypair.
 * 3. Write the Secret Key to a .json file. Format the key as an array of numbers. Use `fs` to export the array to a `.json` file.
 * 4. Airdrop 1 SOL to the newly created wallet. (note: this will only work on dev and test nets)  
 */

import { Keypair, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";
import * as fs from 'fs';

//STEP 1 - Connect to Solana Network
const endpoint = 'https://example.solana-devnet.quiknode.pro/000000/'; //Replace with your RPC Endpoint
const solanaConnection = new Connection(endpoint);

//STEP 2 - Generate a New Solana Wallet
const keypair = Keypair.generate();
console.log(`Generated new KeyPair. Wallet PublicKey: `, keypair.publicKey.toString());

//STEP 3 - Write Wallet Secret Key to a .JSON
const secret_array = keypair.secretKey    
    .toString() //convert secret key to string
    .split(',') //delimit string by commas and convert to an array of strings
    .map(value=>Number(value)); //convert string values to numbers inside the array

const secret = JSON.stringify(secret_array); //Covert to JSON string

fs.writeFile('guideSecret.json', secret, 'utf8', function(err) {
    if (err) throw err;
    console.log('Wrote secret key to guideSecret.json.');
    });

//STEP 4 - Airdrop 1 SOL to new wallet
(async()=>{
    const airdropSignature = solanaConnection.requestAirdrop(
        keypair.publicKey,
        LAMPORTS_PER_SOL,
    );
    try{
        const txId = await airdropSignature;     
        console.log(`Airdrop Transaction Id: ${txId}`);        
        console.log(`https://explorer.solana.com/tx/${txId}?cluster=devnet`)
    }
    catch(err){
        console.log(err);
    }    
})()