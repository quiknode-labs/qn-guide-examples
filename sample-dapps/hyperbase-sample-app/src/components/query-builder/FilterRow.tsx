"use client";

import type { Filter, FilterOperator, ColumnInfo } from "@/lib/types";
import { FILTER_OPERATORS } from "@/lib/constants";

interface FilterRowProps {
  filter: Filter;
  columns: ColumnInfo[];
  onChange: (filter: Filter) => void;
  onRemove: () => void;
}

function inferFilterType(colType: string): Filter["type"] {
  const t = colType.toLowerCase();
  if (t.includes("int") || t.includes("float") || t.includes("decimal")) return "number";
  if (t.includes("date") || t.includes("time")) return "date";
  if (t.includes("bool")) return "boolean";
  return "text";
}

export default function FilterRow({ filter, columns, onChange, onRemove }: FilterRowProps) {
  const operators = FILTER_OPERATORS[filter.type] || FILTER_OPERATORS.text;
  const needsValue = !["is_null", "not_null"].includes(filter.operator);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Column */}
      <select
        value={filter.column}
        onChange={(e) => {
          const col = columns.find((c) => c.name === e.target.value);
          const type = col ? inferFilterType(col.type) : "text";
          onChange({ ...filter, column: e.target.value, type });
        }}
        className="input-ring text-xs font-mono"
      >
        <option value="">Column...</option>
        {columns.map((c) => (
          <option key={c.name} value={c.name}>{c.name}</option>
        ))}
      </select>

      {/* Operator */}
      <select
        value={filter.operator}
        onChange={(e) => onChange({ ...filter, operator: e.target.value as FilterOperator })}
        className="input-ring text-xs"
      >
        {operators.map((op) => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </select>

      {/* Value */}
      {needsValue && filter.operator === "between" ? (
        <div className="flex items-center gap-1">
          <input
            type={filter.type === "date" ? "date" : "text"}
            value={Array.isArray(filter.value) ? String(filter.value[0]) : ""}
            onChange={(e) => onChange({
              ...filter,
              value: [e.target.value, Array.isArray(filter.value) ? filter.value[1] : ""] as [string, string],
            })}
            className="input-ring text-xs w-28"
            placeholder="from"
          />
          <span className="text-xs text-foreground-light">and</span>
          <input
            type={filter.type === "date" ? "date" : "text"}
            value={Array.isArray(filter.value) ? String(filter.value[1]) : ""}
            onChange={(e) => onChange({
              ...filter,
              value: [Array.isArray(filter.value) ? filter.value[0] : "", e.target.value] as [string, string],
            })}
            className="input-ring text-xs w-28"
            placeholder="to"
          />
        </div>
      ) : needsValue ? (
        <input
          type={filter.type === "number" ? "number" : filter.type === "date" ? "date" : "text"}
          value={typeof filter.value === "string" || typeof filter.value === "number" ? filter.value : ""}
          onChange={(e) => onChange({
            ...filter,
            value: filter.type === "number" ? Number(e.target.value) : e.target.value,
          })}
          className="input-ring text-xs w-40"
          placeholder="Value..."
        />
      ) : null}

      {/* Remove */}
      <button onClick={onRemove} className="text-foreground-light hover:text-qn-red text-sm ml-1">
        x
      </button>
    </div>
  );
}

export { inferFilterType };
