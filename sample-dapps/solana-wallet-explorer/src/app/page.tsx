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
          Set whether or not to fetch Jupiter's token list (to display token names/symbols) in `.env.local` (this is a large file):
          <br />
          NEXT_PUBLIC_FETCH_JUPLIST=true
        </CardContent>
        Create a QuickNode Endpoint <Link href="https://www.quicknode.com/signup?utm_source=internal&utm_campaign=dapp-examples&utm_content=Solana-Explorer" target="_blank">here</Link>.
        <CardContent>
          Learn more about the Solana Digtal Asset Standard Add-on <Link href="https://marketplace.quicknode.com/add-on/metaplex-digital-asset-standard-api?utm_source=internal&utm_campaign=dapp-examples&utm_content=Solana-Explorer" target="_blank">here</Link>.
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="text-lg font-bold">
          Deploy to Vercel
        </CardHeader>
        <CardContent>
          <Link href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fquiknode-labs%2Fqn-guide-examples%2Ftree%2Fmain%2Fsample-dapps%2Fsolana-wallet-explorer&env=SOLANA_RPC_URL,DAS_API_ENABLED,NEXT_PUBLIC_FETCH_JUPLIST&envDescription=SOLANA_RPC_URL%3A%20Use%20QuickNode%20Solana%20Mainnet%20Endpoint%20%7C%20DAS_API_ENABLED%20%3D%20true%20if%20DAS%20Add-on%20enabled%20in%20QN%20Dashboard%20%7C%20NEXT_PUBLIC_FETCH_JUPLIST%20%3D%20true%20to%20fetch%20token%20names&envLink=https%3A%2F%2Fdashboard.quicknode.com%2Fendpoints&project-name=starter-solana-explorer&repository-name=starter-solana-explorer&redirect-url=https%3A%2F%2Fdashboard.quicknode.com%2Fendpoints&demo-title=QuickNode%20Starter%20Solana%20Explorer&demo-image=https%3A%2F%2Fgithub.com%2Fquiknode-labs%2Fqn-guide-examples%2Ftree%2Fmain%2Fsample-dapps%2Fsolana-wallet-explorer%2Fpublic%2Fdemo.png" target="_blank"><img src="https://vercel.com/button" alt="Deploy with Vercel" /></Link>
        </CardContent>
      </Card>
    </div>
  );
}
