"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Terminal, Trash2 } from "lucide-react";
import type { MethodExecutionResult } from "@/lib/types";
import { ResultCard } from "./result-card";

type ResultsFeedProps = {
  results: MethodExecutionResult[];
  onClear: () => void;
};

export function ResultsFeed({ results, onClear }: ResultsFeedProps) {
  return (
    <Card variant="white">
      <Card.Content>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-(--foreground-light) uppercase">
              Results
            </span>
            {results.length > 0 && (
              <Button variant="secondary" onClick={onClear}>
                <span className="flex items-center gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear
                </span>
              </Button>
            )}
          </div>

          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-(--foreground-light)">
              <Terminal className="h-6 w-6" />
              <p className="text-sm">Execute a method to see results here</p>
            </div>
          ) : (
            <div className="flex max-h-[400px] flex-col gap-2 overflow-y-auto">
              {results.map((result) => (
                <ResultCard key={result.id} result={result} />
              ))}
            </div>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
