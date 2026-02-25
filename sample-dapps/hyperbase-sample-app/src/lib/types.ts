// ── Query Builder Types ─────────────────────────────────

export type FilterOperator =
  | "eq" | "neq" | "gt" | "lt" | "gte" | "lte"
  | "between" | "contains" | "starts_with"
  | "is_null" | "not_null";

export type FilterType = "text" | "number" | "date" | "boolean";

export interface Filter {
  column: string;
  operator: FilterOperator;
  value: string | number | [number, number] | [string, string];
  type: FilterType;
}

export type AggregationFn = "count" | "sum" | "avg" | "min" | "max" | "count_distinct";

export interface Aggregation {
  fn: AggregationFn;
  column?: string;
  alias?: string;
}

export type DateBucket = "minute" | "hour" | "day" | "week" | "month" | "quarter" | "year";

export interface GroupBy {
  column: string;
  dateBucket?: DateBucket;
}

export interface Sort {
  column: string;
  direction: "asc" | "desc";
}

export interface QueryState {
  table: string;
  columns: string[];
  filters: Filter[];
  summarize: Aggregation[];
  groupBy: GroupBy[];
  sort: Sort[];
  limit: number | null;
}

// ── Visualization Types ─────────────────────────────────

export type VizType = "table" | "line" | "bar" | "area" | "pie" | "number";

export interface VizSettings {
  xAxis?: string;
  yAxis?: string[];
  colors?: string[];
  stacked?: boolean;
  showLegend?: boolean;
  numberFormat?: string;
  prefix?: string;
  suffix?: string;
}

// ── Query Results ───────────────────────────────────────

export interface QueryResult {
  columns: string[];
  rows: unknown[][];
  metadata: {
    row_count: number;
    execution_time_ms: number;
  };
}

// ── Schema Types ────────────────────────────────────────

export interface ColumnInfo {
  name: string;
  type: string;
  is_nullable: boolean;
  description?: string;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  row_count?: number;
  description?: string;
  sorting_key?: string;
  partition_key?: string;
}

export interface SchemaResponse {
  tables: TableInfo[];
}

// ── Saved Entities ──────────────────────────────────────

export interface Question {
  id: number;
  name: string;
  description: string | null;
  collection_id: number | null;
  query_type: "builder" | "sql";
  query_json: string | null;
  sql_text: string | null;
  viz_type: VizType;
  viz_settings: string | null;
  public_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Dashboard {
  id: number;
  name: string;
  description: string | null;
  collection_id: number | null;
  filters_json: string | null;
  public_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardCard {
  id: number;
  dashboard_id: number;
  question_id: number | null;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  card_type: "question" | "text" | "heading";
  text_content: string | null;
  filter_mapping: string | null;
  created_at: string;
}

export interface Collection {
  id: number;
  name: string;
  description: string | null;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
}

// ── API payloads ────────────────────────────────────────

export interface QueryRequest {
  sql: string;
  max_rows?: number;
}

export interface SaveQuestionPayload {
  name: string;
  description?: string;
  collection_id?: number | null;
  query_type: "builder" | "sql";
  query_json?: QueryState;
  sql_text?: string;
  viz_type?: VizType;
  viz_settings?: VizSettings;
}
