"use client";

import { ReactNode } from "react";

/** Dark, dot-textured page shell holding the swap column. */
export function SwapCard({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full qn-pattern-dots flex items-start justify-center p-4 sm:p-6 pt-10 sm:pt-14">
      <div className="w-full max-w-4xl space-y-4">{children}</div>
    </div>
  );
}
