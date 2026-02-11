import { cn } from "@/lib/cn";

type HeadingProps = {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
};

export function Heading({ level = 2, children, className }: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag
      className={cn(
        "font-display font-semibold tracking-tight text-(--foreground)",
        level <= 2 && "text-4xl md:text-5xl",
        level === 3 && "text-2xl md:text-3xl",
        level >= 4 && "text-xl md:text-2xl",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
