import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/utils"

const inputVariants = cva(
  "flex w-full rounded-xl bg-gray-700 px-4 py-3 text-sm text-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:shadow-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-2 border-transparent focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500",
        success: "border-2 border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/50",
        error: "border-2 border-red-500 focus-visible:ring-2 focus-visible:ring-red-500/50",
      },
      size: {
        default: "h-12 px-4 py-3",
        sm: "h-9 px-3 text-sm",
        lg: "h-14 px-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }