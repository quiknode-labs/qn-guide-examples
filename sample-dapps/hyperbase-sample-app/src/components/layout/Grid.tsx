"use client";

import { useEffect, useRef } from "react";

interface PatternLayer {
  dotSize: number;
  gridSize: number;
  color?: string;
}

interface GridProps {
  patterns?: PatternLayer[];
  className?: string;
}

const DEFAULT_PATTERNS: PatternLayer[] = [
  { dotSize: 2, gridSize: 8 },
  { dotSize: 2, gridSize: 32, color: "var(--grid-sparse)" },
];

function createPatternDataUrl(dotSize: number, gridSize: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = gridSize;
  canvas.height = gridSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#ffffff";
  const positions = [
    [0, 0],
    [gridSize, 0],
    [0, gridSize],
    [gridSize, gridSize],
  ];

  for (const [x, y] of positions) {
    ctx.beginPath();
    ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL();
}

export default function Grid({
  patterns = DEFAULT_PATTERNS,
  className = "",
}: GridProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    for (const pattern of patterns) {
      const dataUrl = createPatternDataUrl(pattern.dotSize, pattern.gridSize);
      if (!dataUrl) continue;

      const layer = document.createElement("div");
      layer.style.position = "absolute";
      layer.style.inset = "0";
      layer.style.maskImage = `url(${dataUrl})`;
      layer.style.maskSize = `${pattern.gridSize}px ${pattern.gridSize}px`;
      layer.style.maskRepeat = "repeat";
      layer.style.setProperty("-webkit-mask-image", `url(${dataUrl})`);
      layer.style.setProperty("-webkit-mask-size", `${pattern.gridSize}px ${pattern.gridSize}px`);
      layer.style.setProperty("-webkit-mask-repeat", "repeat");
      layer.style.backgroundColor = pattern.color || "var(--grid)";
      layer.style.willChange = "mask-image";
      layer.style.contain = "paint";

      container.appendChild(layer);
    }
  }, [patterns]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 z-0 pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}
