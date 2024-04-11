import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SolanaProviders from "@/components/SolanaProviders";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quick Token Generator",
  description: "Sample dApp for creating Tokens on Solana. by QuickNode",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <SolanaProviders>
        <body className={`${inter.className} antialiased`}>
          <Navbar />
          <div className="flex h-screen flex-col bg-gray-100">
            <div className="w-full flex-none mt-10">
              {children}
            </div>
          </div>
        </body>
      </SolanaProviders>
    </html>
  );
}
