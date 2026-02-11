import { cn } from "@/lib/cn";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-(--border) px-2.5 py-0.5 text-xs font-medium text-(--foreground-medium)",
        className,
      )}
    >
      {children}
    </span>
  );
}
