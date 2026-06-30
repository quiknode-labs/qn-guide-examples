"use client";

import { useState } from "react";

interface SlippageControlProps {
  slippageBps: number;
  onChange: (bps: number) => void;
}

const PRESETS = [10, 50, 100]; // 0.1%, 0.5%, 1.0%

export function SlippageControl({ slippageBps, onChange }: SlippageControlProps) {
  const [custom, setCustom] = useState("");
  const isPreset = PRESETS.includes(slippageBps);

  return (
    <div className="flex items-center gap-2">
      <span className="stat-label">Slippage</span>
      <div className="flex border border-border">
        {PRESETS.map((bps) => (
          <button
            key={bps}
            type="button"
            onClick={() => {
              setCustom("");
              onChange(bps);
            }}
            className={`px-2.5 py-1 font-mono text-[10px] tabular-nums transition-colors ${
              slippageBps === bps && (isPreset || custom === "")
                ? "bg-accent text-accent-fg"
                : "text-fg-dim hover:bg-bg-hover hover:text-fg"
            }`}
          >
            {(bps / 100).toFixed(bps < 100 ? 1 : 0)}%
          </button>
        ))}
        <input
          type="text"
          inputMode="decimal"
          placeholder="custom"
          value={custom}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "" || /^\d*\.?\d*$/.test(v)) {
              setCustom(v);
              const pct = parseFloat(v);
              if (!isNaN(pct) && pct > 0) onChange(Math.round(pct * 100));
            }
          }}
          className={`w-16 px-2 py-1 bg-transparent font-mono text-[10px] tabular-nums text-fg focus:outline-none placeholder:text-fg-ghost border-l border-border ${
            !isPreset && custom !== "" ? "bg-bg-hover" : ""
          }`}
        />
      </div>
    </div>
  );
}
