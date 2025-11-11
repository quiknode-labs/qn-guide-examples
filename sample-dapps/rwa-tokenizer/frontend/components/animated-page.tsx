'use client'

import { motion } from 'framer-motion'
import { pageTransition } from '@/lib/animations'

interface AnimatedPageProps {
  children: React.ReactNode
}

export function AnimatedPage({ children }: AnimatedPageProps) {
  return (
    <motion.div
      initial="hidden"
      animate="enter"
      exit="exit"
      variants={pageTransition}
    >
      {children}
    </motion.div>
  )
}
