import React from 'react'
import { Card, CardHeader, CardContent } from "../components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col w-full min-h-screen p-4 md:p-10 space-y-4">
      <Card>
        <CardHeader className="text-lg font-bold">
          Welcome to the Sample Ethereum Wallet Explorer
        </CardHeader>
        <CardContent>
          Use your QuickNode endpoint to explore a wallet's tokens, transactions, and NFTs!
        </CardContent>
        <CardContent>
          Enter your wallet address or ENS name in the search bar above to get started.
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="text-lg font-bold">
          Local Development
        </CardHeader>
        <CardContent>
          Create a QuickNode Endpoint <Link href="https://www.quicknode.com/signup?utm_source=internal&utm_campaign=dapp-examples&utm_content=Ethereum-Explorer" target="_blank" style={{ color: 'teal' }}>here</Link>.
          <br />
          <br />
          Update `.env.local` with your QuickNode Ethereum Node Endpoint:
          <br />
          <br />
          ETHEREUM_RPC_URL=https://example.ethereum-mainnet.quiknode.pro/123456/
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
