"use client";

import { useState, useCallback } from "react";
import RGL, { WidthProvider, type Layout } from "react-grid-layout";
import type { DashboardCard as DashboardCardType } from "@/lib/types";
import DashboardCardComponent from "./DashboardCard";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ReactGridLayout = WidthProvider(RGL);

interface DashboardGridProps {
  cards: DashboardCardType[];
  editing: boolean;
  onLayoutChange?: (cards: Array<{ id: number; pos_x: number; pos_y: number; width: number; height: number }>) => void;
  onRemoveCard?: (cardId: number) => void;
  onTextChange?: (cardId: number, content: string) => void;
  onAddCard?: () => void;
  filters?: Record<string, string>;
}

export default function DashboardGrid({ cards, editing, onLayoutChange, onRemoveCard, onTextChange, onAddCard, filters }: DashboardGridProps) {
  const [textContents, setTextContents] = useState<Record<number, string>>({});

  const layout: Layout[] = cards.map((card) => ({
    i: String(card.id),
    x: card.pos_x,
    y: card.pos_y,
    w: card.width,
    h: card.height,
    minW: 2,
    minH: 2,
    static: !editing,
  }));

  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      if (!editing || !onLayoutChange) return;
      const updates = newLayout.map((item) => ({
        id: parseInt(item.i),
        pos_x: item.x,
        pos_y: item.y,
        width: item.w,
        height: item.h,
      }));
      onLayoutChange(updates);
    },
    [editing, onLayoutChange]
  );

  if (cards.length === 0) {
    return (
      <div className="grid grid-cols-3 gap-4 p-2">
        {editing ? (
          <>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                onClick={onAddCard}
                className="placeholder-card h-48"
              >
                <div className="placeholder-dot" style={{ animationDelay: `${i * 0.3}s` }} />
                <span className="text-xs text-foreground-light font-mono">
                  {i === 0 ? "Add a query" : ""}
                </span>
              </button>
            ))}
          </>
        ) : (
          <div className="col-span-3 py-20 text-center">
            <div className="flex justify-center gap-3 mb-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="placeholder-dot" style={{ animationDelay: `${i * 0.4}s` }} />
              ))}
            </div>
            <p className="text-foreground-light text-sm">
              This dashboard has no cards yet. Click <span className="font-mono text-accent">Edit</span> to get started.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <ReactGridLayout
        layout={layout}
        cols={12}
        rowHeight={80}
        onLayoutChange={handleLayoutChange}
        isDraggable={editing}
        isResizable={editing}
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {cards.map((card) => (
          <div key={String(card.id)}>
            <DashboardCardComponent
              card={{
                ...card,
                text_content: textContents[card.id] ?? card.text_content,
              }}
              editing={editing}
              onRemove={() => onRemoveCard?.(card.id)}
              onTextChange={(content) => {
                setTextContents((prev) => ({ ...prev, [card.id]: content }));
                onTextChange?.(card.id, content);
              }}
              filters={filters}
            />
          </div>
        ))}
      </ReactGridLayout>

      {/* Add card placeholder row when editing and cards exist */}
      {editing && (
        <div className="mt-4 grid grid-cols-3 gap-4 px-2">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={onAddCard}
              className="placeholder-card h-32"
            >
              <div className="placeholder-dot" style={{ animationDelay: `${i * 0.3}s` }} />
              {i === 1 && (
                <span className="text-[10px] text-foreground-light font-mono uppercase">
                  + Add card
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
