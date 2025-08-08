"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Share2, Sparkles, TrendingUp } from "lucide-react"
import { getTokenSymbolFromAddress } from "@/lib/token-config"
import html2canvas from "html2canvas"
import { getExplorerUrl } from "@/lib/utils"

interface SocialCardProps {
  result: {
    tokensSwapped: number
    totalValue: number
    outcomeToken: string
    chain: string
    txHash: string
    chainId?: number
    isAtomic?: boolean
  }
}



export default function SocialCard({ result }: SocialCardProps) {
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  
  const outcomeTokenSymbol = getTokenSymbolFromAddress(result.outcomeToken, result.chainId || 8453)
  const explorerUrl = getExplorerUrl(result.txHash, result.chainId)

  const generateCardImage = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: cardRef.current.offsetWidth,
        height: cardRef.current.offsetHeight,
      })
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob)
        }, 'image/png', 1.0)
      })
    } catch (error) {
      console.error('Error generating image:', error)
      return null
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    
    try {
      const imageBlob = await generateCardImage()
      if (imageBlob) {
        const url = URL.createObjectURL(imageBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `token-sweeper-${result.tokensSwapped}-tokens-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error downloading image:', error)
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    const atomicText = result.isAtomic 
      ? `in a single transaction` 
      : `using multiple transactions`
    
    const tweetText = `Just cleaned up ${result.tokensSwapped} dust tokens from my wallet ${atomicText} with @TokenSweeperApp! ✨ #DeFi #${result.chain}${result.isAtomic ? ' #EIP7702' : ''}`
    
    try {
      const imageBlob = await generateCardImage()
      if (imageBlob && navigator.share) {
        // Use Web Share API if available (mobile)
        const file = new File([imageBlob], 'token-sweeper-achievement.png', { type: 'image/png' })
        await navigator.share({
          text: tweetText,
          files: [file]
        })
        return
      }
    } catch (error) {
      console.error('Error sharing via Web Share API:', error)
    }

    // Fallback to Twitter intent
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`
    window.open(tweetUrl, "_blank")
  }

  return (
    <div className="space-y-6">
      <Card ref={cardRef} className="bg-gradient-to-br from-blue-600 to-purple-700 text-white overflow-hidden">
        <CardContent className="p-8 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-6 h-6" />
              <span className="font-bold text-lg">Token Sweeper</span>
            </div>

            <h2 className="text-3xl font-bold mb-6">Wallet Dust Cleared!</h2>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{result.tokensSwapped}</div>
                <div className="text-blue-100">Tokens Swapped</div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold mb-1">${result.totalValue.toFixed(2)}</div>
                <div className="text-blue-100">Total Value</div>
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5" />
                <span>
                  for{" "}
                  <strong>
                    ${result.totalValue.toFixed(2)} worth of {outcomeTokenSymbol}
                  </strong>
                </span>
              </div>
              {result.isAtomic && (
                <div className="text-blue-100 text-sm mt-1">
                <a 
                  href={explorerUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors underline"
                >
                  In one transaction
                </a>
                {" "}on {result.chain}
              </div>
              )}
            </div>

            <div className="text-center text-sm text-blue-100">Powered by TokenSweeper</div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center">
        <Button
          variant="outline"
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 max-w-xs bg-transparent"
        >
          {downloading ? (
            <>
              <div className="w-4 h-4 mr-2 animate-spin border-2 border-current border-t-transparent rounded-full"></div>
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download PNG
            </>
          )}
        </Button>

        <Button onClick={handleShare} className="flex-1 max-w-xs">
          <Share2 className="w-4 h-4 mr-2" />
          Share on X
        </Button>
      </div>
    </div>
  )
}
