import React from 'react'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Input } from "../components/ui/input";
import Header from "../components/header/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: '%s | QuickNode Ethereum Wallet Explorer',
    default: 'QuickNode Ethereum Wallet Explorer',
  },
  description: 'This is an example Ethereum Wallet Explorer.',
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
