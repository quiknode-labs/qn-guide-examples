"use client";

import { useState } from "react";
import clsx from "clsx";
import { Highlight, themes } from "prism-react-renderer";
import CopyButton from "@/components/ui/CopyButton";
import { generateCurl, generateTypeScript, generatePython } from "@/lib/snippets";

interface CodeSnippetsProps {
  sql: string;
}

type Tab = "SQL" | "curl" | "TypeScript" | "Python";

const TABS: Tab[] = ["SQL", "curl", "TypeScript", "Python"];

function getLanguage(tab: Tab): string {
  switch (tab) {
    case "SQL": return "sql";
    case "curl": return "bash";
    case "TypeScript": return "typescript";
    case "Python": return "python";
  }
}

export default function CodeSnippets({ sql }: CodeSnippetsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("SQL");

  function getCode(tab: Tab): string {
    switch (tab) {
      case "SQL": return sql;
      case "curl": return generateCurl({ sql });
      case "TypeScript": return generateTypeScript({ sql });
      case "Python": return generatePython({ sql });
    }
  }

  const code = getCode(activeTab);
  const language = getLanguage(activeTab);

  return (
    <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "px-3 py-2 text-xs font-medium transition-colors",
                activeTab === tab
                  ? "border-b-2 border-[var(--color-brand)] text-[var(--color-brand)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <CopyButton text={code} />
      </div>
      <div className="max-h-80 overflow-auto bg-gray-950 p-4">
        <Highlight theme={themes.oneDark} code={code} language={language}>
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre className="text-xs font-mono leading-relaxed">
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}
