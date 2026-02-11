import { cn } from "@/lib/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  size?: "default" | "lg";
};

export function Button({
  variant = "primary",
  size = "default",
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center font-medium transition-colors",
        variant === "primary" &&
          "bg-[#10151B] text-white rounded-full hover:bg-[#1a2130]",
        variant === "secondary" &&
          "bg-transparent border border-(--border) text-(--foreground) rounded-full hover:bg-(--border)",
        size === "default" && variant === "primary" && "px-4 py-2 text-sm",
        size === "default" && variant === "secondary" && "px-3 py-1.5 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
