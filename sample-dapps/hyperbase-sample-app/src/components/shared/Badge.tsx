interface BadgeProps {
  children: React.ReactNode;
  color?: "default" | "green" | "red" | "yellow" | "purple" | "blue";
}

export default function Badge({ children, color = "default" }: BadgeProps) {
  const colorClass = color === "default" ? "badge" : `badge badge-${color}`;
  return <span className={colorClass}>{children}</span>;
}
