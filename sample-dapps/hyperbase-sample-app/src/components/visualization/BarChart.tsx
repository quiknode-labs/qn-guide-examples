"use client";

import { ResponsiveBar } from "@nivo/bar";
import type { QueryResult } from "@/lib/types";
import { CHART_COLORS } from "@/lib/constants";
import { formatAxisLabel, formatTooltipValue, nivoTheme, tt, getNumericYKeys } from "./chart-utils";

interface BarChartProps {
  result: QueryResult;
}

export default function BarChart({ result }: BarChartProps) {
  const { columns, rows } = result;
  if (!columns.length || !rows.length) return null;

  const xKey = columns[0];
  const yKeys = getNumericYKeys(columns, rows);
  if (!yKeys.length) return null;

  const data = rows.map((row) => {
    const obj: Record<string, string | number> = {};
    columns.forEach((col, i) => {
      obj[col] = i === 0 ? String(row[i]) : (Number(row[i]) || 0);
    });
    // Add a __color field for per-bar coloring
    obj.__color = CHART_COLORS[rows.indexOf(row) % CHART_COLORS.length];
    return obj;
  });

  // For single-series, show only the primary metric as bars (skip secondary columns)
  const displayKeys = yKeys.length > 2 ? [yKeys[0]] : yKeys;
  const isSingleSeries = displayKeys.length === 1;

  return (
    <ResponsiveBar
      data={data}
      keys={displayKeys}
      indexBy={xKey}
      theme={nivoTheme}
      colors={isSingleSeries
        ? data.map((_, i) => CHART_COLORS[i % CHART_COLORS.length])
        : displayKeys.map((_, i) => CHART_COLORS[i % CHART_COLORS.length])
      }
      colorBy={isSingleSeries ? "indexValue" : "id"}
      margin={{ top: 12, right: 16, bottom: 38, left: 56 }}
      padding={0.3}
      borderRadius={4}
      enableGridX={false}
      enableGridY={true}
      enableLabel={false}
      axisBottom={{
        tickSize: 0,
        tickPadding: 8,
        tickRotation: data.length > 8 ? -30 : 0,
        format: (v) => formatAxisLabel(v),
      }}
      axisLeft={{
        tickSize: 0,
        tickPadding: 8,
        format: (v) => formatTooltipValue(v),
        tickValues: 5,
      }}
      defs={[
        {
          id: "bar-gradient",
          type: "linearGradient",
          colors: [
            { offset: 0, color: "inherit", opacity: 0.95 },
            { offset: 100, color: "inherit", opacity: 0.55 },
          ],
        },
      ]}
      fill={[{ match: "*", id: "bar-gradient" }]}
      tooltip={({ id, value, indexValue, color }) => (
        <div style={tt.wrap}>
          <div style={tt.label}>{formatAxisLabel(indexValue)}</div>
          <div style={tt.row}>
            <div style={{ ...tt.dot, background: color }} />
            <span style={tt.name}>{String(id).replace(/_/g, " ")}:</span>
            <span style={tt.val}>{formatTooltipValue(value)}</span>
          </div>
        </div>
      )}
      animate={true}
      motionConfig="gentle"
      legends={!isSingleSeries ? [{
        dataFrom: "keys",
        anchor: "top-right",
        direction: "column",
        translateX: -8,
        translateY: 0,
        itemWidth: 100,
        itemHeight: 16,
        symbolSize: 8,
        symbolShape: "circle",
        itemTextColor: "var(--foreground-light)",
      }] : []}
    />
  );
}
