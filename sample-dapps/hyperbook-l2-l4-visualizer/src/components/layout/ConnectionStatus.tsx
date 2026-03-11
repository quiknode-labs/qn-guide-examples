"use client";

import type { StreamStatus } from "@/types/stream";
import { formatBlockHeight } from "@/lib/utils";

interface ConnectionStatusProps {
  l2Status: StreamStatus;
  l4Status: StreamStatus;
  blockNumber: string;
}

function Dot({ status }: { status: StreamStatus }) {
  const color =
    status === "connected"
      ? "bg-[var(--accent)]"
      : status === "connecting" || status === "reconnecting"
        ? "bg-[var(--warn)]"
        : "bg-[var(--ask)]";

  const animate = status === "connected" ? "animate-[pulse-dot_2s_ease-in-out_infinite]" : "";

  return <span className={`inline-block w-[5px] h-[5px] rounded-full ${color} ${animate}`} />;
}

export function ConnectionStatus({ l2Status, l4Status, blockNumber }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-4 text-[11px] font-mono text-[var(--text-muted)] whitespace-nowrap">
      {blockNumber && (
        <span className="tabular-nums">#{formatBlockHeight(blockNumber)}</span>
      )}
      <div className="flex items-center gap-1.5">
        <Dot status={l2Status} />
        <span>L2</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Dot status={l4Status} />
        <span>L4</span>
      </div>
    </div>
  );
}
