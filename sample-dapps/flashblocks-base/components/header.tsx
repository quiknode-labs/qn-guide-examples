"use client"

import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Zap, ExternalLink } from "lucide-react"
import { QUICKNODE_LINKS } from "@/lib/constants"
import { ConnectButton } from "@rainbow-me/rainbowkit"

export const Header: React.FC = () => {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold">Flashblocks Demo</h1>
            </div>
            <Badge variant="secondary">Faster Confirmations</Badge>
          </div>

          <div className="flex items-center gap-3">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  )
}
