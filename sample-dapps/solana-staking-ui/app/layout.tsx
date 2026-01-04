import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SelectedWalletAccountContextProvider } from "@/context/SelectedWalletAccountContextProvider";
import { Flex, Section, Theme } from "@radix-ui/themes";
import { Nav } from "@/components/Nav";
import "@radix-ui/themes/styles.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Stake with Quicknode",
  description: "Stake Smarter. Earn Faster. With Quicknode.",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "icon", url: "/favicon.png", type: "image/png" }
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Theme
          appearance="dark"
          accentColor="gray"
          grayColor="sand"
          panelBackground="solid"
          scaling="100%"
          radius="medium"
        >
          <SelectedWalletAccountContextProvider>
            <Flex direction="column">
              <Nav />
              <Section style={{ flex: 1 }}>{children}</Section>
            </Flex>
          </SelectedWalletAccountContextProvider>
        </Theme>
      </body>
    </html>
  );
}
