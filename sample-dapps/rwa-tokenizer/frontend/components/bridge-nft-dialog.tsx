'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther, pad } from 'viem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Flame, ArrowRight, Sparkles, ExternalLink } from 'lucide-react'
import { invalidateTokenCache } from '@/lib/cache'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getContractAddress, contractAddresses } from '@/config/addresses'
import { RWA721_ABI } from '@/lib/abi/rwa721'

interface BridgeNFTDialogProps {
  tokenId: bigint
  tokenName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function BridgeNFTDialog({ tokenId, tokenName, open: controlledOpen, onOpenChange }: BridgeNFTDialogProps) {
  const { address, chainId } = useAccount()
  const [internalOpen, setInternalOpen] = useState(false)

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const [recipientAddress, setRecipientAddress] = useState('')
  const [destinationChain, setDestinationChain] = useState<'84532' | '11155111'>()
  const [estimatedFee, setEstimatedFee] = useState<bigint | null>(null)
  const [step, setStep] = useState<'approval' | 'bridge'>('approval')
  const [error, setError] = useState<string | null>(null)
  const [bridgeAnimationStage, setBridgeAnimationStage] = useState<'burning' | 'transferring' | 'minting' | null>(null)

  // Check if the current chain is supported
  const isSupportedChain = chainId === 84532 || chainId === 11155111
  const contractAddress = chainId && isSupportedChain ? getContractAddress(chainId, 'rwa721') : undefined

  // Check if NFT is already approved
  const { data: approvedAddress, refetch: refetchApproval } = useReadContract({
    address: contractAddress,
    abi: RWA721_ABI,
    functionName: 'getApproved',
    args: [tokenId],
    query: {
      enabled: !!contractAddress && open,
    },
  })

  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending
  } = useWriteContract()

