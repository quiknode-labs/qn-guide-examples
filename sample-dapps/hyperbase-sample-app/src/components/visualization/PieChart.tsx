"use client";

import { ResponsivePie } from "@nivo/pie";
import type { QueryResult } from "@/lib/types";
import { CHART_COLORS } from "@/lib/constants";
import { formatTooltipValue, nivoTheme, tt } from "./chart-utils";

interface PieChartProps {
  result: QueryResult;
}

export default function PieChart({ result }: PieChartProps) {
  const { columns, rows } = result;
  if (columns.length < 2 || !rows.length) return null;

  const data = rows
    .slice(0, 10)
    .map((row, i) => ({
      id: String(row[0]),
      label: String(row[0]),
      value: Math.abs(Number(row[1])),
      color: CHART_COLORS[i % CHART_COLORS.length],
    }))
    .filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="h-full w-full flex">
      {/* Chart */}
      <div className="flex-1 min-w-0">
        <ResponsivePie
          data={data}
          theme={nivoTheme}
          colors={data.map((d) => d.color)}
          margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          innerRadius={0.55}
          padAngle={1.5}
          cornerRadius={3}
          activeOuterRadiusOffset={4}
          borderWidth={0}
          enableArcLinkLabels={false}
          arcLabelsSkipAngle={25}
          arcLabelsTextColor="#fff"
          arcLabel={(d) => `${((d.value / total) * 100).toFixed(0)}%`}
          tooltip={({ datum }) => (
            <div style={tt.wrap}>
              <div style={tt.row}>
                <div style={{ ...tt.dot, background: datum.color }} />
                <span style={tt.name}>{datum.label}:</span>
                <span style={tt.val}>{formatTooltipValue(datum.value)}</span>
              </div>
            </div>
          )}
          animate={true}
          motionConfig="gentle"
        />
      </div>
      {/* Legend */}
      <div className="w-28 shrink-0 flex flex-col justify-center gap-1.5 pr-2 overflow-y-auto">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 min-w-0">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: d.color }}
            />
            <span className="text-[10px] text-foreground-medium truncate leading-tight">
              {d.label}
            </span>
            <span className="text-[9px] text-foreground-light font-mono ml-auto shrink-0">
              {total > 0 ? `${((d.value / total) * 100).toFixed(0)}%` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
