'use client'

import Link from "next/link";
import { motion } from "framer-motion";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { OutrunBackground } from "@/components/outrun-background";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  hoverScale,
  hoverLift,
} from "@/lib/animations";

export default function Home() {
  return (
    <>
      <OutrunBackground />
      <Navigation />
      <div className="container mx-auto px-4 py-16">
        <motion.div
          className="max-w-4xl mx-auto text-center space-y-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Hero Section */}
          <motion.div className="space-y-4" variants={staggerItem}>
            <motion.h1
              className="text-5xl md:text-7xl font-bold tracking-tight glow-text-pink"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              RWA Tokenizer
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-muted-foreground"
              variants={fadeInUp}
            >
              Tokenize, bridge, and trade <span className="text-secondary font-semibold">real world assets</span> across chains
            </motion.p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex gap-4 justify-center flex-wrap"
            variants={staggerItem}
          >
            <Link href="/mint">
              <motion.div whileHover={hoverScale} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="glow-pink text-lg px-8 py-6">
                  Mint RWA Token
                </Button>
              </motion.div>
            </Link>
            <Link href="/assets">
              <motion.div whileHover={hoverScale} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 border-secondary text-secondary hover:bg-secondary/10"
                >
                  View My Assets
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            className="grid md:grid-cols-2 gap-6 mt-16"
            variants={staggerContainer}
          >
            <motion.div variants={staggerItem} whileHover={hoverLift}>
              <Card className="bg-card/50 backdrop-blur-sm border-2 border-accent/30 h-full transition-all hover:border-accent/60 hover:glow-purple">
                <CardHeader>
                  <CardTitle className="text-2xl" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                    No-Code Minting
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Mint RWA tokens with custom attributes and IPFS metadata
                    storage in minutes
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={staggerItem} whileHover={hoverLift}>
              <Card className="bg-card/50 backdrop-blur-sm border-2 border-secondary/30 h-full transition-all hover:border-secondary/60 hover:glow-cyan">
                <CardHeader>
                  <CardTitle className="text-2xl" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                    Cross-Chain Bridge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Bridge your assets seamlessly across all EVM chains
                    using LayerZero omnichain technology
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            className="pt-8 text-sm text-muted-foreground"
            variants={fadeInUp}
          >
            <p className="flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 bg-primary rounded-full animate-glow-pulse" />
              Powered by QuickNode and LayerZero
            </p>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
