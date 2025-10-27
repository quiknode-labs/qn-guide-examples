# 🌆 Synthwave Design System - Implementation Guide

## Overview

This document details the complete synthwave/retrowave design system implemented for the RWA Tokenizer. The design blends retro wave aesthetics with modern UX principles for a sleek, futuristic look.

## 🎨 Color System

### Primary Colors (HSL format)
```css
--neon-pink: 330 100% 50%        /* #FF006E - Primary actions, highlights */
--neon-cyan: 187 100% 50%        /* #00F5FF - Secondary actions, accents */
--neon-purple: 270 100% 50%      /* #8B00FF - Accent color, borders */
--neon-orange: 16 100% 50%       /* #FF4500 - Sunset accents */
```

### Background Colors
```css
--background: 260 80% 3%         /* #0A0118 - Deep space black */
--card: 264 45% 12%              /* #2D1B4E - Card background */
--muted: 264 45% 20%             /* Muted elements */
```

### Usage Guidelines
- **Primary (Pink)**: Main CTAs, important highlights, glowing text
- **Secondary (Cyan)**: Links, secondary actions, status indicators
- **Accent (Purple)**: Borders, hover states, decorative elements
- **Orange**: Sunset gradients, rare accents

## 📝 Typography

### Font Stack
```typescript
// Headings - Space Grotesk (geometric, futuristic)
style={{ fontFamily: 'var(--font-space-grotesk)' }}

// Body - Inter (clean, readable) - Default
className="font-sans"

// Monospace - JetBrains Mono (addresses, token IDs)
className="font-mono"
```

### Type Scale
- Hero: `text-5xl md:text-7xl` (3rem → 4.5rem)
- H1: `text-3xl md:text-5xl` (1.875rem → 3rem)
- H2: `text-2xl md:text-4xl` (1.5rem → 2.25rem)
- Body: `text-base md:text-lg` (1rem → 1.125rem)
- Small: `text-sm` (0.875rem)

## ✨ Custom Utility Classes

### Glow Effects
```css
.glow-pink          /* Pink neon glow box-shadow */
.glow-cyan          /* Cyan neon glow box-shadow */
.glow-purple        /* Purple neon glow box-shadow */
.glow-text-pink     /* Pink text-shadow for headlines */
.glow-text-cyan     /* Cyan text-shadow for headlines */
```

### Gradients
```css
.bg-synthwave-sunset    /* Pink → Orange → Gold gradient */
.bg-synthwave-sky       /* Dark purple → Purple gradient */
.bg-synthwave-neon      /* Cyan → Purple → Pink gradient */
```

### Grid Backgrounds
```css
.bg-grid          /* 50px grid with purple lines */
.bg-grid-large    /* 100px grid for larger areas */
```

### Border Gradients
```css
.border-gradient-pink-cyan      /* Pink to Cyan border */
.border-gradient-purple-pink    /* Purple to Pink border */
```

### Animations
```css
.animate-glow-pulse      /* 2s pulsing opacity */
.animate-float           /* 3s floating motion */
.animate-shimmer         /* 2s shimmer effect */
.animate-grid-flow       /* 20s grid movement */
.animate-gradient-shift  /* 3s gradient animation */
```

## 🎬 Framer Motion Animations

### Import from `/lib/animations.ts`
```typescript
import {
  fadeInUp,           // Fade in from bottom
  staggerContainer,   // Container for staggered children
  staggerItem,        // Individual staggered item
  hoverScale,         // Scale up on hover
  hoverLift,          // Lift up on hover (y: -8px)
} from '@/lib/animations'
```

### Common Patterns

#### Page Entrance
```tsx
<motion.div
  variants={staggerContainer}
  initial="hidden"
  animate="visible"
>
  <motion.div variants={staggerItem}>
    {/* Content */}
  </motion.div>
</motion.div>
```

#### Card Grid with Stagger
```tsx
<motion.div
  className="grid grid-cols-3 gap-6"
  variants={staggerContainer}
  initial="hidden"
  animate="visible"
>
  {items.map(item => (
    <motion.div
      key={item.id}
      variants={staggerItem}
      whileHover={hoverLift}
    >
      <Card />
    </motion.div>
  ))}
</motion.div>
```

