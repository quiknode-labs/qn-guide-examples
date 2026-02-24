"use client";

import { useState, useEffect } from "react";
import type { Question, VizType } from "@/lib/types";
import Modal from "@/components/shared/Modal";
import SearchInput from "@/components/shared/SearchInput";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

interface AddCardModalProps {
  open: boolean;
  onClose: () => void;
  onAddQuestion: (questionId: number) => void;
  onAddText: (type: "text" | "heading") => void;
}

function VizIcon({ type }: { type: VizType }) {
  const s = { width: 14, height: 14, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (type) {
    case "table":
      return <svg {...s}><rect x="2" y="2" width="12" height="12" rx="1" /><line x1="2" y1="6" x2="14" y2="6" /><line x1="2" y1="10" x2="14" y2="10" /><line x1="7" y1="2" x2="7" y2="14" /></svg>;
    case "line":
      return <svg {...s}><polyline points="2,12 5,7 8,9 11,4 14,6" /><line x1="2" y1="14" x2="14" y2="14" /></svg>;
    case "bar":
      return <svg {...s}><rect x="3" y="8" width="2" height="6" rx="0.5" fill="currentColor" opacity="0.5" /><rect x="7" y="4" width="2" height="10" rx="0.5" fill="currentColor" opacity="0.7" /><rect x="11" y="6" width="2" height="8" rx="0.5" fill="currentColor" /></svg>;
    case "area":
      return <svg {...s}><path d="M2,12 L5,7 L8,9 L11,4 L14,6 L14,14 L2,14 Z" fill="currentColor" opacity="0.15" /><polyline points="2,12 5,7 8,9 11,4 14,6" /></svg>;
    case "pie":
      return <svg {...s}><circle cx="8" cy="8" r="5.5" /><path d="M8,8 L8,2.5" /><path d="M8,8 L12.5,10.5" /></svg>;
    case "number":
      return <svg {...s}><rect x="3" y="4" width="10" height="8" rx="1.5" /><line x1="5.5" y1="7" x2="10.5" y2="7" strokeWidth="2" /><line x1="6.5" y1="10" x2="9.5" y2="10" strokeWidth="1" opacity="0.5" /></svg>;
    default:
      return <svg {...s}><rect x="2" y="2" width="12" height="12" rx="1" /></svg>;
  }
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function AddCardModal({ open, onClose, onAddQuestion, onAddText }: AddCardModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch("/api/questions")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load questions");
        return r.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        const list = Array.isArray(data) ? data : [];
        // Sort by most recently updated
        list.sort((a: Question, b: Question) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setQuestions(list);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load questions"))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = questions.filter((q) =>
    q.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal open={open} onClose={onClose} title="Add to Dashboard">
      <div className="space-y-4">
        {/* Quick add options */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { onAddText("heading"); onClose(); }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-grid transition-colors"
            style={{ boxShadow: "inset 0 0 0 1px var(--border)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 3h10M5 3v10M11 3v10M5 8h6" />
            </svg>
            <span>Heading</span>
          </button>
          <button
            onClick={() => { onAddText("text"); onClose(); }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-grid transition-colors"
            style={{ boxShadow: "inset 0 0 0 1px var(--border)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="2" y1="4" x2="14" y2="4" /><line x1="2" y1="7" x2="14" y2="7" /><line x1="2" y1="10" x2="10" y2="10" /><line x1="2" y1="13" x2="8" y2="13" />
            </svg>
            <span>Text / Markdown</span>
          </button>
        </div>

        <div className="border-t border-border pt-3">
          <div className="label-mono mb-2">// Saved Questions</div>
          <SearchInput value={search} onChange={setSearch} placeholder="Search questions..." className="mb-3" />

          {loading && <LoadingSpinner className="py-6" />}
          {error && <div className="text-xs text-qn-red font-mono py-4">{error}</div>}

          {!loading && !error && (
            <div className="space-y-1 max-h-[340px] overflow-y-auto">
              {filtered.map((q) => (
                <button
                  key={q.id}
                  onClick={() => { onAddQuestion(q.id); onClose(); }}
                  className="w-full text-left px-3 py-3 rounded-lg hover:bg-grid transition-colors flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-foreground-light group-hover:text-accent transition-colors" style={{ boxShadow: "inset 0 0 0 1px var(--border)" }}>
                    <VizIcon type={q.viz_type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate group-hover:text-accent transition-colors">{q.name}</div>
                    <div className="text-[10px] text-foreground-light font-mono mt-0.5 flex items-center gap-2">
                      <span className="uppercase">{q.viz_type}</span>
                      <span>·</span>
                      <span>{q.query_type === "sql" ? "SQL" : "Builder"}</span>
                      {q.updated_at && (
                        <>
                          <span>·</span>
                          <span>{timeAgo(q.updated_at)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-8">
                  <div className="flex justify-center gap-2 mb-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-foreground-light opacity-30" />
                    ))}
                  </div>
                  <div className="text-xs text-foreground-light">
                    {questions.length === 0
                      ? "No saved questions yet. Create a question from the SQL editor or Query Builder first."
                      : "No questions match your search."}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
