'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAccount, useReadContract, usePublicClient } from 'wagmi'
import { Navigation } from '@/components/navigation'
import { OutrunBackground } from '@/components/outrun-background'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NFTCardSkeleton } from '@/components/nft-card-skeleton'
import { NFTCardLoading } from '@/components/nft-card-loading'
import { NFTDetailModal } from '@/components/nft-detail-modal'
import { BridgeButton } from '@/components/bridge-button'
import { BridgeNFTDialog } from '@/components/bridge-nft-dialog'
import { getContractAddress } from '@/config/addresses'
import { RWA721_ABI } from '@/lib/abi/rwa721'
import { getIPFSGatewayUrl, fetchFromIPFS, NFTMetadata } from '@/lib/ipfs'
import { TokenCache, initializeCache } from '@/lib/cache'
import { staggerContainer, staggerItem, fadeInUp, hoverLift } from '@/lib/animations'
import { formatTokenId, extractChainShortName, getLocalTokenId } from '@/lib/tokenId'

interface TokenData {
  tokenId: bigint
  metadata?: NFTMetadata
  tokenURI?: string
  isLoading: boolean
}

export default function AssetsPage() {
  const { address, chainId, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [isLoadingTokens, setIsLoadingTokens] = useState(false)
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null)
  const [bridgeDialogOpen, setBridgeDialogOpen] = useState(false)
  const [bridgeTokenId, setBridgeTokenId] = useState<bigint | null>(null)
  const [bridgeTokenName, setBridgeTokenName] = useState<string | undefined>(undefined)

  // Use ref to persist loaded token IDs across effect runs to prevent duplicates
  const loadedTokenIdsRef = useRef<Set<string>>(new Set())

  const contractAddress = chainId ? getContractAddress(chainId, 'rwa721') : undefined

  // Initialize cache on mount
  useEffect(() => {
    initializeCache()
  }, [])

  const { data: balance } = useReadContract({
    address: contractAddress,
    abi: RWA721_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
    },
  })

  useEffect(() => {
    if (!address || !contractAddress || !publicClient || !chainId) {
      console.log('[Assets] Missing required data:', { address, contractAddress, chainId })
      setTokens([]) // Clear tokens when disconnected or chain not ready
      return
    }

    const loadTokens = async () => {
      console.log('[Assets] Starting to load tokens for address:', address)
      console.log('[Assets] Chain ID:', chainId)
      // Clear existing tokens immediately when loading starts (prevents showing wrong chain's tokens)
      setTokens([])
      setIsLoadingTokens(true)

      // Clear the ref to start fresh for this chain/address combination
      loadedTokenIdsRef.current.clear()

      // Check cache first - but still show loading animation briefly
      const cachedTokens = TokenCache.get(chainId, address)
      if (cachedTokens && cachedTokens.length > 0) {
        console.log('[Assets] Loading tokens from cache:', cachedTokens.length)

        // First show skeleton card for 800ms
        await new Promise(resolve => setTimeout(resolve, 800))

        // Then show actual cards directly (skip individual loading for cached tokens)
        const tokenData: TokenData[] = cachedTokens.map(ct => {
          loadedTokenIdsRef.current.add(ct.tokenId)
          return {
            tokenId: BigInt(ct.tokenId),
            metadata: ct.metadata,
            tokenURI: ct.tokenURI,
            isLoading: false, // Show actual cards immediately for cached tokens
          }
        })
        setTokens(tokenData)
        setIsLoadingTokens(false)

        // Still fetch in background to check for updates
        console.log('[Assets] Cache loaded, checking for updates in background...')
      } else {
        setTokens([]) // Clear existing tokens to prevent flash
      }

      try {
        const currentBlock = await publicClient.getBlockNumber()
        console.log('[Assets] Current block:', currentBlock)

        // Use 5000 blocks to stay well under RPC limits (many providers limit to 10k)
        const blockRange = BigInt(5000)
        const fromBlock = currentBlock > blockRange ? currentBlock - blockRange : BigInt(0)
        console.log('[Assets] Searching from block:', fromBlock, 'to', currentBlock)

        console.log('[Assets] Fetching Minted events...')
        let mintedEvents: Awaited<ReturnType<typeof publicClient.getLogs>> = []
        let transferToEvents: Awaited<ReturnType<typeof publicClient.getLogs>> = []
        let transferFromEvents: Awaited<ReturnType<typeof publicClient.getLogs>> = []

        try {
          mintedEvents = await publicClient.getLogs({
            address: contractAddress,
            event: {
              type: 'event',
              name: 'Minted',
              inputs: [
                { name: 'to', type: 'address', indexed: true },
                { name: 'tokenId', type: 'uint256', indexed: true },
                { name: 'uri', type: 'string', indexed: false },
              ],
            },
            args: {
              to: address,
            },
            fromBlock,
            toBlock: 'latest',
          })
          console.log('[Assets] Minted events found:', mintedEvents.length, mintedEvents)
        } catch (error) {
          console.warn('[Assets] Error fetching Minted events, continuing...', error)
        }

        console.log('[Assets] Fetching Transfer (to) events...')
        try {
          transferToEvents = await publicClient.getLogs({
            address: contractAddress,
            event: {
              type: 'event',
              name: 'Transfer',
              inputs: [
                { name: 'from', type: 'address', indexed: true },
                { name: 'to', type: 'address', indexed: true },
                { name: 'tokenId', type: 'uint256', indexed: true },
              ],
            },
            args: {
              to: address,
            },
            fromBlock,
            toBlock: 'latest',
          })
          console.log('[Assets] Transfer (to) events found:', transferToEvents.length)
        } catch (error) {
          console.warn('[Assets] Error fetching Transfer (to) events, continuing...', error)
        }

        console.log('[Assets] Fetching Transfer (from) events...')
        try {
          transferFromEvents = await publicClient.getLogs({
            address: contractAddress,
            event: {
              type: 'event',
              name: 'Transfer',
              inputs: [
                { name: 'from', type: 'address', indexed: true },
                { name: 'to', type: 'address', indexed: true },
                { name: 'tokenId', type: 'uint256', indexed: true },
              ],
            },
            args: {
              from: address,
            },
            fromBlock,
            toBlock: 'latest',
          })
          console.log('[Assets] Transfer (from) events found:', transferFromEvents.length)
        } catch (error) {
          console.warn('[Assets] Error fetching Transfer (from) events, continuing...', error)
        }

        // Instead of trying to track ownership through events, collect ALL token IDs
        // that ever interacted with this address, then verify ownership with ownerOf
        const allTokenIds = new Set<string>()

        mintedEvents.forEach(event => {
          const tokenId = (event as { args?: { tokenId?: bigint } }).args?.tokenId
          if (tokenId) {
            allTokenIds.add(tokenId.toString())
            console.log('[Assets] Added token from mint:', tokenId.toString())
          }
        })

        transferToEvents.forEach(event => {
          const tokenId = (event as { args?: { tokenId?: bigint } }).args?.tokenId
          if (tokenId) {
            allTokenIds.add(tokenId.toString())
            console.log('[Assets] Added token from transfer (to):', tokenId.toString())
          }
        })

        // Also include tokens transferred FROM user (they might have been bridged back)
        transferFromEvents.forEach(event => {
          const tokenId = (event as { args?: { tokenId?: bigint } }).args?.tokenId
          if (tokenId) {
            allTokenIds.add(tokenId.toString())
            console.log('[Assets] Added token from transfer (from) for verification:', tokenId.toString())
          }
        })

        console.log('[Assets] Total unique token IDs to verify:', allTokenIds.size, Array.from(allTokenIds))

        // Verify ownership and load tokens one by one, only adding verified ones to state
        for (const tokenIdStr of Array.from(allTokenIds)) {
          // Skip if already loaded from cache or by another concurrent effect run
          if (loadedTokenIdsRef.current.has(tokenIdStr)) {
            console.log(`[Assets] Token ${tokenIdStr} already loaded, skipping`)
            continue
          }

          const tokenId = BigInt(tokenIdStr)
          try {
            console.log(`[Assets] Verifying token ${tokenId}...`)

            const currentOwner = await publicClient.readContract({
              address: contractAddress,
              abi: RWA721_ABI,
              functionName: 'ownerOf',
              args: [tokenId],
            })
            console.log(`[Assets] Token ${tokenId} owner:`, currentOwner)

            if (currentOwner.toLowerCase() !== address.toLowerCase()) {
              console.log(`[Assets] Token ${tokenId} not owned by user, skipping`)
              continue
            }

            // Token is owned by user, add it to state in loading state
            console.log(`[Assets] Token ${tokenId} verified, adding to state`)
            loadedTokenIdsRef.current.add(tokenIdStr)
            setTokens(prev => {
              // Extra safety: check if token already exists in state
              if (prev.some(t => t.tokenId === tokenId)) {
                console.log(`[Assets] Token ${tokenId} already in state, skipping add`)
                return prev
              }
              return [...prev, { tokenId, isLoading: true }]
            })

            // Fetch tokenURI and metadata
            console.log(`[Assets] Fetching tokenURI for ${tokenId}...`)
            const uri = await publicClient.readContract({
              address: contractAddress,
              abi: RWA721_ABI,
              functionName: 'tokenURI',
              args: [tokenId],
            })
            console.log(`[Assets] Token ${tokenId} URI:`, uri)

            if (uri) {
              console.log(`[Assets] Fetching metadata for token ${tokenId}`)

              // Start timing for minimum display duration
              const startTime = Date.now()
              const metadata = await fetchFromIPFS(uri as string)

              // Ensure loading animation displays for at least 1 second for better UX
              const elapsedTime = Date.now() - startTime
              const minDisplayTime = 1000 // 1 second
              if (elapsedTime < minDisplayTime) {
                await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsedTime))
              }

              setTokens(prev =>
                prev.map(t =>
                  t.tokenId === tokenId
                    ? { ...t, metadata, tokenURI: uri as string, isLoading: false }
                    : t
                )
              )
              console.log(`[Assets] Token ${tokenId} loaded successfully`)

              // Cache the token with metadata
              TokenCache.addToken(chainId, address, {
                tokenId: tokenId.toString(),
                owner: address,
                tokenURI: uri as string,
                metadata,
                lastUpdated: Date.now(),
              })
            }
          } catch (error) {
            // Check if this is the expected "token doesn't exist" error (bridged away)
            const errorMessage = error instanceof Error ? error.message : String(error)
            if (errorMessage.includes('0x7e273289') || errorMessage.includes('ERC721NonexistentToken')) {
              console.log(`[Assets] Token ${tokenId} does not exist on this chain (likely bridged away), skipping`)
            } else {
              // Unexpected error - log full details
              console.error(`[Assets] Unexpected error loading token ${tokenId}:`, error)
            }
            // Don't add to state at all
          }
        }
        console.log('[Assets] Finished loading all tokens')
      } catch (error) {
        console.error('[Assets] Error loading tokens:', error)
        console.error('[Assets] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })
      } finally {
        console.log('[Assets] Setting isLoadingTokens to false')
        setIsLoadingTokens(false)
      }
    }

    console.log('[Assets] Calling loadTokens()')
    loadTokens()
  }, [address, contractAddress, publicClient, chainId])

  return (
    <>
      <OutrunBackground />
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <motion.div
          className="mb-8"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <h1
            className="text-3xl md:text-5xl font-bold mb-2 glow-text-cyan"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            My RWA Assets
          </h1>
          <p className="text-muted-foreground text-lg">
            {isConnected
              ? `Viewing assets on ${chainId === 84532 ? 'Base Sepolia' : 'Ethereum Sepolia'}`
              : 'Connect your wallet to view your assets'}
          </p>
          {balance !== undefined && (
            <motion.p
              className="text-sm text-muted-foreground mt-2 flex items-center gap-2"
              variants={fadeInUp}
            >
              <span className="inline-block w-2 h-2 bg-secondary rounded-full animate-glow-pulse" />
              Total balance: {balance.toString()} token{balance === BigInt(1) ? '' : 's'}
            </motion.p>
          )}
          {isConnected && (
            <p className="text-xs text-muted-foreground mt-2">
              Showing assets from the last ~5,000 blocks. Switch chains to see assets on other networks.
            </p>
          )}
        </motion.div>

        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-2 border-purple/40">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Please connect your wallet to view your assets
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {isConnected && isLoadingTokens && tokens.length === 0 && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <NFTCardSkeleton />
          </motion.div>
        )}

        {isConnected && !isLoadingTokens && tokens.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-2 border-primary/40">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No assets found. Mint your first RWA token!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {tokens.map((token) => (
            <motion.div
              key={token.tokenId.toString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              whileHover={token.isLoading ? undefined : hoverLift}
            >
              {token.isLoading ? (
                <NFTCardLoading tokenId={token.tokenId} />
              ) : (
                <Card
                  className="bg-card/50 backdrop-blur-sm border-2 border-primary/30 h-full transition-all hover:border-primary/60 hover:glow-purple cursor-pointer group"
                  onClick={() => setSelectedToken(token)}
                >
                  <CardContent className="p-0">
                    {token.metadata ? (
                    <>
                      {/* Image */}
                      {token.metadata.image && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                          className="relative overflow-hidden"
                        >
                          <img
                            src={getIPFSGatewayUrl(token.metadata.image)}
                            alt={token.metadata.name}
                            className="w-full h-64 object-cover transition-transform group-hover:scale-105 duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />

                          {/* Overlay info */}
                          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-1">
                            <h3
                              className="text-xl font-bold text-white glow-text-pink"
                              style={{ fontFamily: 'var(--font-space-grotesk)' }}
                            >
                              {token.metadata.name || formatTokenId(token.tokenId)}
                            </h3>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full font-mono">
                                {extractChainShortName(token.tokenId)}
                              </span>
                              <span className="text-white/80 font-mono">
                                #{getLocalTokenId(token.tokenId)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Quick info */}
                      <div className="p-4 space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {token.metadata.description}
                        </p>

                        {/* Attributes count */}
                        {token.metadata.attributes && token.metadata.attributes.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-glow-pulse" />
                            {token.metadata.attributes.length} attribute{token.metadata.attributes.length !== 1 ? 's' : ''}
                          </div>
                        )}

                        {/* Bridge button */}
                        <BridgeButton
                          onClick={(e) => {
                            e?.stopPropagation()
                            setBridgeTokenId(token.tokenId)
                            setBridgeTokenName(token.metadata?.name)
                            setBridgeDialogOpen(true)
                          }}
                          size="lg"
                          className="w-full"
                        />
                      </div>
                    </>
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-sm text-muted-foreground">Failed to load metadata</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* NFT Detail Modal */}
        {selectedToken && (
          <NFTDetailModal
            open={!!selectedToken}
            onOpenChange={(open) => !open && setSelectedToken(null)}
            tokenId={selectedToken.tokenId}
            metadata={selectedToken.metadata}
            tokenURI={selectedToken.tokenURI}
            onBridge={() => {
              setBridgeTokenId(selectedToken.tokenId)
              setBridgeTokenName(selectedToken.metadata?.name)
              setSelectedToken(null)
              setBridgeDialogOpen(true)
            }}
          />
        )}

        {/* Bridge Dialog */}
        {bridgeTokenId && (
          <BridgeNFTDialog
            tokenId={bridgeTokenId}
            tokenName={bridgeTokenName}
            open={bridgeDialogOpen}
            onOpenChange={setBridgeDialogOpen}
          />
        )}
      </div>
    </>
  )
}