#### Button with Interaction
```tsx
<motion.div
  whileHover={hoverScale}
  whileTap={{ scale: 0.95 }}
>
  <Button />
</motion.div>
```

## 🏗️ Component Patterns

### Enhanced Card
```tsx
<Card className="bg-card/50 backdrop-blur-sm border-gradient-purple-pink hover:glow-purple transition-all">
  <CardHeader>
    <CardTitle style={{ fontFamily: 'var(--font-space-grotesk)' }}>
      Title
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Glowing Button
```tsx
<Button className="glow-pink">
  Primary Action
</Button>

<Button variant="outline" className="border-secondary text-secondary">
  Secondary Action
</Button>
```

### Status Indicator
```tsx
<div className="flex items-center gap-2">
  <span className="w-2 h-2 bg-primary rounded-full animate-glow-pulse" />
  <span>Live status</span>
</div>
```

### Loading State
```tsx
<div className="flex items-center gap-2">
  <div className="w-2 h-2 bg-primary rounded-full animate-glow-pulse" />
  <p>Loading...</p>
</div>
```

## 🎨 Layout Components

### Synthwave Background
```tsx
import { SynthwaveBackground } from '@/components/synthwave-background'

<>
  <SynthwaveBackground />
  {/* Your page content */}
</>
```

Features:
- Animated gradient background
- Moving grid overlay
- Floating orb particles with glow
- Depth gradient overlay

### Navigation
The navigation includes:
- Glowing logo text
- Animated underline for active route (motion layoutId)
- Sticky positioning with backdrop blur
- Smooth transitions

## 🎯 Best Practices

### Do's ✅
1. **Use glows sparingly** - Only on key elements (CTAs, headings)
2. **Stagger animations** - Use staggerContainer for lists/grids
3. **Backdrop blur** - Add `backdrop-blur-sm` with semi-transparent backgrounds
4. **Consistent spacing** - Maintain generous padding (16-24px minimum)
5. **Smooth transitions** - Use `transition-all duration-300`
6. **Font hierarchy** - Space Grotesk for headings, Inter for body

### Don'ts ❌
1. **Don't overuse neon colors** - 10% neon, 90% dark backgrounds
2. **Don't stack multiple glows** - One glow effect per visual group
3. **Don't use bright backgrounds** - Stick to dark theme
4. **Don't skip hover states** - Every interactive element needs feedback
5. **Don't animate too slowly** - Keep animations under 0.7s

## 🚀 Performance Tips

1. **Use CSS animations for simple effects** - Reserve Framer Motion for complex interactions
2. **Optimize images** - Compress and lazy load NFT images
3. **Limit floating orbs** - 3 max on screen at once
4. **Reduce motion preference** - Respect user's `prefers-reduced-motion`

## 📱 Responsive Considerations

- Hero text: Scale from mobile (text-5xl) to desktop (text-7xl)
- Navigation: Hide links on mobile, show on md: breakpoint
- Grid layouts: 1 column mobile → 2 cols tablet → 3 cols desktop
- Reduce glow intensity on smaller screens (performance)

## 🎨 Example Page Structure

```tsx
'use client'

import { motion } from 'framer-motion'
import { SynthwaveBackground } from '@/components/synthwave-background'
import { Navigation } from '@/components/navigation'
import { staggerContainer, staggerItem } from '@/lib/animations'

export default function Page() {
  return (
    <>
      <SynthwaveBackground />
      <Navigation />

      <div className="container mx-auto px-4 py-16">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="text-5xl md:text-7xl font-bold glow-text-pink"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
            variants={staggerItem}
          >
            Your Title
          </motion.h1>

          <motion.div
            className="grid md:grid-cols-2 gap-6 mt-8"
            variants={staggerContainer}
          >
            {/* Cards */}
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}
```

## 🔧 Future Enhancements

Consider adding:
- Parallax scrolling effects
- Mouse-tracking spotlight effect
- Audio visualizer integration
- Dynamic theme intensity controls
- Custom cursor with glow trail
- Particle system for interactions

---

**Remember**: The goal is a sleek, modern interface with synthwave energy—not an overwhelming retro experience. Balance is key!
