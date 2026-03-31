// ============================================
// Query Data Types
// ============================================

export const QUERY_CATEGORIES = [
  "Trading",
  "Activity",
  "Fills",
  "Orders",
  "Funding",
  "Infrastructure",
  "Ledger",
  "Markets",
  "Portfolio & Positions",
  "Staking & Rewards",
  "Builders",
  "Analytics",
] as const;

export type QueryCategory = (typeof QUERY_CATEGORIES)[number];

export interface ChartConfig {
  type: "bar" | "line" | "area";
  xKey: string;
  yKeys: string[];
  xLabel?: string;
  yLabel?: string;
}

export interface QueryParameter {
  name: string;
  label: string;
  type: "string" | "number" | "datetime";
  default: string;
  placeholder: string;
  sampleQuery?: string;
}

export interface PrebuiltQuery {
  id: string;
  title: string;
  description: string;
  category: QueryCategory;
  sql: string;
  featured?: boolean;
  useCaseSlug?: string;
  parameterizable?: boolean;
  parameters?: QueryParameter[];
  chartConfig?: ChartConfig;
}

// ============================================
// SQL Explorer API Response Types
// ============================================

export interface ColumnMeta {
  name: string;
  type: string;
}

export interface QueryStatistics {
  elapsed: number;
  rows_read: number;
  bytes_read: number;
}

export interface SQLExplorerResponse {
  meta: ColumnMeta[];
  data: Record<string, unknown>[];
  rows: number;
  rows_before_limit_at_least: number;
  statistics: QueryStatistics;
}

export interface SQLExplorerError {
  error: string;
  message?: string;
}

export type SQLExplorerResult =
  | { success: true; data: SQLExplorerResponse }
  | { success: false; error: string };
