"use client";

import DateRangePicker from "@/components/shared/DateRangePicker";

interface DashboardFilterConfig {
  id: string;
  type: "date_range" | "text" | "select";
  label: string;
}

interface DashboardFilterProps {
  filters: DashboardFilterConfig[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

export default function DashboardFilter({ filters, values, onChange }: DashboardFilterProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex items-center gap-4 p-3 border-b border-border flex-wrap">
      {filters.map((filter) => (
        <div key={filter.id} className="flex items-center gap-2">
          <span className="text-xs text-foreground-light font-mono">{filter.label}:</span>
          {filter.type === "date_range" ? (
            <DateRangePicker
              from={values[`${filter.id}_from`] || ""}
              to={values[`${filter.id}_to`] || ""}
              onChange={(from, to) => {
                onChange({
                  ...values,
                  [`${filter.id}_from`]: from,
                  [`${filter.id}_to`]: to,
                });
              }}
            />
          ) : (
            <input
              type="text"
              value={values[filter.id] || ""}
              onChange={(e) => onChange({ ...values, [filter.id]: e.target.value })}
              className="input-ring text-xs w-32"
              placeholder="Filter..."
            />
          )}
        </div>
      ))}
    </div>
  );
}

export type { DashboardFilterConfig };
