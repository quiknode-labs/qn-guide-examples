"use client";

import type { VizType, QueryResult } from "@/lib/types";
import { getValidVizTypes } from "@/lib/auto-viz";

interface ChartTypePickerProps {
  value: VizType;
  onChange: (type: VizType) => void;
  result?: QueryResult | null;
}

function ChartIcon({ type }: { type: VizType }) {
  const s = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (type) {
    case "table":
      return (
        <svg {...s}><rect x="2" y="2" width="12" height="12" rx="1" /><line x1="2" y1="5.5" x2="14" y2="5.5" /><line x1="2" y1="8.5" x2="14" y2="8.5" /><line x1="2" y1="11.5" x2="14" y2="11.5" /><line x1="6" y1="2" x2="6" y2="14" /><line x1="10.5" y1="2" x2="10.5" y2="14" /></svg>
      );
    case "line":
      return (
        <svg {...s}><polyline points="2,12 5,7 8,9 11,4 14,6" /><line x1="2" y1="14" x2="14" y2="14" /><line x1="2" y1="2" x2="2" y2="14" /></svg>
      );
    case "bar":
      return (
        <svg {...s}><rect x="2" y="8" width="2.5" height="6" rx="0.5" fill="currentColor" opacity="0.4" /><rect x="5.5" y="5" width="2.5" height="9" rx="0.5" fill="currentColor" opacity="0.6" /><rect x="9" y="3" width="2.5" height="11" rx="0.5" fill="currentColor" opacity="0.8" /><rect x="12.5" y="6" width="2.5" height="8" rx="0.5" fill="currentColor" /></svg>
      );
    case "area":
      return (
        <svg {...s}><path d="M2,12 L5,7 L8,9 L11,4 L14,6 L14,14 L2,14 Z" fill="currentColor" opacity="0.15" /><polyline points="2,12 5,7 8,9 11,4 14,6" /></svg>
      );
    case "pie":
      return (
        <svg {...s}><circle cx="8" cy="8" r="5.5" /><path d="M8,8 L8,2.5" /><path d="M8,8 L12.5,10.5" /></svg>
      );
    case "number":
      return (
        <svg {...s}><rect x="3" y="4" width="10" height="8" rx="1.5" /><line x1="5.5" y1="7" x2="10.5" y2="7" strokeWidth="2" /><line x1="6.5" y1="10" x2="9.5" y2="10" strokeWidth="1" opacity="0.5" /></svg>
      );
    default:
      return null;
  }
}

const VIZ_OPTIONS: { value: VizType; label: string }[] = [
  { value: "table", label: "Table" },
  { value: "line", label: "Line" },
  { value: "bar", label: "Bar" },
  { value: "area", label: "Area" },
  { value: "pie", label: "Pie" },
  { value: "number", label: "Number" },
];

export default function ChartTypePicker({ value, onChange, result }: ChartTypePickerProps) {
  // Map legacy "trend" to "number"
  const effectiveValue = value === ("trend" as string) ? "number" : value;

  const validTypes = result ? getValidVizTypes(result) : null;

  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-full" style={{ boxShadow: "inset 0 0 0 1px var(--border)" }}>
      {VIZ_OPTIONS.map((opt) => {
        const isValid = !validTypes || validTypes.includes(opt.value);
        const isActive = effectiveValue === opt.value;

        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${
              isActive
                ? "bg-foreground text-background"
                : isValid
                  ? "text-foreground-light hover:text-foreground hover:bg-grid"
                  : "text-foreground-light/25 cursor-not-allowed"
            }`}
            title={isValid ? opt.label : `${opt.label} (not suited for this data)`}
            disabled={!isValid && !isActive}
          >
            <ChartIcon type={opt.value} />
          </button>
        );
      })}
    </div>
  );
}
