'use client';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function ConnectionStatus() {
  const isConnected = useAppStore((state) => state.isConnected);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          isConnected ? "bg-primary animate-pulse" : "bg-destructive"
        )}
      />
      <span>{isConnected ? 'Live' : 'Disconnected'}</span>
    </div>
  );
}
