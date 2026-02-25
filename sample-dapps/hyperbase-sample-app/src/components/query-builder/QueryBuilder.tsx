"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { QueryState, QueryResult, TableInfo, VizType } from "@/lib/types";
import { generateSql } from "@/lib/sql-generator";
import { detectVizType } from "@/lib/auto-viz";
import TablePicker from "./TablePicker";
import ColumnPicker from "./ColumnPicker";
import FilterBuilder from "./FilterBuilder";
import SummarizeStep from "./SummarizeStep";
import GroupByPicker from "./GroupByPicker";
import SortStep from "./SortStep";
import LimitStep from "./LimitStep";
import RevealSQL from "./RevealSQL";
import VisualizationRenderer from "@/components/visualization/VisualizationRenderer";
import ChartTypePicker from "@/components/visualization/ChartTypePicker";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Modal from "@/components/shared/Modal";

interface QueryBuilderProps {
  initialTable?: string;
  initialQuery?: QueryState;
}

const emptyQuery: QueryState = {
  table: "",
  columns: [],
  filters: [],
  summarize: [],
  groupBy: [],
  sort: [],
  limit: null,
};

export default function QueryBuilder({ initialTable, initialQuery }: QueryBuilderProps) {
  const router = useRouter();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [query, setQuery] = useState<QueryState>(initialQuery || { ...emptyQuery, table: initialTable || "" });
  const [result, setResult] = useState<QueryResult | null>(null);
  const [vizType, setVizType] = useState<VizType>("table");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/schema")
      .then((r) => r.json())
      .then((data) => setTables(data.tables || []))
      .catch(() => {});
  }, []);

  const selectedTable = tables.find((t) => t.name === query.table);
  const columns = selectedTable?.columns || [];
  const sql = query.table ? generateSql(query) : "";

  const executeQuery = useCallback(async () => {
    if (!sql) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setVizType(detectVizType(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [sql]);

  const handleSave = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: saveName,
          query_type: "builder",
          query_json: query,
          sql_text: sql,
          viz_type: vizType,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to save question");
      }
      setSaveOpen(false);
      setSaveName("");
      router.push(`/question/${data.id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Steps */}
      <div className="space-y-4 mb-6">
        <TablePicker
          tables={tables}
          selected={query.table}
          onChange={(table) => setQuery({ ...emptyQuery, table })}
        />

        {query.table && (
          <>
            <ColumnPicker
              columns={columns}
              selected={query.columns}
              onChange={(cols) => setQuery({ ...query, columns: cols })}
            />

            <FilterBuilder
              filters={query.filters}
              columns={columns}
              onChange={(filters) => setQuery({ ...query, filters })}
            />

            <SummarizeStep
              aggregations={query.summarize}
              columns={columns}
              onChange={(summarize) => setQuery({ ...query, summarize })}
            />

            {query.summarize.length > 0 && (
              <GroupByPicker
                groupBy={query.groupBy}
                columns={columns}
                onChange={(groupBy) => setQuery({ ...query, groupBy })}
              />
            )}

            <SortStep
              sort={query.sort}
              columns={columns}
              onChange={(sort) => setQuery({ ...query, sort })}
            />

            <LimitStep
              limit={query.limit}
              onChange={(limit) => setQuery({ ...query, limit })}
            />

            <RevealSQL sql={sql} />

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button onClick={executeQuery} disabled={loading} className="btn-primary">
                {loading ? "Running..." : "Visualize"}
              </button>
              <button onClick={() => { setSaveOpen(true); setSaveError(null); }} className="btn-secondary">
                Save
              </button>
            </div>
          </>
        )}
      </div>

      {/* Results */}
      {loading && <LoadingSpinner className="h-32" />}
      {error && <div className="p-4 text-qn-red text-sm font-mono step-card">{error}</div>}
      {result && !loading && (
        <div className="step-card">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-foreground-light font-mono">
              {result.metadata.row_count} rows · {result.metadata.execution_time_ms}ms
            </div>
            <ChartTypePicker value={vizType} onChange={setVizType} result={result} />
          </div>
          <div className={vizType !== "table" && vizType !== "number" ? "h-[420px]" : ""}>
            <VisualizationRenderer result={result} vizType={vizType} />
          </div>
        </div>
      )}

      {/* Save Modal */}
      <Modal open={saveOpen} onClose={() => setSaveOpen(false)} title="Save Question">
        <div className="space-y-3">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Question name..."
            className="input-ring w-full"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          {saveError && (
            <div className="text-xs text-qn-red font-mono">{saveError}</div>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={() => setSaveOpen(false)} className="btn-secondary text-sm" disabled={saving}>
              Cancel
            </button>
            <button onClick={handleSave} className="btn-primary h-10 text-sm" disabled={saving || !saveName.trim()}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
