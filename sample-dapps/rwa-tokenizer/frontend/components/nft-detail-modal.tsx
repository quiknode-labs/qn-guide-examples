'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { BridgeButton } from '@/components/bridge-button'
import { getIPFSGatewayUrl, NFTMetadata } from '@/lib/ipfs'
import { X } from 'lucide-react'

interface NFTDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tokenId: bigint
  metadata?: NFTMetadata
  tokenURI?: string
  onBridge: () => void
}

export function NFTDetailModal({
  open,
  onOpenChange,
  tokenId,
  metadata,
  tokenURI,
  onBridge,
}: NFTDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-card/95 backdrop-blur-xl border-2 border-primary/40 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle
                className="text-3xl font-bold glow-text-pink mb-2"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                {metadata?.name || `Token #${tokenId.toString()}`}
              </DialogTitle>
              <p className="text-sm text-muted-foreground font-mono">
                Token ID: {tokenId.toString()}
              </p>
            </div>
          </div>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Image */}
          {metadata?.image && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-xl blur-2xl group-hover:blur-3xl transition-all" />
              <img
                src={getIPFSGatewayUrl(metadata.image)}
                alt={metadata.name}
                className="relative w-full h-auto max-h-96 object-contain rounded-xl border-2 border-primary/30 group-hover:border-secondary/50 transition-all"
              />
            </motion.div>
          )}

          {/* Description */}
          {metadata?.description && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                Description
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {metadata.description}
              </p>
            </motion.div>
          )}

          {/* Attributes */}
          {metadata?.attributes && metadata.attributes.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                Attributes
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {metadata.attributes.map((attr, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="bg-muted/30 rounded-lg p-3 border border-border/50 hover:border-primary/50 transition-colors"
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      {attr.trait_type}
                    </p>
                    <p className="font-semibold text-foreground">{attr.value}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Location */}
          {metadata?.location && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                Location
              </h3>
              <p className="text-sm text-muted-foreground">
                {metadata.location.formatted_address}
              </p>
              <div className="rounded-xl overflow-hidden border-2 border-border/50 hover:border-secondary/50 transition-colors">
                <img
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${metadata.location.lat},${metadata.location.lng}&zoom=14&size=800x300&markers=color:red%7C${metadata.location.lat},${metadata.location.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                  alt="Asset location"
                  className="w-full h-48 object-cover"
                />
              </div>
            </motion.div>
          )}

          {/* Metadata URI */}
          {tokenURI && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <h3 className="text-sm font-semibold text-muted-foreground">Metadata URI</h3>
              <a
                href={getIPFSGatewayUrl(tokenURI)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-secondary hover:text-secondary/80 break-all block transition-colors"
              >
                {tokenURI}
              </a>
            </motion.div>
          )}

          {/* Bridge Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full"
          >
            <BridgeButton onClick={onBridge} className="w-full" size="lg" />
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
