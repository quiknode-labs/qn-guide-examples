"use client";

import { useRef, useEffect, useCallback } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { sql } from "@codemirror/lang-sql";
import { autocompletion, type CompletionContext } from "@codemirror/autocomplete";
import type { TableInfo } from "@/lib/types";

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  tables?: TableInfo[];
  className?: string;
}

export default function SQLEditor({ value, onChange, onExecute, tables = [], className = "" }: SQLEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onExecuteRef = useRef(onExecute);
  onChangeRef.current = onChange;
  onExecuteRef.current = onExecute;

  const completionSource = useCallback(
    (context: CompletionContext) => {
      const word = context.matchBefore(/\w*/);
      if (!word || (word.from === word.to && !context.explicit)) return null;

      const options: { label: string; type: string; detail?: string }[] = [];

      for (const table of tables) {
        options.push({ label: table.name, type: "class", detail: "table" });
        for (const col of table.columns) {
          options.push({ label: col.name, type: "property", detail: `${table.name} (${col.type})` });
        }
      }

      // ClickHouse functions
      const fns = [
        "count", "sum", "avg", "min", "max", "uniq", "uniqExact",
        "toDate", "toStartOfHour", "toStartOfDay", "toStartOfWeek", "toStartOfMonth",
        "toStartOfMinute", "toStartOfQuarter", "toYear",
        "now", "today", "yesterday", "dateDiff", "formatDateTime",
        "toString", "toFloat64", "toInt64", "toUInt64",
        "arrayJoin", "groupArray", "topK",
      ];
      for (const fn of fns) {
        options.push({ label: fn, type: "function" });
      }

      return { from: word.from, options };
    },
    [tables]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        sql(),
        autocompletion({ override: [completionSource] }),
        keymap.of([
          {
            key: "Mod-Enter",
            run: () => {
              onExecuteRef.current();
              return true;
            },
          },
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          "&": { height: "100%" },
          ".cm-scroller": { overflow: "auto" },
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only recreate on tables change, not on value change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completionSource]);

  return (
    <div
      ref={containerRef}
      className={`editor-container min-h-[200px] ${className}`}
    />
  );
}
