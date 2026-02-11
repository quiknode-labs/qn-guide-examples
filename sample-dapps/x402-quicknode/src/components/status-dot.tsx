"use client";

import { cn } from "@/lib/cn";

type StatusDotProps = {
  variant: "active" | "inactive" | "error";
  label: string;
  className?: string;
};

export function StatusDot({ variant, label, className }: StatusDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          variant === "active" && "bg-(--accent) animate-pulse",
          variant === "inactive" && "bg-(--border)",
          variant === "error" && "bg-red-500",
        )}
      />
      <span
        className={cn(
          "text-sm font-medium",
          variant === "active" && "text-(--foreground)",
          variant === "inactive" && "text-(--foreground-light)",
          variant === "error" && "text-red-600",
        )}
      >
        {label}
      </span>
    </span>
  );
}
