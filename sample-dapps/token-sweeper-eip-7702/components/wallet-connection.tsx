"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet } from "lucide-react"
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function WalletConnection() {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Wallet className="w-5 h-5" />
          Connect Your Wallet
        </CardTitle>
        <CardDescription>Connect your wallet to start cleaning up your token dust</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <ConnectButton
          label="Connect Wallet"
          accountStatus="address"
        />
      </CardContent>
    </Card>
  )
}
