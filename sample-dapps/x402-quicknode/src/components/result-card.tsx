"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { CheckCircle, XCircle } from "lucide-react";
import type { MethodExecutionResult } from "@/lib/types";

type ResultCardProps = {
  result: MethodExecutionResult;
};

export function ResultCard({ result }: ResultCardProps) {
  const time = new Date(result.requestedAt).toLocaleTimeString();

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-3",
        result.ok ? "border-(--border)" : "border-red-200",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {result.ok ? (
          <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 shrink-0 text-red-500" />
        )}
        <span className="font-mono text-base font-semibold text-(--foreground)">
          {result.methodName}
        </span>
        <Badge>{result.protocol}</Badge>
        <span className="text-sm text-(--foreground-light)">
          {result.networkDisplay}
        </span>
        <span className="ml-auto text-sm text-(--foreground-light)">
          {time}
        </span>
      </div>

      <pre
        className={cn(
          "max-h-32 overflow-auto rounded-md border border-(--border) p-2",
          "bg-(--background) font-mono text-xs text-(--foreground) leading-snug",
        )}
      >
        {JSON.stringify(result.data, null, 2)}
      </pre>

      {result.error && (
        <p className="text-sm text-red-600">{result.error}</p>
      )}

      {result.paymentResponse != null && (
        <details className="text-sm text-(--foreground-light)">
          <summary className="cursor-pointer hover:text-(--foreground)">
            Payment details
          </summary>
          <pre className="mt-2 overflow-auto rounded-md border border-(--border) bg-(--background) p-2 font-mono text-xs leading-relaxed">
            {JSON.stringify(result.paymentResponse, null, 2)}
          </pre>
        </details>
      )}

      <div className="flex items-center gap-2 text-sm text-(--foreground-light)">
        <span>HTTP {result.status}</span>
      </div>
    </div>
  );
}
