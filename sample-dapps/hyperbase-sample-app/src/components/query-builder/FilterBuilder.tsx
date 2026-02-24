"use client";

import type { Filter, ColumnInfo } from "@/lib/types";
import FilterRow, { inferFilterType } from "./FilterRow";

interface FilterBuilderProps {
  filters: Filter[];
  columns: ColumnInfo[];
  onChange: (filters: Filter[]) => void;
}

export default function FilterBuilder({ filters, columns, onChange }: FilterBuilderProps) {
  const addFilter = () => {
    const firstCol = columns[0];
    const type = firstCol ? inferFilterType(firstCol.type) : "text";
    onChange([
      ...filters,
      { column: firstCol?.name || "", operator: "eq", value: "", type },
    ]);
  };

  const updateFilter = (index: number, filter: Filter) => {
    const next = [...filters];
    next[index] = filter;
    onChange(next);
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  return (
    <div className="step-card">
      <div className="flex items-center justify-between mb-3">
        <div className="label-mono">// Filter</div>
        <button onClick={addFilter} className="text-xs text-accent hover:underline">
          + Add filter
        </button>
      </div>
      {filters.length === 0 ? (
        <div className="text-xs text-foreground-light">No filters applied</div>
      ) : (
        <div className="space-y-2">
          {filters.map((f, i) => (
            <FilterRow
              key={i}
              filter={f}
              columns={columns}
              onChange={(updated) => updateFilter(i, updated)}
              onRemove={() => removeFilter(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
