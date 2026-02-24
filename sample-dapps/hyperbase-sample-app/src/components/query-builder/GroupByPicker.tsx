"use client";

import type { GroupBy, ColumnInfo, DateBucket } from "@/lib/types";
import { DATE_BUCKETS } from "@/lib/constants";

interface GroupByPickerProps {
  groupBy: GroupBy[];
  columns: ColumnInfo[];
  onChange: (groupBy: GroupBy[]) => void;
}

function isDateColumn(col: ColumnInfo): boolean {
  const t = col.type.toLowerCase();
  return t.includes("date") || t.includes("time");
}

export default function GroupByPicker({ groupBy, columns, onChange }: GroupByPickerProps) {
  const addGroupBy = () => {
    const first = columns[0];
    if (!first) return;
    onChange([...groupBy, {
      column: first.name,
      dateBucket: isDateColumn(first) ? "day" : undefined,
    }]);
  };

  const update = (index: number, gb: GroupBy) => {
    const next = [...groupBy];
    next[index] = gb;
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(groupBy.filter((_, i) => i !== index));
  };

  return (
    <div className="step-card">
      <div className="flex items-center justify-between mb-3">
        <div className="label-mono">// Group by</div>
        <button onClick={addGroupBy} className="text-xs text-accent hover:underline">
          + Add group
        </button>
      </div>
      {groupBy.length === 0 ? (
        <div className="text-xs text-foreground-light">No grouping</div>
      ) : (
        <div className="space-y-2">
          {groupBy.map((gb, i) => {
            const col = columns.find((c) => c.name === gb.column);
            const showBucket = col && isDateColumn(col);
            return (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={gb.column}
                  onChange={(e) => {
                    const newCol = columns.find((c) => c.name === e.target.value);
                    update(i, {
                      column: e.target.value,
                      dateBucket: newCol && isDateColumn(newCol) ? "day" : undefined,
                    });
                  }}
                  className="input-ring text-xs font-mono"
                >
                  {columns.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>

                {showBucket && (
                  <select
                    value={gb.dateBucket || "day"}
                    onChange={(e) => update(i, { ...gb, dateBucket: e.target.value as DateBucket })}
                    className="input-ring text-xs"
                  >
                    {DATE_BUCKETS.map((b) => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                )}

                <button onClick={() => remove(i)} className="text-foreground-light hover:text-qn-red text-sm ml-1">
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
