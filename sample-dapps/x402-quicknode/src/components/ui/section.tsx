import { cn } from "@/lib/cn";

type SectionProps = {
  children: React.ReactNode;
  className?: string;
  dotGrid?: boolean;
  dotGridClassName?: string;
};

export function Section({
  children,
  className,
  dotGrid = false,
  dotGridClassName,
}: SectionProps) {
  return (
    <section
      className={cn(
        "relative flex w-full items-center justify-center bg-(--background)",
        className,
      )}
    >
      {dotGrid && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 dot-grid",
            dotGridClassName,
          )}
          aria-hidden="true"
        />
      )}
      <div className="relative z-10 w-full">{children}</div>
    </section>
  );
}
