import type { QueryState, Filter, Aggregation, GroupBy } from "./types";
import { DEFAULT_LIMIT, MAX_LIMIT } from "./constants";

// ── Date Bucket → ClickHouse function ───────────────────

function dateBucketFn(column: string, bucket: string): string {
  switch (bucket) {
    case "minute": return `toStartOfMinute(${column})`;
    case "hour": return `toStartOfHour(${column})`;
    case "day": return `toDate(${column})`;
    case "week": return `toStartOfWeek(${column})`;
    case "month": return `toStartOfMonth(${column})`;
    case "quarter": return `toStartOfQuarter(${column})`;
    case "year": return `toYear(${column})`;
    default: return column;
  }
}

// ── Filter → WHERE clause fragment ──────────────────────

function filterToSql(f: Filter): string {
  const col = f.column;

  switch (f.operator) {
    case "eq":
      return f.type === "number" || f.type === "boolean"
        ? `${col} = ${f.value}`
        : `${col} = '${escapeSql(String(f.value))}'`;
    case "neq":
      return f.type === "number"
        ? `${col} != ${f.value}`
        : `${col} != '${escapeSql(String(f.value))}'`;
    case "gt":
      return f.type === "date"
        ? `${col} > '${escapeSql(String(f.value))}'`
        : `${col} > ${f.value}`;
    case "lt":
      return f.type === "date"
        ? `${col} < '${escapeSql(String(f.value))}'`
        : `${col} < ${f.value}`;
    case "gte":
      return `${col} >= ${f.value}`;
    case "lte":
      return `${col} <= ${f.value}`;
    case "between": {
      const [a, b] = f.value as [string | number, string | number];
      if (f.type === "date") {
        return `${col} BETWEEN '${escapeSql(String(a))}' AND '${escapeSql(String(b))}'`;
      }
      return `${col} BETWEEN ${a} AND ${b}`;
    }
    case "contains":
      return `${col} LIKE '%${escapeSql(String(f.value))}%'`;
    case "starts_with":
      return `${col} LIKE '${escapeSql(String(f.value))}%'`;
    case "is_null":
      return `${col} IS NULL`;
    case "not_null":
      return `${col} IS NOT NULL`;
    default:
      return "1=1";
  }
}

// ── Aggregation → SELECT expression ─────────────────────

function aggregationToSql(agg: Aggregation): string {
  const alias = agg.alias || `${agg.fn}_${agg.column || "all"}`;

  switch (agg.fn) {
    case "count":
      return agg.column ? `count(${agg.column}) AS ${alias}` : `count(*) AS ${alias}`;
    case "count_distinct":
      return `count(DISTINCT ${agg.column}) AS ${alias}`;
    case "sum":
      return `sum(${agg.column}) AS ${alias}`;
    case "avg":
      return `avg(${agg.column}) AS ${alias}`;
    case "min":
      return `min(${agg.column}) AS ${alias}`;
    case "max":
      return `max(${agg.column}) AS ${alias}`;
    default:
      return `count(*) AS ${alias}`;
  }
}

// ── GroupBy → SELECT + GROUP BY expressions ─────────────

function groupByToSelectSql(gb: GroupBy): string {
  if (gb.dateBucket) {
    const expr = dateBucketFn(gb.column, gb.dateBucket);
    return `${expr} AS ${gb.column}_${gb.dateBucket}`;
  }
  return gb.column;
}

function groupByToGroupSql(gb: GroupBy): string {
  if (gb.dateBucket) {
    return `${gb.column}_${gb.dateBucket}`;
  }
  return gb.column;
}

// ── Main: QueryState → SQL ──────────────────────────────

export function generateSql(state: QueryState): string {
  const parts: string[] = [];

  // SELECT
  const selectParts: string[] = [];

  if (state.groupBy.length > 0) {
    selectParts.push(...state.groupBy.map(groupByToSelectSql));
  }

  if (state.summarize.length > 0) {
    selectParts.push(...state.summarize.map(aggregationToSql));
  } else if (state.columns.length > 0) {
    selectParts.push(...state.columns);
  }

  if (selectParts.length === 0) {
    selectParts.push("*");
  }

  parts.push(`SELECT ${selectParts.join(", ")}`);

  // FROM
  parts.push(`FROM ${state.table}`);

  // WHERE
  if (state.filters.length > 0) {
    const conditions = state.filters.map(filterToSql);
    parts.push(`WHERE ${conditions.join(" AND ")}`);
  }

  // GROUP BY
  if (state.groupBy.length > 0) {
    parts.push(`GROUP BY ${state.groupBy.map(groupByToGroupSql).join(", ")}`);
  }

  // ORDER BY
  if (state.sort.length > 0) {
    const orderParts = state.sort.map((s) => `${s.column} ${s.direction.toUpperCase()}`);
    parts.push(`ORDER BY ${orderParts.join(", ")}`);
  } else if (state.groupBy.length > 0) {
    // Auto-sort by first group-by column
    parts.push(`ORDER BY ${groupByToGroupSql(state.groupBy[0])} ASC`);
  }

  // LIMIT
  const limit = Math.min(state.limit || DEFAULT_LIMIT, MAX_LIMIT);
  parts.push(`LIMIT ${limit}`);

  return parts.join("\n");
}

// ── Helper: escape single quotes ────────────────────────

function escapeSql(value: string): string {
  return value.replace(/'/g, "\\'");
}
