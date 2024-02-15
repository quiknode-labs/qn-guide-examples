import { Card, CardHeader, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col w-full min-h-screen p-4 md:p-10 space-y-4">
      <Card>
        <CardHeader className="text-lg font-bold">
          Welcome to the Sample Solana Explorer
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
          Update `.env.local` with your QuickNode Solana Node Endpoint:
          <br />
          SOLANA_RPC_URL=https://example.solana-mainnet.quiknode.pro/123456/
          <br />
          DAS_API_ENABLED=true
        </CardContent>
        <CardContent>
          Create a QuickNode Endpoint <Link href="https://www.quicknode.com/" target="_blank">here</Link>.
        </CardContent>
        <CardContent>
          Learn more about the Solana Digtal Asset Standard Add-on <Link href="https://marketplace.quicknode.com/add-on/metaplex-digital-asset-standard-api" target="_blank">here</Link>.
        </CardContent>
      </Card>
    </div>
  );
}
