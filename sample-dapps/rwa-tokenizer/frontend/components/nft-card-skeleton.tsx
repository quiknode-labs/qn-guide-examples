'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export function NFTCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-card/50 backdrop-blur-sm border-2 border-primary/20 h-full animate-pulse-glow overflow-hidden">
        <CardContent className="p-0 relative">
          {/* Top loading progress bar */}
          <motion.div
            className="absolute top-0 left-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent z-50"
            initial={{ width: '0%' }}
            animate={{ width: ['0%', '100%', '0%'] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Image skeleton */}
          <div className="w-full h-64 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 relative overflow-hidden">
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            {/* Loading spinner */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Outer pulsing ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-primary/30"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                  style={{ width: '80px', height: '80px', left: '-34px', top: '-34px' }}
                />
                {/* Rotating loader */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="w-12 h-12 text-primary/60" />
                </motion.div>
              </div>
            </div>

            {/* Loading text */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <motion.p
                className="text-xs font-mono text-white/60 text-center"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Searching for tokens...
              </motion.p>
            </div>
          </div>

          {/* Content area */}
          <div className="p-4 space-y-3">
            {/* Title skeleton */}
            <motion.div
              className="h-4 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: '70%' }}
            />

            {/* Description skeleton */}
            <motion.div
              className="h-4 bg-gradient-to-r from-accent/20 via-primary/20 to-secondary/20 rounded"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              style={{ width: '90%' }}
            />

            {/* Attributes skeleton */}
            <motion.div
              className="flex items-center gap-2"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            >
              <span className="w-1.5 h-1.5 bg-secondary/40 rounded-full" />
              <div className="h-3 w-24 bg-secondary/20 rounded" />
            </motion.div>

            {/* Button skeleton */}
            <motion.div
              className="h-12 bg-gradient-to-r from-secondary/30 via-accent/30 to-primary/30 rounded-md"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{ backgroundSize: '200% 100%' }}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
