"use client"

import { Heart, ExternalLink } from "lucide-react"

export default function Footer() {
  return (
    <footer className="sticky top-[100vh] bg-white border-t">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <span>Built with</span>
          <Heart className="w-4 h-4 text-red-500 fill-current" />
          <span>by</span>
          <a
            href="https://quicknode.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            QuickNode
            <ExternalLink className="w-3 h-3" />
          </a>
          <span className="text-xs text-gray-400 ml-4">
            Token Sweeper is a decentralized application. Always verify transactions before signing. Not financial advice.
          </span>
        </div>
      </div>
    </footer>
  )
}
