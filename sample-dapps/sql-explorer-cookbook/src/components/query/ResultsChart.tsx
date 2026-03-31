"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import clsx from "clsx";
import type { ChartConfig, ColumnMeta } from "@/types";
import { autoDetectChartConfig, getChartColor } from "@/lib/chart-utils";
import { formatNumber } from "@/lib/format";

interface ResultsChartProps {
  meta: ColumnMeta[];
  data: Record<string, unknown>[];
  chartConfig?: ChartConfig;
}

type ChartType = "bar" | "line" | "area";

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
];

function isNumericType(type: string): boolean {
  const lower = type.toLowerCase();
  return (
    lower.includes("int") ||
    lower.includes("float") ||
    lower.includes("decimal") ||
    lower.includes("double")
  );
}

export default function ResultsChart({
  meta,
  data,
  chartConfig,
}: ResultsChartProps) {
  const defaultConfig = chartConfig || autoDetectChartConfig(meta, data);

  const [chartType, setChartType] = useState<ChartType>(
    defaultConfig?.type || "bar"
  );
  const [xKey, setXKey] = useState(defaultConfig?.xKey || meta[0]?.name || "");
  const [selectedYKeys, setSelectedYKeys] = useState<string[]>(
    defaultConfig?.yKeys.filter((k) => k.length > 0) || []
  );

  const numericColumns = useMemo(
    () => meta.filter((col) => isNumericType(col.type)),
    [meta]
  );
  const allColumns = meta.map((col) => col.name);

  function toggleYKey(key: string) {
    setSelectedYKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-[var(--color-text-secondary)]">
        No data to chart
      </div>
    );
  }

  const activeYKeys =
    selectedYKeys.length > 0
      ? selectedYKeys
      : numericColumns.slice(0, 2).map((c) => c.name);

  const chartData = data.map((row) => {
    const processed: Record<string, unknown> = {};
    processed[xKey] = row[xKey];
    for (const key of activeYKeys) {
      const val = row[key];
      processed[key] = typeof val === "number" ? val : Number(val) || 0;
    }
    return processed;
  });

  const commonProps = {
    data: chartData,
    margin: { top: 8, right: 8, left: 8, bottom: 8 },
  };

  const xAxisEl = (
    <XAxis
      dataKey={xKey}
      tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
      tickLine={false}
      axisLine={{ stroke: "var(--color-border)" }}
    />
  );

  const yAxisEl = (
    <YAxis
      tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
      tickLine={false}
      axisLine={false}
      tickFormatter={(v: number) => formatNumber(v)}
    />
  );

  const gridEl = (
    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
  );

  const tooltipEl = (
    <Tooltip
      contentStyle={{
        backgroundColor: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        fontSize: 12,
      }}
      formatter={(value: number) => formatNumber(value)}
    />
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
        {/* Chart type */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
            Chart Type
          </label>
          <div className="flex gap-1">
            {CHART_TYPES.map((ct) => (
              <button
                key={ct.value}
                onClick={() => setChartType(ct.value)}
                className={clsx(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  chartType === ct.value
                    ? "bg-[var(--color-brand)] text-black"
                    : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                )}
              >
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        {/* X-axis */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
            X-Axis
          </label>
          <select
            value={xKey}
            onChange={(e) => setXKey(e.target.value)}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs focus:border-[var(--color-brand)] focus:outline-none"
          >
            {allColumns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>

        {/* Y-axis columns */}
        <div className="space-y-1 flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
            Y-Axis (select columns)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {numericColumns.map((col, i) => (
              <button
                key={col.name}
                onClick={() => toggleYKey(col.name)}
                className={clsx(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border",
                  activeYKeys.includes(col.name)
                    ? "border-transparent text-black"
                    : "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-secondary)]"
                )}
                style={
                  activeYKeys.includes(col.name)
                    ? { backgroundColor: getChartColor(activeYKeys.indexOf(col.name)) }
                    : undefined
                }
              >
                {col.name}
              </button>
            ))}
            {numericColumns.length === 0 && (
              <span className="text-xs text-[var(--color-text-tertiary)]">
                No numeric columns available
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      {activeYKeys.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-sm text-[var(--color-text-secondary)]">
          Select at least one numeric column for the Y-axis
        </div>
      ) : (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart {...commonProps}>
                {gridEl}
                {xAxisEl}
                {yAxisEl}
                {tooltipEl}
                <Legend />
                {activeYKeys.map((key, i) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={getChartColor(i)}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            ) : chartType === "line" ? (
              <LineChart {...commonProps}>
                {gridEl}
                {xAxisEl}
                {yAxisEl}
                {tooltipEl}
                <Legend />
                {activeYKeys.map((key, i) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={getChartColor(i)}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            ) : (
              <AreaChart {...commonProps}>
                {gridEl}
                {xAxisEl}
                {yAxisEl}
                {tooltipEl}
                <Legend />
                {activeYKeys.map((key, i) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={getChartColor(i)}
                    fill={getChartColor(i)}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
