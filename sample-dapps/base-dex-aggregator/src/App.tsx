import { WagmiProvider } from "wagmi";
import { ConnectKitProvider } from "connectkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "./lib/wagmi";
import SwapCard from "./components/SwapCard";
import Banner from "./components/Banner";
import { Toaster } from "react-hot-toast";
import { TokenProvider } from "./context/TokenContext";

const queryClient = new QueryClient();

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme="midnight">
          <TokenProvider>
            <Toaster position="top-center" />
            <div className="min-h-screen bg-gray-50 flex flex-col items-center">
              <Banner />
              <div className="container max-w-7xl mx-auto px-4 py-8 flex flex-col items-center">
                <SwapCard />
              </div>
            </div>
          </TokenProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
