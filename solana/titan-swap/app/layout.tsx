import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "./providers/WalletProvider";

export const metadata: Metadata = {
  title: "Titan Swap — Meta-Aggregation on Solana",
  description:
    "A single-page Solana swap UI built on the Titan Gateway meta-aggregation API, served through Quicknode. Watch competing providers race for the best route, then build and submit the winning transaction yourself.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="inverted">
      <body suppressHydrationWarning>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
