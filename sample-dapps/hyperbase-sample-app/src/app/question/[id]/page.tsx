"use client";

import { useState, useEffect, useCallback, use } from "react";
import type { Question, QueryResult, VizType } from "@/lib/types";
import VisualizationRenderer from "@/components/visualization/VisualizationRenderer";
import ChartTypePicker from "@/components/visualization/ChartTypePicker";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { detectVizType, ensureValidVizType } from "@/lib/auto-viz";
import { generateSql } from "@/lib/sql-generator";
import Link from "next/link";

export default function QuestionViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [question, setQuestion] = useState<Question | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [vizType, setVizType] = useState<VizType>("table");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    fetch(`/api/questions/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setQuestion(data);
        setVizType(data.viz_type || "table");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const runQuery = useCallback(async () => {
    if (!question) return;
    setLoading(true);
    setError(null);
    try {
      let sql = question.sql_text;
      if (!sql && question.query_json) {
        const queryState = JSON.parse(question.query_json);
        sql = generateSql(queryState);
      }
      if (!sql) throw new Error("No query defined");

      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setVizType(vizType === "table" ? detectVizType(data) : ensureValidVizType(data, vizType));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setLoading(false);
    }
  }, [question, vizType]);

  useEffect(() => {
    if (question) runQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  if (loading && !result) return <LoadingSpinner className="h-64" />;
  if (error && !question) return <div className="p-8 text-qn-red">{error}</div>;
  if (!question) return null;

  const sqlText = question.sql_text || (question.query_json ? generateSql(JSON.parse(question.query_json)) : "");

  return (
    <div className="p-6">
      {/* Back button */}
      <Link href="/collection/root" className="inline-flex items-center gap-1.5 text-xs text-foreground-light hover:text-foreground font-mono mb-4 transition-colors">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="10,3 5,8 10,13" /></svg>
        BACK
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="label-mono mb-1">// Question</div>
          <h1 className="text-2xl font-semibold">{question.name}</h1>
          {question.description && (
            <p className="text-sm text-foreground-medium mt-1">{question.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSql(!showSql)}
            className="btn-secondary text-xs"
          >
            {showSql ? "Hide SQL" : "Show SQL"}
          </button>
          <Link href={`/question/new${question.query_type === "builder" && question.query_json ? `?table=${JSON.parse(question.query_json).table}` : ""}`} className="btn-secondary text-xs">
            Edit
          </Link>
          <button onClick={runQuery} disabled={loading} className="btn-primary h-9 text-xs px-4">
            {loading ? "Running..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* SQL */}
      {showSql && sqlText && (
        <pre className="mb-4 p-4 rounded-lg bg-grid text-xs font-mono overflow-x-auto step-card">
          {sqlText}
        </pre>
      )}

      {/* Error */}
      {error && <div className="mb-4 p-4 text-qn-red text-sm font-mono step-card">{error}</div>}

      {/* Results */}
      {result && (
        <div className="step-card">
          <div className="flex items-center justify-between mb-4 px-4 pt-4">
            <div className="text-xs text-foreground-light font-mono">
              {result.metadata.row_count} rows · {result.metadata.execution_time_ms}ms
            </div>
            <ChartTypePicker value={vizType} onChange={setVizType} result={result} />
          </div>
          <div className={`px-4 pb-4 ${vizType !== "table" && vizType !== "number" ? "h-[420px]" : ""}`}>
            <VisualizationRenderer result={result} vizType={vizType} />
          </div>
        </div>
      )}
    </div>
  );
}
