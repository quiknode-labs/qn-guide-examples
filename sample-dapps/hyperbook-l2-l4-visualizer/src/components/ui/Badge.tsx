"use client";

interface BadgeProps {
  variant: "buy" | "sell" | "new" | "updated" | "removed" | "filled" | "canceled" | "muted";
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeProps["variant"], string> = {
  buy: "bg-[var(--bid-soft)] text-[var(--bid)] border border-[rgba(16,185,129,0.20)]",
  sell: "bg-[var(--ask-soft)] text-[var(--ask)] border border-[rgba(239,68,68,0.20)]",
  new: "bg-[var(--bid-soft)] text-[var(--bid)] border border-[rgba(16,185,129,0.20)]",
  updated: "bg-[rgba(251,191,36,0.1)] text-[var(--warn)] border border-[rgba(251,191,36,0.20)]",
  removed: "bg-[var(--ask-soft)] text-[var(--ask)] border border-[rgba(239,68,68,0.20)]",
  filled: "bg-[rgba(167,139,250,0.1)] text-[var(--purple)] border border-[rgba(167,139,250,0.20)]",
  canceled: "bg-[rgba(255,255,255,0.04)] text-[var(--text-muted)] border border-[rgba(255,255,255,0.08)]",
  muted: "bg-[rgba(255,255,255,0.04)] text-[var(--text-muted)] border border-[rgba(255,255,255,0.08)]",
};

export function Badge({ variant, children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium uppercase leading-none ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
