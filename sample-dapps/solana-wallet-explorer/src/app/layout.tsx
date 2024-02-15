import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Input } from "@/components/ui/input";
import Header from "@/components/header/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: '%s | QuickNode Solana Wallet Explorer',
    default: 'QuickNode Solana Wallet Explorer',
  },
  description: 'This is an example Solana Wallet Explorer.',
  metadataBase: new URL('https://some-example-site.sh'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">

      <body className={`${inter.className} antialiased`}>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
