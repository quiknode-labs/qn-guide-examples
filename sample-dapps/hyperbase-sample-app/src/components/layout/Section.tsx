import Grid from "./Grid";

interface SectionProps {
  theme?: "light" | "dark";
  showGrid?: boolean;
  className?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export default function Section({
  theme = "light",
  showGrid = false,
  className = "",
  children,
  fullWidth = false,
}: SectionProps) {
  return (
    <section
      data-theme={theme}
      className={`relative bg-background text-foreground ${className}`}
    >
      {showGrid && <Grid />}
      <div
        className={`relative z-10 ${fullWidth ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}`}
      >
        {children}
      </div>
    </section>
  );
}
