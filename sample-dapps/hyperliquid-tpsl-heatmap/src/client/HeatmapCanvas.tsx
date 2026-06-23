import { useEffect, useRef, useState } from 'react';
import { BboState, ClusterBucket } from '../shared/types';

interface Props {
  buckets: ClusterBucket[];
  bbo?: BboState;
}

export function HeatmapCanvas({ buckets, bbo }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState<ClusterBucket | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const resize = () => draw(canvas, wrap, buckets, bbo, hovered);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [buckets, bbo, hovered]);

  function handleMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const rows = layoutRows(buckets, bbo);
    const rowHeight = rect.height / Math.max(rows.length, 1);
    const row = rows[Math.floor(y / rowHeight)];
    setHovered(row ?? null);
  }

  return (
    <div className="heatmapWrap" ref={wrapRef}>
      <canvas ref={canvasRef} onPointerMove={handleMove} onPointerLeave={() => setHovered(null)} />
      {hovered && (
        <div className="hoverCard">
          <strong>${hovered.label}</strong>
          <span>{money(hovered.totalNotional)} known notional</span>
          <span>TP {hovered.tpCount} / SL {hovered.slCount}</span>
          {hovered.positionSizedCount > 0 && <span>{hovered.positionSizedCount} position-sized</span>}
        </div>
      )}
    </div>
  );
}

function draw(
  canvas: HTMLCanvasElement,
  wrap: HTMLDivElement,
  buckets: ClusterBucket[],
  bbo: BboState | undefined,
  hovered: ClusterBucket | null
) {
  const rect = wrap.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, rect.height);
  ctx.fillStyle = '#131313';
  ctx.fillRect(0, 0, rect.width, rect.height);

  const rows = layoutRows(buckets, bbo);
  const maxNotional = Math.max(1, ...rows.map((bucket) => bucket.totalNotional));
  const chartLeft = 88;
  const chartRight = rect.width - 24;
  const rowHeight = rect.height / Math.max(rows.length, 1);

  ctx.font = '12px IBM Plex Mono, ui-monospace, monospace';
  ctx.textBaseline = 'middle';

  if (rows.length === 0) {
    ctx.fillStyle = '#D9D9D9';
    ctx.fillText('Waiting for trigger-order clusters', 28, rect.height / 2);
    return;
  }

  rows.forEach((bucket, index) => {
    const y = index * rowHeight;
    const intensity = Math.sqrt(bucket.totalNotional / maxNotional);
    const width = Math.max(4, (chartRight - chartLeft) * Math.max(intensity, bucket.positionSizedCount > 0 ? 0.05 : 0));
    const tpRatio = bucket.tpCount / Math.max(1, bucket.tpCount + bucket.slCount);

    ctx.fillStyle = index % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.01)';
    ctx.fillRect(0, y, rect.width, rowHeight);

    ctx.fillStyle = 'rgba(217,217,217,0.62)';
    ctx.fillText(`$${bucket.label}`, 18, y + rowHeight / 2);

    const gradient = ctx.createLinearGradient(chartLeft, 0, chartLeft + width, 0);
    gradient.addColorStop(0, `rgba(74,87,96,${0.24 + intensity * 0.24})`);
    gradient.addColorStop(Math.max(0.2, tpRatio), `rgba(66,174,194,${0.22 + intensity * 0.42})`);
    gradient.addColorStop(1, `rgba(108,255,117,${0.2 + intensity * 0.54})`);
    ctx.fillStyle = gradient;
    roundRect(ctx, chartLeft, y + rowHeight * 0.18, width, Math.max(4, rowHeight * 0.64), 4);
    ctx.fill();

    drawBalanceMarker(ctx, chartLeft, y, rowHeight, bucket);

    if (hovered?.price === bucket.price) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.strokeRect(chartLeft - 1, y + 1, chartRight - chartLeft + 2, rowHeight - 2);
    }
  });

  drawBboLines(ctx, rows, bbo, rect.width, rect.height, rowHeight);
}

function drawBalanceMarker(ctx: CanvasRenderingContext2D, x: number, y: number, rowHeight: number, bucket: ClusterBucket) {
  const total = Math.max(1, bucket.tpCount + bucket.slCount);
  const tpShare = bucket.tpCount / total;
  const markerWidth = 44;
  const markerHeight = Math.max(3, rowHeight * 0.18);
  const markerY = y + rowHeight * 0.72;

  ctx.fillStyle = 'rgba(255,107,95,0.62)';
  roundRect(ctx, x, markerY, markerWidth, markerHeight, markerHeight / 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(108,255,117,0.72)';
  roundRect(ctx, x, markerY, markerWidth * tpShare, markerHeight, markerHeight / 2);
  ctx.fill();
}

function layoutRows(buckets: ClusterBucket[], bbo?: BboState): ClusterBucket[] {
  if (buckets.length === 0) return [];
  const mid = bbo?.mid;
  const sorted = [...buckets].sort((a, b) => b.price - a.price);
  if (!mid) return sorted.slice(0, 42);

  const near = sorted
    .filter((bucket) => Math.abs(bucket.price - mid) / mid <= 0.08)
    .slice(0, 60);
  return near.length > 0 ? near : sorted.slice(0, 42);
}

function drawBboLines(
  ctx: CanvasRenderingContext2D,
  rows: ClusterBucket[],
  bbo: BboState | undefined,
  width: number,
  height: number,
  rowHeight: number
) {
  const lines = [
    { price: bbo?.ask, color: '#FF6B5F', label: 'ASK', labelOffset: -10 },
    { price: bbo?.bid, color: '#6CFF75', label: 'BID', labelOffset: 14 },
  ]
    .filter((line): line is { price: number; color: string; label: string; labelOffset: number } => Boolean(line.price))
    .map((line) => ({ ...line, y: bboY(rows, line.price, height, rowHeight) }));

  if (lines.length === 0) return;

  if (lines.length === 2 && Math.abs(lines[0].y - lines[1].y) < 22) {
    lines[0].labelOffset = -16;
    lines[1].labelOffset = 18;
  }

  for (const line of lines) {
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(88, line.y);
    ctx.lineTo(width - 24, line.y);
    ctx.stroke();

    const labelY = Math.min(height - 8, Math.max(10, line.y + line.labelOffset));
    const labelX = width - 58;
    ctx.font = 'bold 11px IBM Plex Mono, ui-monospace, monospace';
    ctx.fillStyle = '#131313';
    roundRect(ctx, labelX - 4, labelY - 7, 34, 14, 3);
    ctx.fill();
    ctx.fillStyle = line.color;
    ctx.fillText(line.label, labelX, labelY);
  }
}

function bboY(rows: ClusterBucket[], price: number, height: number, rowHeight: number): number {
  if (rows.length === 0) return height / 2;
  const nearestIndex = rows.reduce((best, row, index) => {
    const current = Math.abs(row.price - price);
    const previous = Math.abs(rows[best].price - price);
    return current < previous ? index : best;
  }, 0);
  return Math.min(height - 8, Math.max(8, nearestIndex * rowHeight + rowHeight / 2));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function money(value: number): string {
  return Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
    style: 'currency',
    currency: 'USD',
  }).format(value);
}
