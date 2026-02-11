"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { Loader2, Play } from "lucide-react";
import type { Method } from "@/lib/types";
import { METHODS } from "@/lib/methods";

type ExplorerPanelProps = {
  isExecuting: boolean;
  executingMethodId: string | null;
  onExecute: (method: Method) => void;
};

const networkColors: Record<string, string> = {
  "Base Sepolia": "bg-blue-100 text-blue-800",
  Ethereum: "bg-indigo-100 text-indigo-800",
  Arbitrum: "bg-sky-100 text-sky-800",
  Polygon: "bg-purple-100 text-purple-800",
  Aptos: "bg-teal-100 text-teal-800",
};

export function ExplorerPanel({
  isExecuting,
  executingMethodId,
  onExecute,
}: ExplorerPanelProps) {
  const jsonRpcMethods = METHODS.filter((m) => m.protocol === "JSON-RPC");
  const restMethods = METHODS.filter((m) => m.protocol === "REST");

  return (
    <Card variant="white">
      <Card.Content>
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-(--foreground-light) uppercase">
            Explorer
          </span>

          <MethodGroup
            label="JSON-RPC"
            methods={jsonRpcMethods}
            isExecuting={isExecuting}
            executingMethodId={executingMethodId}
            onExecute={onExecute}
          />

          <MethodGroup
            label="REST"
            methods={restMethods}
            isExecuting={isExecuting}
            executingMethodId={executingMethodId}
            onExecute={onExecute}
          />
        </div>
      </Card.Content>
    </Card>
  );
}

function MethodGroup({
  label,
  methods,
  isExecuting,
  executingMethodId,
  onExecute,
}: {
  label: string;
  methods: Method[];
  isExecuting: boolean;
  executingMethodId: string | null;
  onExecute: (method: Method) => void;
}) {
  if (methods.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <Badge>{label}</Badge>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {methods.map((method) => {
          const executing = isExecuting && executingMethodId === method.id;
          return (
            <button
              key={method.id}
              onClick={() => onExecute(method)}
              disabled={isExecuting}
              className={cn(
                "group flex cursor-pointer flex-col gap-1.5 rounded-lg border border-(--border) p-3 text-left transition-colors",
                "hover:border-(--foreground) hover:bg-(--background) focus-visible:border-(--foreground) focus-visible:outline-none",
                executing && "border-(--accent)",
                isExecuting && !executing && "opacity-50",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-semibold text-(--foreground)">
                  {method.name}
                </span>
                {executing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-(--accent)" />
                ) : (
                  <Play className="h-3.5 w-3.5 text-(--foreground-light) opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </div>
              <p className="text-sm text-(--foreground-light)">
                {method.description}
              </p>
              <span
                className={cn(
                  "mt-auto w-fit rounded-full px-2 py-0.5 text-xs font-medium",
                  networkColors[method.networkDisplay] ??
                    "bg-gray-100 text-gray-800",
                )}
              >
                {method.networkDisplay}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
