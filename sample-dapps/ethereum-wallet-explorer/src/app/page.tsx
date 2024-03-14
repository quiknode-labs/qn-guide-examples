import React from 'react'
import { Card, CardHeader, CardContent } from "../components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col w-full min-h-screen p-4 md:p-10 space-y-4">
      <Card>
        <CardHeader className="text-lg font-bold">
          Welcome to the Sample EVM Explorer
        </CardHeader>
        <CardContent>
          Use your QuickNode endpoint to explore a wallet's tokens, transactions, and NFTs!
        </CardContent>
        <CardContent>
          Enter your wallet address in the search bar above to get started.
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="text-lg font-bold">
          Local Development
        </CardHeader>
        <CardContent>
          Update `.env.local` with your QuickNode EVM Node Endpoint:
          <br />
          EVM_RPC_URL=https://example.ethereum-mainnet.quiknode.pro/123456/
          <br />
          DAS_API_ENABLED=true
        </CardContent>
        <CardContent>
          Set whether or not to fetch Jupiter's token list (to display token names/symbols) in `.env.local` (this is a large file):
          <br />
          NEXT_PUBLIC_FETCH_JUPLIST=true
        </CardContent>
        Create a QuickNode Endpoint <Link href="https://www.quicknode.com/signup?utm_source=internal&utm_campaign=dapp-examples&utm_content=EVM-Explorer" target="_blank">here</Link>.
        <CardContent>
          Learn more about the EVM Digtal Asset Standard Add-on <Link href="https://marketplace.quicknode.com/add-on/metaplex-digital-asset-standard-api?utm_source=internal&utm_campaign=dapp-examples&utm_content=EVM-Explorer" target="_blank">here</Link>.
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="text-lg font-bold">
          Deploy to Vercel
        </CardHeader>
        <CardContent>
          <Link href="" target="_blank"><img src="https://vercel.com/button" alt="Deploy with Vercel" /></Link>
        </CardContent>
      </Card>
    </div>
  );
}
