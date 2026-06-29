"use client";

import type { SwapStatus } from "@/lib/types";

interface StatusMessageProps {
  status: SwapStatus;
  error: string | null;
  txSignature: string | null;
  estimatedOutput: string | null;
}

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export function StatusMessage({
  status,
  error,
  txSignature,
  estimatedOutput,
}: StatusMessageProps) {
  if (status === "idle") return null;

  if (status === "success" && txSignature) {
    return (
      <div className="border border-border bg-bg-elev p-4">
        <div className="flex items-center gap-2">
          <span className="qn-badge qn-badge--accent">Confirmed</span>
          <span className="text-fg text-sm">Swap complete</span>
        </div>
        {estimatedOutput && (
          <div className="mt-2 font-mono text-xs text-fg-dim tabular-nums">
            Output ≈ {estimatedOutput}
          </div>
        )}
        <a
          href={`https://solscan.io/tx/${txSignature}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block font-mono text-[11px] uppercase tracking-wide text-accent hover:underline"
        >
          View on Solscan →
        </a>
      </div>
    );
  }

  if (status === "error" && error) {
    return (
      <div className="border border-border bg-bg-elev p-4">
        <div className="flex items-center gap-2">
          <span className="qn-badge qn-badge--bear">Failed</span>
          <span className="text-fg text-sm">Swap failed</span>
        </div>
        <div className="mt-2 font-mono text-xs text-bear break-words">{error}</div>
      </div>
    );
  }

  const labels: Partial<Record<SwapStatus, string>> = {
    quoting: "Fetching routes…",
    building: "Building transaction from Titan instructions…",
    sending: "Submitting via Quicknode RPC…",
    confirming: "Confirming on-chain…",
  };

  if (status === "signing") {
    return (
      <div className="border border-border bg-bg-elev p-4 flex items-center gap-2 text-fg">
        <span className="animate-pulse inline-block w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
        <span className="text-sm">Approve the transaction in your wallet</span>
      </div>
    );
  }

  if (labels[status]) {
    return (
      <div className="border border-border bg-bg-elev p-4 flex items-center gap-2 text-fg-muted">
        <Spinner />
        <span className="text-sm">{labels[status]}</span>
      </div>
    );
  }

  return null;
}
