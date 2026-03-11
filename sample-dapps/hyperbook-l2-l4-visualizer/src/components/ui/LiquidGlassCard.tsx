"use client";

type GlassVariant = "default" | "glow" | "float" | "subtle" | "trigger";

const variantClasses: Record<GlassVariant, string> = {
  default: "liquid-glass",
  glow: "liquid-glass liquid-glass-glow",
  float: "liquid-glass-float",
  subtle: "liquid-glass-subtle",
  trigger: "liquid-glass-trigger",
};

interface LiquidGlassCardProps {
  children: React.ReactNode;
  variant?: GlassVariant;
  className?: string;
}

export function LiquidGlassCard({ children, variant = "default", className = "" }: LiquidGlassCardProps) {
  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}
