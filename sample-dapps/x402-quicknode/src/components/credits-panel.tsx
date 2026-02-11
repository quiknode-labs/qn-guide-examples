"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { Coins, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CreditsPanelProps = {
  credits: number;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
};

export function CreditsPanel({
  credits,
  isLoading,
  error,
  onRefresh,
}: CreditsPanelProps) {
  const prevCredits = useRef(credits);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prevCredits.current !== credits && prevCredits.current !== 0) {
      setFlash(true);
      const timeout = setTimeout(() => setFlash(false), 1500);
      return () => clearTimeout(timeout);
    }
    prevCredits.current = credits;
  }, [credits]);

  useEffect(() => {
    if (!flash) {
      prevCredits.current = credits;
    }
  }, [flash, credits]);

  const delta = credits - prevCredits.current;

  return (
    <Card variant="white">
      <Card.Content>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-(--foreground-light) uppercase">
              Credits
            </span>
            <button
              onClick={() => void onRefresh()}
              disabled={isLoading}
              className="rounded-full p-1 text-(--foreground-light) transition-colors hover:bg-(--border) hover:text-(--foreground)"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
              />
            </button>
          </div>

          <div className="flex items-baseline gap-2">
            <Coins className="h-4 w-4 text-(--accent)" />
            <span
              className={cn(
                "font-display text-2xl font-semibold transition-colors duration-700",
                flash
                  ? delta > 0
                    ? "text-green-600"
                    : "text-amber-600"
                  : "text-(--foreground)",
              )}
            >
              {credits.toLocaleString()}
            </span>
            {flash && delta !== 0 && (
              <span
                className={cn(
                  "text-xs font-semibold animate-pulse",
                  delta > 0 ? "text-green-600" : "text-amber-600",
                )}
              >
                {delta > 0 ? `+${delta}` : delta}
              </span>
            )}
            {!flash && (
              <span className="text-xs text-(--foreground-light)">
                available
              </span>
            )}
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </Card.Content>
    </Card>
  );
}
