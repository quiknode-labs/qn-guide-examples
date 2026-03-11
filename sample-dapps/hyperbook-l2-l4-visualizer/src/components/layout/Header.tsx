"use client";

import { CoinSelector } from "@/components/selectors/CoinSelector";
import { ConnectionStatus } from "./ConnectionStatus";
import type { StreamStatus } from "@/types/stream";

interface HeaderProps {
  coin: string;
  onCoinSelect: (coin: string) => void;
  l2Status: StreamStatus;
  l4Status: StreamStatus;
  blockNumber: string;
}

export function Header({ coin, onCoinSelect, l2Status, l4Status, blockNumber }: HeaderProps) {
  return (
    <div className="flex items-center justify-between shrink-0">
      {/* Left: Logo + Powered by */}
      <div className="flex items-center gap-3">
        <h1 className="text-[14px] font-bold tracking-[0.15em] text-[var(--text-secondary)] select-none whitespace-nowrap">
          <span className="text-[var(--accent)]">HYPER</span>BOOK
        </h1>
        <div className="relative flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] leading-none opacity-50">Powered by</span>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(16, 185, 129, 0.10) 0%, transparent 70%)", filter: "blur(8px)" }} />
          <img src="/quicknode-mark.png" alt="Quicknode" className="relative w-3.5 h-3.5 rounded-[3px]" />
          <span className="relative text-[9px] font-semibold tracking-wide leading-none text-[var(--text-muted)]">Quicknode</span>
        </div>
      </div>

      {/* Center: Coin */}
      <CoinSelector coin={coin} onSelect={onCoinSelect} />

      {/* Right: Status */}
      <ConnectionStatus l2Status={l2Status} l4Status={l4Status} blockNumber={blockNumber} />
    </div>
  );
}
