"use client";

import { useState } from "react";
import type { TableInfo } from "@/lib/types";
import SearchInput from "@/components/shared/SearchInput";

interface TablePickerProps {
  tables: TableInfo[];
  selected: string;
  onChange: (table: string) => void;
}

export default function TablePicker({ tables, selected, onChange }: TablePickerProps) {
  const [search, setSearch] = useState("");

  const filtered = tables.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="step-card">
      <div className="label-mono mb-3">// Pick a table</div>
      <SearchInput value={search} onChange={setSearch} placeholder="Search tables..." className="mb-3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-0.5">
        {filtered.map((t) => (
          <button
            key={t.name}
            onClick={() => onChange(t.name)}
            className={`text-left p-3 rounded-lg transition-colors border ${
              selected === t.name
                ? "bg-accent/10 border-accent"
                : "hover:bg-grid border-border"
            }`}
          >
            <div className="font-mono text-xs font-medium">{t.name}</div>
            {t.description && (
              <div className="text-xs text-foreground-light mt-1 line-clamp-2">{t.description}</div>
            )}
            {t.row_count !== undefined && t.row_count > 0 && (
              <div className="text-[10px] text-foreground-light mt-1 font-mono">
                {t.row_count.toLocaleString()} rows
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
