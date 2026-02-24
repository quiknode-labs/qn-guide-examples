"use client";

import type { Aggregation, ColumnInfo, AggregationFn } from "@/lib/types";
import { AGGREGATION_FNS } from "@/lib/constants";

interface SummarizeStepProps {
  aggregations: Aggregation[];
  columns: ColumnInfo[];
  onChange: (aggregations: Aggregation[]) => void;
}

export default function SummarizeStep({ aggregations, columns, onChange }: SummarizeStepProps) {
  const numericColumns = columns.filter((c) => {
    const t = c.type.toLowerCase();
    return t.includes("int") || t.includes("float") || t.includes("decimal");
  });

  const addAggregation = () => {
    onChange([...aggregations, { fn: "count" }]);
  };

  const updateAgg = (index: number, agg: Aggregation) => {
    const next = [...aggregations];
    next[index] = agg;
    onChange(next);
  };

  const removeAgg = (index: number) => {
    onChange(aggregations.filter((_, i) => i !== index));
  };

  return (
    <div className="step-card">
      <div className="flex items-center justify-between mb-3">
        <div className="label-mono">// Summarize</div>
        <button onClick={addAggregation} className="text-xs text-accent hover:underline">
          + Add metric
        </button>
      </div>
      {aggregations.length === 0 ? (
        <div className="text-xs text-foreground-light">Click &quot;+ Add metric&quot; to aggregate data</div>
      ) : (
        <div className="space-y-2">
          {aggregations.map((agg, i) => {
            const fnDef = AGGREGATION_FNS.find((f) => f.value === agg.fn);
            return (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={agg.fn}
                  onChange={(e) => updateAgg(i, { ...agg, fn: e.target.value as AggregationFn })}
                  className="input-ring text-xs"
                >
                  {AGGREGATION_FNS.map((fn) => (
                    <option key={fn.value} value={fn.value}>{fn.label}</option>
                  ))}
                </select>

                {fnDef?.needsColumn && (
                  <select
                    value={agg.column || ""}
                    onChange={(e) => updateAgg(i, { ...agg, column: e.target.value || undefined })}
                    className="input-ring text-xs font-mono"
                  >
                    <option value="">Column...</option>
                    {(agg.fn === "count_distinct" ? columns : numericColumns).map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                )}

                <button onClick={() => removeAgg(i)} className="text-foreground-light hover:text-qn-red text-sm ml-1">
                  x
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
