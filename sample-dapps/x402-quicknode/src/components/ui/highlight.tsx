type HighlightProps = {
  children: React.ReactNode;
};

export function Highlight({ children }: HighlightProps) {
  return <span className="text-[#00FF00]">{children}</span>;
}
