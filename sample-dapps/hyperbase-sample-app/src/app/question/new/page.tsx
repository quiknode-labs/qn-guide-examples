"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import QueryBuilder from "@/components/query-builder/QueryBuilder";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

function NewQuestionContent() {
  const searchParams = useSearchParams();
  const initialTable = searchParams.get("table") || "";
  const [mode, setMode] = useState<"pick" | "builder">(initialTable ? "builder" : "pick");

  if (mode === "pick") {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Link href="/collection/root" className="inline-flex items-center gap-1.5 text-xs text-foreground-light hover:text-foreground font-mono mb-4 transition-colors">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="10,3 5,8 10,13" /></svg>
          BACK
        </Link>
        <div className="label-mono mb-6">// New Question</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setMode("builder")}
            className="card p-6 text-left hover:bg-grid transition-colors"
          >
            <div className="text-2xl mb-2 font-mono">{"{}"}</div>
            <div className="font-semibold mb-1">Simple Question</div>
            <div className="text-sm text-foreground-medium">
              Pick a table, choose columns, add filters — no SQL needed.
            </div>
          </button>
          <Link
            href="/sql"
            className="card p-6 text-left hover:bg-grid transition-colors"
          >
            <div className="text-2xl mb-2 font-mono">{">"}</div>
            <div className="font-semibold mb-1">SQL Query</div>
            <div className="text-sm text-foreground-medium">
              Write ClickHouse SQL directly with autocomplete and schema reference.
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setMode("pick")} className="text-foreground-light hover:text-foreground text-sm">
          &lt; Back
        </button>
        <div className="label-mono">// Simple Question</div>
      </div>
      <QueryBuilder initialTable={initialTable} />
    </div>
  );
}

export default function NewQuestionPage() {
  return (
    <Suspense fallback={<LoadingSpinner className="h-64" />}>
      <NewQuestionContent />
    </Suspense>
  );
}
