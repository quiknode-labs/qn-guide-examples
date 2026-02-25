"use client";

import { useState, useEffect } from "react";
import type { TableInfo } from "@/lib/types";
import SearchInput from "@/components/shared/SearchInput";

interface SchemaReferenceProps {
  onInsert?: (text: string) => void;
}

export default function SchemaReference({ onInsert }: SchemaReferenceProps) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/schema")
      .then((r) => r.json())
      .then((data) => setTables(data.tables || []))
      .catch(() => {});
  }, []);

  const filtered = tables.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-60 min-w-60 border-l border-border overflow-y-auto">
      <div className="p-3">
        <div className="label-mono mb-2">// Tables</div>
        <SearchInput value={search} onChange={setSearch} placeholder="Filter..." className="text-xs" />
      </div>
      <div className="px-2 pb-4">
        {filtered.map((t) => (
          <div key={t.name}>
            <button
              onClick={() => setExpanded(expanded === t.name ? null : t.name)}
              className="w-full text-left px-2 py-1.5 rounded text-xs font-mono hover:bg-grid transition-colors flex items-center justify-between group"
            >
              <span className="truncate">{t.name}</span>
              <span className="text-foreground-light text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                {expanded === t.name ? "-" : "+"}
              </span>
            </button>
            {expanded === t.name && (
              <div className="ml-3 border-l border-border pl-2 mb-1">
                {t.columns.map((col) => (
                  <button
                    key={col.name}
                    onClick={() => onInsert?.(col.name)}
                    className="w-full text-left px-2 py-1 text-xs font-mono text-foreground-medium hover:text-foreground hover:bg-grid rounded transition-colors flex items-center justify-between"
                  >
                    <span>{col.name}</span>
                    <span className="text-[10px] text-foreground-light">{col.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
