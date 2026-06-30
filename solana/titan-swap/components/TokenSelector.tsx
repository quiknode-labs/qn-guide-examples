"use client";

import { useState, useRef, useEffect } from "react";
import type { Token } from "@/lib/types";

interface TokenSelectorProps {
  tokens: Token[];
  selectedToken: Token | null;
  onSelect: (token: Token) => void;
  disabled?: boolean;
}

export function TokenSelector({
  tokens,
  selectedToken,
  onSelect,
  disabled = false,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTokens = tokens.filter(
    (t) =>
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 border border-border bg-bg-elev hover:bg-bg-hover text-fg font-mono text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {selectedToken ? (
          <>
            <span>{selectedToken.symbol}</span>
            <svg className="w-3.5 h-3.5 text-fg-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        ) : (
          <span className="text-fg-dim">Select</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-1 w-72 panel max-h-72 overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              placeholder="Search tokens…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 bg-bg-elev border border-border text-fg text-sm focus:outline-none focus:border-border-strong placeholder:text-fg-ghost"
            />
          </div>
          <div className="overflow-y-auto">
            {filteredTokens.length === 0 ? (
              <div className="p-4 text-center text-fg-dim text-sm">No tokens found</div>
            ) : (
              filteredTokens.slice(0, 50).map((token) => (
                <button
                  key={token.address}
                  type="button"
                  onClick={() => {
                    onSelect(token);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-bg-hover flex items-center justify-between"
                >
                  <div>
                    <div className="font-mono text-sm text-fg uppercase tracking-wide">{token.symbol}</div>
                    <div className="text-xs text-fg-dim">{token.name}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
