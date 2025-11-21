'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { usePathname } from 'next/navigation'

export function Navigation() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Home' },
    { href: '/mint', label: 'Mint' },
    { href: '/assets', label: 'My Assets' },
  ]

  return (
    <nav className="border-b border-border/50 backdrop-blur-md bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold glow-text-pink" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              RWA Tokenizer
            </Link>
            <div className="hidden md:flex gap-6">
              {links.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative text-sm font-medium transition-colors hover:text-primary"
                  >
                    <span className={isActive ? 'text-foreground' : 'text-muted-foreground'}>
                      {link.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  )
}
