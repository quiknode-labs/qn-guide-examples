"use client";

import { ResponsiveLine } from "@nivo/line";
import type { QueryResult } from "@/lib/types";
import { CHART_COLORS } from "@/lib/constants";
import { formatAxisLabel, formatTooltipValue, nivoTheme, tt, computeTickValues, getNumericYKeys, sortAndDedup } from "./chart-utils";

interface LineChartProps {
  result: QueryResult;
}

/** Custom layer that draws a filled dot at each hovered point */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ActivePointLayer(props: any) {
  const { currentSlice } = props;
  if (!currentSlice) return null;
  return (
    <g>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {currentSlice.points.map((point: any) => (
        <g key={point.id}>
          <circle cx={point.x} cy={point.y} r={7} fill={point.seriesColor} opacity={0.15} />
          <circle cx={point.x} cy={point.y} r={4} fill={point.seriesColor} stroke="var(--background)" strokeWidth={1.5} />
        </g>
      ))}
    </g>
  );
}

export default function LineChart({ result }: LineChartProps) {
  const { columns, rows } = result;
  if (!columns.length || !rows.length) return null;

  const allNumericYKeys = getNumericYKeys(columns, rows);
  if (!allNumericYKeys.length) return null;

  // Limit to first y-key when 3+ to avoid scale mismatch (e.g. price vs size vs notional)
  const yKeys = allNumericYKeys.length > 2 ? [allNumericYKeys[0]] : allNumericYKeys;

  // Sort by x-axis and deduplicate to prevent zigzag from duplicate x-values
  const cleanRows = sortAndDedup(rows);

  const series = yKeys.map((key, i) => ({
    id: key.replace(/_/g, " "),
    color: CHART_COLORS[i % CHART_COLORS.length],
    data: cleanRows.map((row) => ({
      x: String(row[0]),
      y: Number(row[columns.indexOf(key)]) || 0,
    })),
  }));

  const allX = cleanRows.map((r) => String(r[0]));
  const tickValues = computeTickValues(allX);

  return (
    <ResponsiveLine
      data={series}
      theme={nivoTheme}
      colors={yKeys.map((_, i) => CHART_COLORS[i % CHART_COLORS.length])}
      margin={{ top: 12, right: 16, bottom: 34, left: 52 }}
      xScale={{ type: "point" }}
      yScale={{ type: "linear", min: "auto", max: "auto", stacked: false }}
      curve="catmullRom"
      lineWidth={2}
      enablePoints={false}
      enableGridX={false}
      enableGridY={true}
      layers={["grid", "axes", "areas", "lines", "crosshair", "slices", ActivePointLayer, "mesh", "legends"]}
      axisBottom={{
        tickSize: 0,
        tickPadding: 8,
        tickValues,
        format: formatAxisLabel,
      }}
      axisLeft={{
        tickSize: 0,
        tickPadding: 8,
        format: (v) => formatTooltipValue(v),
        tickValues: 5,
      }}
      enableSlices="x"
      sliceTooltip={({ slice }) => (
        <div style={tt.wrap}>
          <div style={tt.label}>{formatAxisLabel(String(slice.points[0].data.x))}</div>
          {slice.points.map((point) => (
            <div key={point.id} style={tt.row}>
              <div style={{ ...tt.dot, background: point.seriesColor }} />
              <span style={tt.name}>{point.seriesId}:</span>
              <span style={tt.val}>{formatTooltipValue(point.data.y)}</span>
            </div>
          ))}
        </div>
      )}
      animate={true}
      motionConfig="gentle"
      legends={yKeys.length > 1 ? [{
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
