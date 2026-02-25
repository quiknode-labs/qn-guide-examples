"use client";

import { useState, useEffect } from "react";
import type { TableInfo } from "@/lib/types";
import SearchInput from "@/components/shared/SearchInput";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import TableDetail from "./TableDetail";

export default function SchemaExplorer() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/schema")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setTables(data.tables || []);
        if (data.tables?.length > 0) setSelectedTable(data.tables[0].name);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="h-64" />;
  if (error) return <div className="p-8 text-qn-red">{error}</div>;

  const filtered = tables.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );
  const selected = tables.find((t) => t.name === selectedTable);

  return (
    <div className="flex h-[calc(100vh-2rem)]">
      {/* Table list */}
      <div className="w-72 min-w-72 border-r border-border overflow-y-auto p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter tables..."
          className="mb-3"
        />
        <div className="space-y-0.5">
          {filtered.map((t) => (
            <button
              key={t.name}
              onClick={() => setSelectedTable(t.name)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedTable === t.name
                  ? "nav-active font-medium"
                  : "text-foreground-medium hover:bg-grid hover:text-foreground"
              }`}
            >
              <div className="font-mono text-xs truncate">{t.name}</div>
              {t.row_count !== undefined && t.row_count > 0 && (
                <div className="text-xs text-foreground-light mt-0.5">
                  {t.row_count.toLocaleString()} rows
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table detail */}
      <div className="flex-1 overflow-y-auto p-6">
        {selected ? (
          <TableDetail table={selected} />
        ) : (
          <div className="text-foreground-light text-center mt-20">
            Select a table to view its schema
          </div>
        )}
      </div>
    </div>
  );
}
