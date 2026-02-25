"use client";

import type { Sort, ColumnInfo } from "@/lib/types";

interface SortStepProps {
  sort: Sort[];
  columns: ColumnInfo[];
  onChange: (sort: Sort[]) => void;
}

export default function SortStep({ sort, columns, onChange }: SortStepProps) {
  const addSort = () => {
    const first = columns[0];
    if (!first) return;
    onChange([...sort, { column: first.name, direction: "desc" }]);
  };

  const update = (index: number, s: Sort) => {
    const next = [...sort];
    next[index] = s;
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(sort.filter((_, i) => i !== index));
  };

  return (
    <div className="step-card">
      <div className="flex items-center justify-between mb-3">
        <div className="label-mono">// Sort</div>
        <button onClick={addSort} className="text-xs text-accent hover:underline">
          + Add sort
        </button>
      </div>
      {sort.length === 0 ? (
        <div className="text-xs text-foreground-light">Default order</div>
      ) : (
        <div className="space-y-2">
          {sort.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={s.column}
                onChange={(e) => update(i, { ...s, column: e.target.value })}
                className="input-ring text-xs font-mono"
              >
                {columns.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              <select
                value={s.direction}
                onChange={(e) => update(i, { ...s, direction: e.target.value as "asc" | "desc" })}
                className="input-ring text-xs"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <button onClick={() => remove(i)} className="text-foreground-light hover:text-qn-red text-sm ml-1">
                x
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
