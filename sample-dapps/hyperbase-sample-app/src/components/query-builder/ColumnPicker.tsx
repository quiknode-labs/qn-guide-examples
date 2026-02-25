"use client";

import type { ColumnInfo } from "@/lib/types";
import Badge from "@/components/shared/Badge";

interface ColumnPickerProps {
  columns: ColumnInfo[];
  selected: string[];
  onChange: (columns: string[]) => void;
}

export default function ColumnPicker({ columns, selected, onChange }: ColumnPickerProps) {
  const allSelected = selected.length === 0;

  const toggle = (colName: string) => {
    if (allSelected) {
      // Switch from "all" to "all except this one"
      onChange(columns.filter((c) => c.name !== colName).map((c) => c.name));
    } else if (selected.includes(colName)) {
      const next = selected.filter((c) => c !== colName);
      onChange(next.length === 0 ? [] : next); // empty = all
    } else {
      onChange([...selected, colName]);
    }
  };

  return (
    <div className="step-card">
      <div className="flex items-center justify-between mb-3">
        <div className="label-mono">// Pick columns</div>
        <button
          onClick={() => onChange([])}
          className="text-xs text-accent hover:underline"
        >
          {allSelected ? "All selected" : "Select all"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {columns.map((col) => {
          const isSelected = allSelected || selected.includes(col.name);
          return (
            <button
              key={col.name}
              onClick={() => toggle(col.name)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-mono transition-colors ${
                isSelected
                  ? "bg-accent/10 text-accent ring-1 ring-accent/30"
                  : "text-foreground-light ring-1 ring-border hover:ring-foreground-light"
              }`}
            >
              {col.name}
              <Badge>{col.type}</Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