  const {
    writeContract: writeBridge,
    data: bridgeHash,
    isPending: isBridgePending
  } = useWriteContract()

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash })

  const { isLoading: isBridgeConfirming, isSuccess: isBridgeSuccess } =
    useWaitForTransactionReceipt({ hash: bridgeHash })

  // Set default destination chain to the opposite of current chain
  useEffect(() => {
    if (chainId && !destinationChain) {
      setDestinationChain(chainId === 84532 ? '11155111' : '84532')
    }
  }, [chainId, destinationChain])

  // Set default recipient to user's address
  useEffect(() => {
    if (address && !recipientAddress) {
      setRecipientAddress(address)
    }
  }, [address, recipientAddress])

  // Check if already approved and skip approval step
  useEffect(() => {
    if (approvedAddress && contractAddress && approvedAddress.toLowerCase() === contractAddress.toLowerCase()) {
      console.log('[Bridge] NFT already approved, skipping approval step')
      setStep('bridge')
    }
  }, [approvedAddress, contractAddress])

  // Move to bridge step after approval succeeds and refetch approval
  useEffect(() => {
    if (isApproveSuccess) {
      refetchApproval()
      setStep('bridge')
    }
  }, [isApproveSuccess, refetchApproval])

  // Bridge animation sequence
  useEffect(() => {
    if (isBridgePending || isBridgeConfirming) {
      // Stage 1: Burning
      setBridgeAnimationStage('burning')

      // Stage 2: Transferring (after 2 seconds)
      const transferTimer = setTimeout(() => {
        setBridgeAnimationStage('transferring')
      }, 2000)

      // Stage 3: Minting (after 4 seconds total)
      const mintTimer = setTimeout(() => {
        setBridgeAnimationStage('minting')
      }, 4000)

      return () => {
        clearTimeout(transferTimer)
        clearTimeout(mintTimer)
      }
    } else if (isBridgeSuccess) {
      // Keep minting stage visible briefly after success
      setBridgeAnimationStage('minting')
    } else {
      setBridgeAnimationStage(null)
    }
  }, [isBridgePending, isBridgeConfirming, isBridgeSuccess])

  // Close dialog after successful bridge
  useEffect(() => {
    if (isBridgeSuccess && chainId && address) {
      // Invalidate cache for this token on current chain IMMEDIATELY
      console.log('[Bridge] Invalidating cache for bridged token:', tokenId.toString())
      invalidateTokenCache(chainId, address, tokenId.toString())

      // Also clear cache for destination chain to be safe
      if (destinationChain) {
        const destChainId = Number(destinationChain)
        console.log('[Bridge] Pre-clearing destination chain cache:', destChainId)
        invalidateTokenCache(destChainId, address, tokenId.toString())
      }

      const timeoutId = setTimeout(() => {
        setOpen(false)
        // Reset form
        setStep('approval')
        setEstimatedFee(null)
        setError(null)
        setBridgeAnimationStage(null)
        // Reload page to show updated NFT ownership
        window.location.reload()
      }, 3000)

      // Cleanup: ensure cache stays cleared even if component unmounts
      return () => {
        clearTimeout(timeoutId)
        if (chainId && address) {
          console.log('[Bridge] Cleanup: Re-clearing cache on unmount')
          invalidateTokenCache(chainId, address, tokenId.toString())
        }
      }
    }
  }, [isBridgeSuccess, chainId, address, tokenId, destinationChain])

  // Calculate fee estimation parameters for LayerZero V2
  const dstLzChainId = destinationChain
    ? contractAddresses[Number(destinationChain) as keyof typeof contractAddresses].lzChainId
    : undefined

  // Convert address to bytes32 (LayerZero V2 format)
  const toAddressBytes32 = recipientAddress
    ? pad(recipientAddress as `0x${string}`, { size: 32 })
    : undefined

  // Build SendParam struct for LayerZero V2
  // Note: extraOptions are empty because enforced options are set on the contract
  // The contract automatically applies the correct LayerZero options (200k gas)
  const sendParam = dstLzChainId && toAddressBytes32 ? {
    dstEid: dstLzChainId,
    to: toAddressBytes32,
    tokenId: tokenId,
    extraOptions: '0x' as `0x${string}`, // Empty - enforced options on contract
    composeMsg: '0x' as `0x${string}`,
    onftCmd: '0x' as `0x${string}`,
  } : undefined

  // Estimate bridge fee using quoteSend (LayerZero V2)
  const { data: feeQuote } = useReadContract({
    address: contractAddress,
    abi: RWA721_ABI,
    functionName: 'quoteSend',
    args: sendParam ? [sendParam, false] : undefined,
    query: {
      enabled: !!sendParam && !!contractAddress && open,
    },
  })

  // Set estimated fee with 20% buffer
  useEffect(() => {
    if (feeQuote && typeof feeQuote === 'object' && 'nativeFee' in feeQuote) {
      const fee = feeQuote.nativeFee as bigint
      const feeWithBuffer = (fee * BigInt(120)) / BigInt(100)
      setEstimatedFee(feeWithBuffer)
      console.log('[Bridge] Estimated fee:', feeWithBuffer.toString())
    } else if (destinationChain && recipientAddress && open) {
      // Fallback fee if estimation fails
      console.log('[Bridge] Using fallback fee')
      setEstimatedFee(parseEther('0.001'))
    }
  }, [feeQuote, destinationChain, recipientAddress, open])

  const handleApprove = () => {
    if (!contractAddress) return

    writeApprove({
      address: contractAddress,
      abi: RWA721_ABI,
      functionName: 'approve',
      args: [contractAddress, tokenId],
    })
  }

  const handleBridge = () => {
    if (!contractAddress || !sendParam || !estimatedFee || !address) {
      setError('Missing required parameters')
      return
    }

    console.log('[Bridge] Sending LayerZero V2 bridge transaction:', {
      from: address,
      sendParam,
      estimatedFee: estimatedFee.toString(),
    })

    // LayerZero V2 send() call
    writeBridge({
      address: contractAddress,
      abi: RWA721_ABI,
      functionName: 'send',
      args: [
        sendParam,
        { nativeFee: estimatedFee, lzTokenFee: BigInt(0) }, // MessagingFee struct
        address, // refundAddress
      ],
      value: estimatedFee,
    })
  }

  const destinationChainName = destinationChain === '84532' ? 'Base Sepolia' : 'Ethereum Sepolia'
  const currentChainName = chainId === 84532 ? 'Base Sepolia' : 'Ethereum Sepolia'

  // Determine if current chain is testnet
  const isTestnet = chainId === 84532 || chainId === 11155111
  const layerZeroScanUrl = isTestnet
    ? 'https://testnet.layerzeroscan.com'
    : 'https://layerzeroscan.com'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Bridge to Another Chain</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bridge NFT (LayerZero V2)</DialogTitle>
          <DialogDescription>
            Send {tokenName || `Token #${tokenId.toString()}`} to another chain using LayerZero V2
          </DialogDescription>
        </DialogHeader>

        {step === 'approval' && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-600">
              <p className="font-medium mb-1">Step 1 of 2: Approve NFT</p>
              <p className="text-xs">First, you need to approve the contract to transfer your NFT.</p>
            </div>

            <div className="space-y-2">
              <Label>Current Chain</Label>
              <Input value={currentChainName} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destination Chain</Label>
              <Select
                value={destinationChain}
                onValueChange={(value) => setDestinationChain(value as '84532' | '11155111')}
              >
                <SelectTrigger id="destination">
                  <SelectValue placeholder="Select destination chain" />
                </SelectTrigger>
                <SelectContent>
                  {chainId === 84532 && (
                    <SelectItem value="11155111">Ethereum Sepolia</SelectItem>
                  )}
                  {chainId === 11155111 && (
                    <SelectItem value="84532">Base Sepolia</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x..."
              />
              <p className="text-xs text-muted-foreground">
                Leave as your address to send to yourself on the destination chain
              </p>
            </div>

            {estimatedFee && (
              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-sm font-medium">Estimated Bridge Fee</p>
                <p className="text-2xl font-bold">
                  {(Number(estimatedFee) / 1e18).toFixed(6)} ETH
                </p>
                <p className="text-xs text-muted-foreground">
                  Includes 20% buffer for gas price fluctuations. You&apos;ll pay this in the next step.
                </p>
              </div>
            )}

            {!estimatedFee && destinationChain && recipientAddress && (
              <p className="text-sm text-muted-foreground">Estimating bridge fee...</p>
            )}

            {error && (
              <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
                {error}
              </div>
            )}

            {isApproveSuccess && (
              <div className="text-sm text-green-500 bg-green-500/10 p-3 rounded-lg">
                ✓ Approval successful! Proceed to bridge.
              </div>
            )}
          </div>
        )}

        {step === 'bridge' && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-600">
              <p className="font-medium mb-1">Step 2 of 2: Bridge NFT</p>
              <p className="text-xs">Confirm the bridge transaction to send your NFT to {destinationChainName}.</p>
            </div>

            {/* Bridge Animation */}
            {bridgeAnimationStage && (
              <div className="rounded-lg border p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                <div className="flex items-center justify-between">
                  {/* Stage 1: Burning */}
                  <div className="flex flex-col items-center flex-1">
                    <div className={`rounded-full p-3 mb-2 transition-all duration-500 ${
                      bridgeAnimationStage === 'burning'
                        ? 'bg-orange-500 scale-110 animate-pulse'
                        : bridgeAnimationStage === 'transferring' || bridgeAnimationStage === 'minting'
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}>
                      <Flame className={`h-6 w-6 text-white ${bridgeAnimationStage === 'burning' ? 'animate-bounce' : ''}`} />
                    </div>
                    <p className={`text-xs font-medium ${bridgeAnimationStage === 'burning' ? 'text-orange-600' : 'text-gray-600'}`}>
                      Burning on {currentChainName}
                    </p>
                  </div>

                  {/* Arrow 1 */}
                  <div className="flex items-center">
                    <ArrowRight className={`h-8 w-8 mx-2 transition-all duration-500 ${
                      bridgeAnimationStage === 'transferring' || bridgeAnimationStage === 'minting'
                        ? 'text-blue-600 animate-pulse'
                        : 'text-gray-400'
                    }`} />
                  </div>

                  {/* Stage 2: Transferring */}
                  <div className="flex flex-col items-center flex-1">
                    <div className={`rounded-full p-3 mb-2 transition-all duration-500 ${
                      bridgeAnimationStage === 'transferring'
                        ? 'bg-blue-500 scale-110 animate-pulse'
                        : bridgeAnimationStage === 'minting'
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}>
                      <ArrowRight className={`h-6 w-6 text-white ${bridgeAnimationStage === 'transferring' ? 'animate-bounce' : ''}`} />
                    </div>
                    <p className={`text-xs font-medium ${bridgeAnimationStage === 'transferring' ? 'text-blue-600' : 'text-gray-600'}`}>
                      Crossing Chains
                    </p>
                  </div>

                  {/* Arrow 2 */}
                  <div className="flex items-center">
                    <ArrowRight className={`h-8 w-8 mx-2 transition-all duration-500 ${
                      bridgeAnimationStage === 'minting'
                        ? 'text-purple-600 animate-pulse'
                        : 'text-gray-400'
                    }`} />
                  </div>

                  {/* Stage 3: Minting */}
                  <div className="flex flex-col items-center flex-1">
                    <div className={`rounded-full p-3 mb-2 transition-all duration-500 ${
                      bridgeAnimationStage === 'minting'
                        ? 'bg-purple-500 scale-110 animate-pulse'
                        : 'bg-gray-300'
                    }`}>
                      <Sparkles className={`h-6 w-6 text-white ${bridgeAnimationStage === 'minting' ? 'animate-bounce' : ''}`} />
                    </div>
                    <p className={`text-xs font-medium ${bridgeAnimationStage === 'minting' ? 'text-purple-600' : 'text-gray-600'}`}>
                      Minting on {destinationChainName}
                    </p>
                  </div>
                </div>

                {/* Status text */}
                <div className="mt-4 text-center">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {bridgeAnimationStage === 'burning' && 'Burning your NFT on the source chain...'}
                    {bridgeAnimationStage === 'transferring' && 'Transferring via LayerZero V2...'}
                    {bridgeAnimationStage === 'minting' && 'Minting your NFT on the destination chain...'}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-medium">Bridge Summary</h4>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">From:</span> {currentChainName}</p>
                <p><span className="text-muted-foreground">To:</span> {destinationChainName}</p>
                <p><span className="text-muted-foreground">Recipient:</span> {recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)}</p>
                <p><span className="text-muted-foreground">Fee:</span> {estimatedFee ? (Number(estimatedFee) / 1e18).toFixed(6) : '...'} ETH</p>
              </div>
            </div>

            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-600">
              ⚠️ Your NFT will be burned on {currentChainName} and minted on {destinationChainName}. This may take a few minutes.
            </div>

            {bridgeHash && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
                <p className="text-sm font-medium text-blue-600 mb-2">Track Your Cross-Chain Transfer</p>
                <a
                  href={`${layerZeroScanUrl}/tx/${bridgeHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  View on LayerZero Scan
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {isBridgeSuccess && (
              <div className="text-sm text-green-500 bg-green-500/10 p-3 rounded-lg">
                ✓ Bridge transaction successful! Your NFT will arrive on {destinationChainName} shortly. Page will reload...
              </div>
            )}

            {error && (
              <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
                {error}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'approval' && (
            <Button
              onClick={handleApprove}
              disabled={isApprovePending || isApproveConfirming || !destinationChain || !recipientAddress || !estimatedFee}
            >
              {isApprovePending || isApproveConfirming ? 'Approving...' : 'Approve NFT'}
            </Button>
          )}
          {step === 'bridge' && !isBridgeSuccess && (
            <Button
              onClick={handleBridge}
              disabled={isBridgePending || isBridgeConfirming}
            >
              {isBridgePending || isBridgeConfirming ? 'Bridging...' : 'Bridge NFT'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
