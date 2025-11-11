'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRightLeft } from 'lucide-react'

interface BridgeButtonProps {
  onClick: (e?: React.MouseEvent) => void
  className?: string
  size?: 'default' | 'sm' | 'lg'
}

export function BridgeButton({ onClick, className, size = 'default' }: BridgeButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      <Button
        onClick={onClick}
        size={size}
        className="relative overflow-hidden bg-gradient-to-r from-secondary via-accent to-primary text-white font-semibold group glow-cyan hover:glow-purple transition-all duration-300 w-full"
      >
        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent opacity-0 group-hover:opacity-100 transition-opacity"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ backgroundSize: '200% 100%' }}
        />

        {/* Button content */}
        <span className="relative z-10 flex items-center gap-2">
          <motion.span
            animate={{
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <ArrowRightLeft className="w-4 h-4" />
          </motion.span>
          Bridge to Another Chain
        </span>
      </Button>
    </motion.div>
  )
}
