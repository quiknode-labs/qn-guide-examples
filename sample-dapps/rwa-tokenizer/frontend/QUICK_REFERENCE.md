# 🎨 Synthwave Design - Quick Reference

## Color Palette

```css
/* Primary Colors */
#FF006E  /* Neon Pink - Main CTAs, primary actions */
#00F5FF  /* Neon Cyan - Secondary actions, links */
#8B00FF  /* Neon Purple - Accents, borders */
#FF4500  /* Neon Orange - Sunset gradients */

/* Backgrounds */
#0A0118  /* Deep Space - Main background */
#2D1B4E  /* Dark Purple - Card backgrounds */
#1A0B2E  /* Purple Haze - Gradient backgrounds */
```

## CSS Classes Cheat Sheet

### Glows
```css
.glow-pink          /* Pink box shadow */
.glow-cyan          /* Cyan box shadow */
.glow-purple        /* Purple box shadow */
.glow-text-pink     /* Pink text shadow */
.glow-text-cyan     /* Cyan text shadow */
```

### Gradients
```css
.bg-synthwave-sunset    /* Pink → Orange → Gold */
.bg-synthwave-sky       /* Dark Purple → Purple */
.bg-synthwave-neon      /* Cyan → Purple → Pink */
```

### Patterns
```css
.bg-grid                /* 50px grid */
.bg-grid-large          /* 100px grid */
```

### Borders
```css
.border-gradient-pink-cyan      /* Pink to Cyan border */
.border-gradient-purple-pink    /* Purple to Pink border */
```

### Animations
```css
.animate-glow-pulse     /* 2s pulsing */
.animate-float          /* 3s floating */
.animate-shimmer        /* 2s shimmer */
.animate-grid-flow      /* 20s grid movement */
```

## Framer Motion Presets

```typescript
import {
  fadeInUp,           // Fade + slide up
  fadeInDown,         // Fade + slide down
  scaleIn,            // Scale from 90% to 100%
  staggerContainer,   // Parent for staggered children
  staggerItem,        // Child items (use with staggerContainer)
  hoverScale,         // Scale to 105% on hover
  hoverLift,          // Lift up 8px on hover
} from '@/lib/animations'
```

## Common Patterns

### Glowing CTA Button
```tsx
<Button className="glow-pink">
  Primary Action
</Button>
```

### Card with Gradient Border
```tsx
<Card className="bg-card/50 backdrop-blur-sm border-gradient-purple-pink hover:glow-purple">
  {/* Content */}
</Card>
```

### Animated Headline
```tsx
<motion.h1
  className="text-5xl md:text-7xl font-bold glow-text-pink"
  style={{ fontFamily: 'var(--font-space-grotesk)' }}
  variants={fadeInUp}
  initial="hidden"
  animate="visible"
>
  Your Title
</motion.h1>
```

### Status Indicator
```tsx
<div className="flex items-center gap-2">
  <span className="w-2 h-2 bg-primary rounded-full animate-glow-pulse" />
  <span>Online</span>
</div>
```

### Staggered Grid
```tsx
<motion.div
  className="grid md:grid-cols-3 gap-6"
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
      <Card>{/* ... */}</Card>
    </motion.div>
  ))}
</motion.div>
```

### Interactive Button
```tsx
<motion.div
  whileHover={hoverScale}
  whileTap={{ scale: 0.95 }}
>
  <Button>Click Me</Button>
</motion.div>
```

## Font Usage

```tsx
// Headings
<h1 style={{ fontFamily: 'var(--font-space-grotesk)' }}>
  Title
</h1>

// Body (default)
<p className="font-sans">
  Body text
</p>

// Monospace (addresses, IDs)
<code className="font-mono">
  0x1234...5678
</code>
```

## Page Template

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
            className="text-5xl font-bold glow-text-pink mb-8"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
            variants={staggerItem}
          >
            Page Title
          </motion.h1>

          {/* More content */}
        </motion.div>
      </div>
    </>
  )
}
```

## Component Enhancements

### Enhanced Card
```tsx
<Card className="bg-card/50 backdrop-blur-sm border-gradient-purple-pink h-full transition-all hover:glow-purple">
  <CardHeader>
    <CardTitle style={{ fontFamily: 'var(--font-space-grotesk)' }}>
      Title
    </CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Loading State
```tsx
<div className="flex items-center gap-2">
  <div className="w-2 h-2 bg-primary rounded-full animate-glow-pulse" />
  <p>Loading...</p>
</div>
```

### Image with Fade
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  <img src={url} alt="Description" />
</motion.div>
```

## Responsive Breakpoints

```tsx
// Mobile first
className="text-3xl md:text-5xl lg:text-7xl"

// Grid responsive
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Hide on mobile
className="hidden md:flex"
```

## Best Practices

✅ **DO**
- Use glows on key elements only
- Stagger animations for lists
- Add hover states to all interactive elements
- Use Space Grotesk for headings
- Keep animations under 600ms
- Use backdrop-blur with transparency

❌ **DON'T**
- Overuse neon colors (90% dark, 10% neon)
- Stack multiple glows
- Use bright backgrounds
- Forget hover feedback
- Animate too slowly

---

**Pro Tip**: Start with the page template above and customize from there!
