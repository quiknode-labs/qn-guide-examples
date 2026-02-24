"use client";

import { DEFAULT_LIMIT, MAX_LIMIT } from "@/lib/constants";

interface LimitStepProps {
  limit: number | null;
  onChange: (limit: number | null) => void;
}

export default function LimitStep({ limit, onChange }: LimitStepProps) {
  return (
    <div className="step-card">
      <div className="label-mono mb-3">// Limit</div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={limit ?? DEFAULT_LIMIT}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            onChange(isNaN(val) ? null : Math.min(val, MAX_LIMIT));
          }}
          min={1}
          max={MAX_LIMIT}
          className="input-ring text-xs font-mono w-28"
        />
        <span className="text-xs text-foreground-light">rows (max {MAX_LIMIT.toLocaleString()})</span>
      </div>
    </div>
  );
}
