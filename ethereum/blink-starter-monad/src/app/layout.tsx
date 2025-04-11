import type { Metadata } from "next";
import localFont from "next/font/local";
import { Navbar } from "@/components/navbar";

// Providers are used to wrap the app in Wagmi and ConnectKit
import { Providers } from "@/provider";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Blink Starter Guides - Monad",
  description:
    "This website contains starter guides that teach you how to build Blinks on the Monad blockchain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Providers are used to wrap the app in Wagmi and ConnectKit */}
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
