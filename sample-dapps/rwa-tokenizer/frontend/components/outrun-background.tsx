'use client'

import { useEffect, useRef } from 'react'

export function OutrunBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Grid parameters
    const gridSpacing = 50
    const gridDepth = 20
    const perspectiveDistance = 400
    let time = 0

    // Sun parameters
    const sunRadius = 200
    const sunY = canvas.height * 0.35

    // Animation function
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Gradient background (purple to darker purple/black)
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      bgGradient.addColorStop(0, '#1a0033')
      bgGradient.addColorStop(0.5, '#4a0080')
      bgGradient.addColorStop(1, '#0a0118')
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      for (let i = 0; i < 100; i++) {
        const x = (i * 137.508) % canvas.width
        const y = (i * 89.234) % (canvas.height * 0.4)
        const size = Math.random() * 2
        ctx.fillRect(x, y, size, size)
      }

      // Animated sun with gradient - more vibrant and visible
      // Calculate extremely slow and subtle pulse for glow effect (80 second cycle)
      const pulseTime = (time * 0.010) // 95% slower animation
      const pulseIntensity = 0.95 + Math.sin(pulseTime) * 0.05 // Oscillates between 0.9 and 1.0 (very subtle)

      const sunGradient = ctx.createRadialGradient(
        canvas.width / 2, sunY, 0,
        canvas.width / 2, sunY, sunRadius
      )
      sunGradient.addColorStop(0, '#FFEB3B')
      sunGradient.addColorStop(0.2, '#FF9800')
      sunGradient.addColorStop(0.4, '#FF5722')
      sunGradient.addColorStop(0.6, '#FF006E')
      sunGradient.addColorStop(0.8, '#C71585')
      sunGradient.addColorStop(1, 'rgba(199, 21, 133, 0.2)')

      ctx.fillStyle = sunGradient
      ctx.beginPath()
      ctx.arc(canvas.width / 2, sunY, sunRadius, 0, Math.PI * 2)
      ctx.fill()

      // Add outer glow for more vibrancy with subtle pulse
      ctx.globalAlpha = 0.8 * pulseIntensity
      const glowGradient = ctx.createRadialGradient(
        canvas.width / 2, sunY, sunRadius * 0.8,
        canvas.width / 2, sunY, sunRadius * (1.8 + Math.sin(pulseTime) * 0.03) // Very subtle radius pulse
      )
      glowGradient.addColorStop(0, `rgba(255, 165, 0, ${0.6 * pulseIntensity})`)
      glowGradient.addColorStop(0.4, `rgba(255, 107, 107, ${0.4 * pulseIntensity})`)
      glowGradient.addColorStop(0.7, `rgba(255, 0, 110, ${0.2 * pulseIntensity})`)
      glowGradient.addColorStop(1, 'rgba(255, 0, 110, 0)')

      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(canvas.width / 2, sunY, sunRadius * (1.8 + Math.sin(pulseTime) * 0.03), 0, Math.PI * 2)
      ctx.fill()

      // Add bright core highlight with pulse
      ctx.globalAlpha = 0.9 * pulseIntensity
      const coreGradient = ctx.createRadialGradient(
        canvas.width / 2, sunY, 0,
        canvas.width / 2, sunY, sunRadius * 0.4
      )
      coreGradient.addColorStop(0, `rgba(255, 255, 200, ${0.9 * pulseIntensity})`)
      coreGradient.addColorStop(0.5, `rgba(255, 235, 59, ${0.6 * pulseIntensity})`)
      coreGradient.addColorStop(1, 'rgba(255, 235, 59, 0)')

      ctx.fillStyle = coreGradient
      ctx.beginPath()
      ctx.arc(canvas.width / 2, sunY, sunRadius * 0.4, 0, Math.PI * 2)
      ctx.fill()

      ctx.globalAlpha = 1

      // Geometric polygon mountains (Denver-inspired)
      const horizonY = canvas.height * 0.55

      // Back layer - Purple mountains
      ctx.globalAlpha = 0.6
      ctx.strokeStyle = '#8B00FF'
      ctx.lineWidth = 2

      ctx.beginPath()
      ctx.moveTo(0, horizonY + 50)
      ctx.lineTo(canvas.width * 0.15, horizonY - 80)
      ctx.lineTo(canvas.width * 0.25, horizonY - 120)
      ctx.lineTo(canvas.width * 0.35, horizonY - 60)
      ctx.lineTo(canvas.width * 0.45, horizonY - 140)
      ctx.lineTo(canvas.width * 0.55, horizonY - 100)
      ctx.lineTo(canvas.width * 0.65, horizonY - 160)
      ctx.lineTo(canvas.width * 0.75, horizonY - 90)
      ctx.lineTo(canvas.width * 0.85, horizonY - 130)
      ctx.lineTo(canvas.width, horizonY - 70)
      ctx.stroke()

      // Middle layer - Pink/Magenta mountains
      ctx.globalAlpha = 0.7
      ctx.strokeStyle = '#FF006E'
      ctx.lineWidth = 2

      ctx.beginPath()
      ctx.moveTo(0, horizonY + 30)
      ctx.lineTo(canvas.width * 0.1, horizonY - 60)
      ctx.lineTo(canvas.width * 0.2, horizonY - 100)
      ctx.lineTo(canvas.width * 0.3, horizonY - 50)
      ctx.lineTo(canvas.width * 0.42, horizonY - 130)
      ctx.lineTo(canvas.width * 0.52, horizonY - 80)
      ctx.lineTo(canvas.width * 0.65, horizonY - 150)
      ctx.lineTo(canvas.width * 0.78, horizonY - 70)
      ctx.lineTo(canvas.width * 0.9, horizonY - 110)
      ctx.lineTo(canvas.width, horizonY - 50)
      ctx.stroke()

      // Front layer - Cyan mountains (most prominent)
      ctx.globalAlpha = 0.8
      ctx.strokeStyle = '#00F5FF'
      ctx.lineWidth = 3

      ctx.beginPath()
      ctx.moveTo(0, horizonY + 10)
      ctx.lineTo(canvas.width * 0.12, horizonY - 50)
      ctx.lineTo(canvas.width * 0.22, horizonY - 90)
      ctx.lineTo(canvas.width * 0.32, horizonY - 40)
      ctx.lineTo(canvas.width * 0.45, horizonY - 120)
      ctx.lineTo(canvas.width * 0.58, horizonY - 70)
      ctx.lineTo(canvas.width * 0.7, horizonY - 140)
      ctx.lineTo(canvas.width * 0.82, horizonY - 60)
      ctx.lineTo(canvas.width * 0.92, horizonY - 100)
      ctx.lineTo(canvas.width, horizonY - 40)
      ctx.stroke()

      ctx.globalAlpha = 1

      // Perspective grid
      const vanishingPointX = canvas.width / 2
      const vanishingPointY = horizonY

      ctx.strokeStyle = '#00F5FF'
      ctx.lineWidth = 2

      // Vertical lines (perspective)
      for (let i = -15; i <= 15; i++) {
        const startX = vanishingPointX + i * gridSpacing * 2
        const startY = canvas.height

        ctx.globalAlpha = 0.3 + (1 - Math.abs(i) / 15) * 0.4
        ctx.strokeStyle = i % 2 === 0 ? '#00F5FF' : '#FF006E'

        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(vanishingPointX + (i * gridSpacing * 0.1), vanishingPointY)
        ctx.stroke()
      }

      // Horizontal lines (moving forward)
      ctx.strokeStyle = '#00F5FF'
      for (let i = 0; i < gridDepth; i++) {
        const z = i * gridSpacing + (time * 0.6) % gridSpacing
        const scale = perspectiveDistance / (perspectiveDistance + z)
        const y = horizonY + (canvas.height - horizonY) * (1 - scale)
        const width = canvas.width * scale

        ctx.globalAlpha = scale * 0.6
        ctx.lineWidth = scale * 3

        ctx.beginPath()
        ctx.moveTo(vanishingPointX - width / 2, y)
        ctx.lineTo(vanishingPointX + width / 2, y)
        ctx.stroke()
      }

      time++
      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none opacity-50"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
