"use client";

import { ReactNode } from "react";

export function SwapCard({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-start justify-center dotted-background p-4 pt-20">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 space-y-6 relative z-10">
        {children}
      </div>
    </div>
  );
}

