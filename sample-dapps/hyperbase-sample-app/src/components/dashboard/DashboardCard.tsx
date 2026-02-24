"use client";

import { useState, useEffect, useCallback } from "react";
import type { DashboardCard as DashboardCardType, QueryResult, VizType, Question } from "@/lib/types";
import VisualizationRenderer from "@/components/visualization/VisualizationRenderer";
import ChartTypePicker from "@/components/visualization/ChartTypePicker";
import TextCard from "./TextCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { generateSql } from "@/lib/sql-generator";
import { detectVizType, ensureValidVizType } from "@/lib/auto-viz";
import Link from "next/link";

interface DashboardCardProps {
  card: DashboardCardType;
  editing?: boolean;
  onRemove?: () => void;
  onTextChange?: (content: string) => void;
  filters?: Record<string, string>;
}

export default function DashboardCard({ card, editing, onRemove, onTextChange, filters }: DashboardCardProps) {
  const [result, setResult] = useState<QueryResult | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [vizType, setVizType] = useState<VizType>("table");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVizPicker, setShowVizPicker] = useState(false);

  const loadAndRun = useCallback(async () => {
    if (card.card_type !== "question" || !card.question_id) return;
    setLoading(true);
    setError(null);
    try {
      const qRes = await fetch(`/api/questions/${card.question_id}`);
      if (!qRes.ok) throw new Error(`Question not found (${qRes.status})`);
      const q: Question = await qRes.json();
      if ("error" in q) throw new Error(String((q as Record<string, unknown>).error));
      setQuestion(q);
      setVizType(q.viz_type as VizType);

      let sql = q.sql_text;
      if (!sql && q.query_json) {
        sql = generateSql(JSON.parse(q.query_json));
      }
      if (!sql) throw new Error("No query defined");

      // Apply dashboard time filters if present
      if (filters) {
        const timeFrom = filters["time_from"]?.replace("T", " ");
        const timeTo = filters["time_to"]?.replace("T", " ");
        if (timeFrom || timeTo) {
          const conditions: string[] = [];
          if (timeFrom) conditions.push(`timestamp >= '${timeFrom}'`);
          if (timeTo) conditions.push(`timestamp <= '${timeTo}'`);
          const whereClause = conditions.join(" AND ");
          if (/\bWHERE\b/i.test(sql)) {
            sql = sql.replace(/\bWHERE\b/i, `WHERE ${whereClause} AND`);
          } else {
            sql = sql.replace(/\bGROUP\b/i, `WHERE ${whereClause} GROUP`);
            if (!/\bWHERE\b/i.test(sql)) {
              sql = sql.replace(/\bORDER\b/i, `WHERE ${whereClause} ORDER`);
            }
            if (!/\bWHERE\b/i.test(sql)) {
              sql = sql.replace(/\bLIMIT\b/i, `WHERE ${whereClause} LIMIT`);
            }
          }
        }
      }

      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      });
      if (!res.ok) throw new Error(`Query failed (${res.status})`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      // Auto-correct viz type: use saved type if valid, otherwise auto-detect
      const savedViz = q.viz_type as VizType;
      setVizType(savedViz === "table" ? detectVizType(data) : ensureValidVizType(data, savedViz));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [card.card_type, card.question_id, filters]);

  useEffect(() => {
    loadAndRun();
  }, [loadAndRun]);

  // Text/Heading card
  if (card.card_type === "text" || card.card_type === "heading") {
    return (
      <div className="grid-card h-full relative group">
        {editing && onRemove && (
          <button onClick={onRemove} className="absolute top-2 right-2 w-5 h-5 rounded-full bg-foreground/10 text-foreground-light hover:bg-qn-red/20 hover:text-qn-red text-xs z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">x</button>
        )}
        <TextCard
          content={card.text_content || ""}
          cardType={card.card_type}
          editing={editing}
          onChange={onTextChange}
        />
      </div>
    );
  }

  // Question card
  return (
    <div className="grid-card h-full flex flex-col overflow-hidden relative group">
      {editing && onRemove && (
        <button onClick={onRemove} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-foreground/10 text-foreground-light hover:bg-qn-red/20 hover:text-qn-red text-xs z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">x</button>
      )}

      {/* Card header */}
      <div className="px-3 py-1.5 border-b border-border flex items-center justify-between shrink-0">
        <Link
          href={question ? `/question/${question.id}` : "#"}
          className="text-[11px] font-medium truncate hover:text-accent transition-colors"
        >
          {question?.name || `Question #${card.question_id}`}
        </Link>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {error && (
            <button onClick={loadAndRun} className="text-[10px] text-accent hover:underline">
              retry
            </button>
          )}
          {result && !error && (
            <button
              onClick={() => setShowVizPicker(!showVizPicker)}
              className="text-[10px] text-foreground-light hover:text-foreground font-mono"
            >
              {vizType}
            </button>
          )}
        </div>
      </div>

      {/* Viz picker dropdown */}
      {showVizPicker && (
        <div className="px-2 py-1 border-b border-border shrink-0">
          <ChartTypePicker value={vizType} onChange={(t) => { setVizType(t); setShowVizPicker(false); }} result={result} />
        </div>
      )}

      {/* Card content — fills remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {loading && <LoadingSpinner className="h-full" />}
        {error && !loading && (
          <div className="text-xs text-qn-red p-3 flex items-center justify-center h-full text-center">
            {error}
          </div>
        )}
        {result && !loading && !error && (
          <div className="h-full w-full">
            <VisualizationRenderer result={result} vizType={vizType} />
          </div>
        )}
      </div>
    </div>
  );
}
