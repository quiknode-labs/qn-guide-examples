"use client";

import { useState } from "react";

interface RevealSQLProps {
  sql: string;
}

export default function RevealSQL({ sql }: RevealSQLProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="step-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-accent hover:underline font-mono"
      >
        {open ? "- Hide SQL" : "+ Show SQL"}
      </button>
      {open && (
        <pre className="mt-3 p-3 rounded-lg bg-grid text-xs font-mono overflow-x-auto whitespace-pre-wrap">
          {sql}
        </pre>
      )}
    </div>
  );
}
