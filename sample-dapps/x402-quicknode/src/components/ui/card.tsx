import { cn } from "@/lib/cn";

type CardProps = {
  variant?: "white";
  children: React.ReactNode;
  className?: string;
};

function CardRoot({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-(--border) bg-white",
        className,
      )}
    >
      {children}
    </div>
  );
}

type CardContentProps = {
  children: React.ReactNode;
  className?: string;
};

function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn("p-4 flex flex-col gap-4", className)}>{children}</div>
  );
}

export const Card = Object.assign(CardRoot, { Content: CardContent });
