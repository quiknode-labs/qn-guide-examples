"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import SQLEditor from "@/components/sql-editor/SQLEditor";
import SchemaReference from "@/components/sql-editor/SchemaReference";
import ResultsTable from "@/components/visualization/ResultsTable";
import VisualizationRenderer from "@/components/visualization/VisualizationRenderer";
import ChartTypePicker from "@/components/visualization/ChartTypePicker";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Modal from "@/components/shared/Modal";
import { detectVizType } from "@/lib/auto-viz";
import type { QueryResult, TableInfo, VizType } from "@/lib/types";

export default function SQLPage() {
  const router = useRouter();
  const [sqlText, setSqlText] = useState("SELECT coin, count() AS trades, sum(price * size) AS volume_usd\nFROM hyperliquid_trades\nWHERE timestamp > now() - INTERVAL 7 DAY\nGROUP BY coin\nORDER BY trades DESC\nLIMIT 10");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [vizType, setVizType] = useState<VizType>("table");
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

  const executeQuery = useCallback(async () => {
    if (!sqlText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: sqlText }),
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
  }, [sqlText]);

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
          query_type: "sql",
          sql_text: sqlText,
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
    <div className="flex h-[calc(100vh-1rem)]">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="flex items-center justify-center w-7 h-7 rounded-md text-foreground-light hover:text-foreground hover:bg-grid transition-colors shrink-0">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="10,3 5,8 10,13" /></svg>
            </button>
            <div className="label-mono">// SQL Query</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSaveOpen(true); setSaveError(null); }}
              className="btn-secondary text-xs"
            >
              Save
            </button>
            <button onClick={executeQuery} disabled={loading} className="btn-primary h-9 text-xs px-4">
              {loading ? "Running..." : "Run"}
              <span className="ml-2 text-[10px] opacity-60">Cmd+Enter</span>
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="h-[280px] min-h-[200px]">
          <SQLEditor
            value={sqlText}
            onChange={setSqlText}
            onExecute={executeQuery}
            tables={tables}
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto border-t border-border">
          {loading && <LoadingSpinner className="h-32" />}
          {error && (
            <div className="p-4 text-qn-red text-sm font-mono">{error}</div>
          )}
          {result && !loading && (
            <div>
              <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                <div className="text-xs text-foreground-light font-mono">
                  {result.metadata.row_count} rows · {result.metadata.execution_time_ms}ms
                </div>
                <ChartTypePicker value={vizType} onChange={setVizType} result={result} />
              </div>
              {vizType === "table" ? (
                <ResultsTable result={result} />
              ) : (
                <div className="p-4 h-[420px]">
                  <VisualizationRenderer result={result} vizType={vizType} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schema Reference */}
      <SchemaReference />

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
