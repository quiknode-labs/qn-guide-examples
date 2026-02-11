"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { ConnectKitButton } from "connectkit";

export function Header() {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center justify-between",
        "border-b border-(--border) bg-(--background) px-4 py-2 backdrop-blur-xl md:px-8",
      )}
    >
      <div className="flex items-center gap-2">
        <h1 className="font-display text-xl font-semibold tracking-tight text-(--foreground)">
          x402 Playground
        </h1>
        <Badge>Pay-per-request blockchain APIs by Quicknode</Badge>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <nav className="hidden items-center gap-3 text-base text-(--foreground-light) md:flex">
          <a
            href="https://www.quicknode.com/guides/x402/access-quicknode-endpoints-with-x402-payments"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-(--foreground) transition-colors"
          >
            Guide
          </a>
          <a
            href="https://github.com/quiknode-labs/qn-x402-examples"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-(--foreground) transition-colors"
          >
            GitHub
          </a>
        </nav>
        <ConnectKitButton />
      </div>
    </header>
  );
}
