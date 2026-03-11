"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { POPULAR_COINS, ALL_COINS } from "@/lib/constants";

interface CoinSelectorProps {
  coin: string;
  onSelect: (coin: string) => void;
}

// Tokens with icons on spothq CDN
const HAS_ICON = new Set([
  "BTC", "ETH", "SOL", "DOGE", "AVAX", "LINK",
  "MATIC", "ATOM", "STX", "AAVE", "MKR", "UNI", "SNX",
]);

function iconUrl(symbol: string) {
  return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/${symbol.toLowerCase()}.svg`;
}

// Color from symbol hash
const ICON_COLORS = [
  "#10b981", "#8b5cf6", "#f59e0b", "#ef4444",
  "#3b82f6", "#ec4899", "#14b8a6", "#f97316",
];

function hashColor(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return ICON_COLORS[Math.abs(h) % ICON_COLORS.length];
}

function CoinIcon({ symbol, size = 16 }: { symbol: string; size?: number }) {
  const [useFallback, setUseFallback] = useState(!HAS_ICON.has(symbol));

  useEffect(() => {
    setUseFallback(!HAS_ICON.has(symbol));
  }, [symbol]);

  if (useFallback) {
    const color = hashColor(symbol);
    return (
      <span
        className="inline-flex items-center justify-center rounded-full shrink-0 font-mono font-bold"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.5,
          backgroundColor: `${color}20`,
          color,
        }}
      >
        {symbol[0]}
      </span>
    );
  }

  return (
    <img
      src={iconUrl(symbol)}
      alt={symbol}
      width={size}
      height={size}
      className="rounded-full shrink-0"
      onError={() => setUseFallback(true)}
    />
  );
}

export function CoinSelector({ coin, onSelect }: CoinSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const filtered = search
    ? ALL_COINS.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
    : ALL_COINS;

  const handleSelect = useCallback((c: string) => {
    onSelect(c);
    setIsOpen(false);
    setSearch("");
  }, [onSelect]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-[130px] h-10 liquid-glass-trigger cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <CoinIcon symbol={coin} size={16} />
          <span className="text-[13px] font-semibold font-mono text-[var(--text-primary)]">
            {coin}
          </span>
          <svg
            className={`w-3 h-3 text-[var(--text-muted)] transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[300px] liquid-glass-float z-50"
          >
            {/* Search */}
            <div style={{ padding: "20px 24px 16px 24px" }}>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search coin..."
                className="w-full h-10 text-center text-[12px] font-mono bg-[var(--bg-input)] border-none rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
              />
            </div>

            {/* All coins */}
            <div style={{ padding: "16px 20px" }}>
              {!search && (
                <span className="block text-center text-[9px] uppercase tracking-[0.15em] text-[var(--text-muted)]" style={{ marginBottom: 8 }}>
                  All tokens
                </span>
              )}
              <div className="max-h-52 overflow-y-auto">
                <div className="grid grid-cols-2 gap-1">
                  {filtered.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleSelect(c)}
                      style={{ paddingLeft: 16, paddingRight: 16 }}
                      className={`flex items-center gap-3 h-10 rounded-xl text-[11px] font-mono transition-all cursor-pointer ${
                        c === coin
                          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <CoinIcon symbol={c} size={18} />
                      <span className="truncate">{c}</span>
                    </button>
                  ))}
                </div>
                {filtered.length === 0 && (
                  <div className="text-center text-[11px] text-[var(--text-muted)] py-8">
                    No coins found
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
