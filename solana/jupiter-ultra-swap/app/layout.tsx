import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "./providers/WalletProvider";

export const metadata: Metadata = {
  title: "Jupiter Ultra Swap Demo",
  description: "Single-page Solana swap UI using Jupiter Ultra, QuickNode, Solana Wallet Adapter, and Solana Kit.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}

