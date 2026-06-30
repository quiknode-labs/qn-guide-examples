"use client";

interface SimulationToggleProps {
  simulate: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function SimulationToggle({ simulate, onChange, disabled }: SimulationToggleProps) {
  const options: { value: boolean; label: string }[] = [
    { value: true, label: "Accurate" },
    { value: false, label: "Fast" },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="stat-label">Routing</span>

      <div className="flex border border-border">
        {options.map((opt) => (
          <button
            key={opt.label}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors disabled:opacity-50 ${
              simulate === opt.value
                ? "bg-accent text-accent-fg"
                : "text-fg-dim hover:bg-bg-hover hover:text-fg"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Help tooltip — rendered after the toggle, above all siblings via z-50 */}
      <div className="relative group">
        <svg
          className="w-3.5 h-3.5 text-fg-ghost hover:text-fg-dim cursor-default transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v.01M12 11v5" />
        </svg>
        <div className="absolute top-full right-0 mt-2 w-56 bg-bg border border-border p-2.5 font-mono text-[10px] text-fg-medium leading-relaxed invisible group-hover:visible z-50 pointer-events-none shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
          <p><span className="text-fg uppercase tracking-wide">Accurate</span> — Titan simulates each route against live on-chain state before returning it. Fewer failed transactions, slightly slower.</p>
          <p className="mt-1.5"><span className="text-fg uppercase tracking-wide">Fast</span> — skips simulation. Lower latency but the route is unverified; execution may fail if liquidity shifted.</p>
        </div>
      </div>
    </div>
  );
}
