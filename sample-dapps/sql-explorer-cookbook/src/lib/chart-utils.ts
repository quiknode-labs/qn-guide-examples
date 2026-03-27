import type { ChartConfig, ColumnMeta } from "@/types";

const CHART_COLORS = [
  "#2563eb", // blue
  "#7c3aed", // violet
  "#0891b2", // cyan
  "#059669", // emerald
  "#d97706", // amber
  "#dc2626", // red
  "#ec4899", // pink
  "#8b5cf6", // purple
];

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

function isNumericType(type: string): boolean {
  const lower = type.toLowerCase();
  return (
    lower.includes("int") ||
    lower.includes("float") ||
    lower.includes("decimal") ||
    lower.includes("double")
  );
}

export function autoDetectChartConfig(
  meta: ColumnMeta[],
  data: Record<string, unknown>[]
): ChartConfig | null {
  if (!data.length || meta.length < 2) return null;

  const numericCols = meta.filter((col) => isNumericType(col.type));
  const nonNumericCols = meta.filter((col) => !isNumericType(col.type));

  if (numericCols.length === 0) return null;

  // Try to find a good x-axis (first non-numeric column)
  const xCol = nonNumericCols[0] || meta[0];
  const yKeys = numericCols
    .filter((c) => c.name !== xCol.name)
    .slice(0, 3)
    .map((c) => c.name);

  if (yKeys.length === 0) return null;

  // Heuristic: if xCol looks like a time column, use line chart
  const xLower = xCol.name.toLowerCase();
  const isTimeSeries =
    xLower.includes("time") ||
    xLower.includes("date") ||
    xLower.includes("hour") ||
    xLower.includes("day") ||
    xLower.includes("month") ||
    xCol.type.toLowerCase().includes("datetime");

  return {
    type: isTimeSeries ? "line" : "bar",
    xKey: xCol.name,
    yKeys,
  };
}

export function hasChartableData(
  chartConfig: ChartConfig | undefined,
  meta: ColumnMeta[],
  data: Record<string, unknown>[]
): boolean {
  if (chartConfig) return true;
  return autoDetectChartConfig(meta, data) !== null;
}
