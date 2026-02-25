import type { VizType, QueryResult } from "./types";

// ── Column type detection ───────────────────────────────

function isDateColumn(name: string, values: unknown[]): boolean {
  const datePrefixes = ["date", "time", "block_time", "created", "updated", "timestamp"];
  if (datePrefixes.some((p) => name.toLowerCase().includes(p))) return true;

  // Check if values look like dates
  const sample = values.slice(0, 5).filter(Boolean);
  return sample.length > 0 && sample.every((v) => !isNaN(Date.parse(String(v))));
}

function isNumericColumn(values: unknown[]): boolean {
  const sample = values.slice(0, 10).filter((v) => v !== null && v !== undefined);
  return sample.length > 0 && sample.every((v) => typeof v === "number" || !isNaN(Number(v)));
}

// ── Data shape detection ────────────────────────────────

export type XAxisType = "temporal" | "categorical" | "numeric" | "none";

export interface DataShape {
  xType: XAxisType;
  numericCols: number;       // count of numeric columns (excluding x-axis if numeric)
  categoricalCols: number;   // count of categorical columns
  rowCount: number;
  uniqueXValues: number;
  validVizTypes: VizType[];
}

/** Analyze a QueryResult and return which viz types make sense for the data */
export function detectDataShape(result: QueryResult): DataShape {
  const { columns, rows } = result;
  const ALL_TYPES: VizType[] = ["table", "line", "bar", "area", "pie", "number"];

  if (!rows.length || !columns.length) {
    return { xType: "none", numericCols: 0, categoricalCols: 0, rowCount: 0, uniqueXValues: 0, validVizTypes: ["table"] };
  }

  // Single scalar → only table and number make sense
  if (rows.length === 1 && columns.length <= 2) {
    const allNumeric = rows[0].every((v) => typeof v === "number" || !isNaN(Number(v)));
    if (allNumeric) {
      return { xType: "none", numericCols: columns.length, categoricalCols: 0, rowCount: 1, uniqueXValues: 1, validVizTypes: ["number", "table"] };
    }
  }

  const colValues = columns.map((_, i) => rows.map((r) => r[i]));
  const dateColIndices = columns.map((name, i) => isDateColumn(name, colValues[i]) ? i : -1).filter((i) => i >= 0);
  const numericColIndices = columns.map((_, i) => isNumericColumn(colValues[i]) ? i : -1).filter((i) => i >= 0);
  const categoricalColIndices = columns.map((_, i) => i).filter((i) => !dateColIndices.includes(i) && !numericColIndices.includes(i));

  // Determine x-axis type (first column)
  let xType: XAxisType = "categorical";
  if (dateColIndices.includes(0)) xType = "temporal";
  else if (numericColIndices.includes(0) && categoricalColIndices.length === 0 && dateColIndices.length === 0) xType = "numeric";

  const uniqueXValues = new Set(colValues[0]).size;
  const numericCount = numericColIndices.filter((i) => i !== 0).length;

  const valid: VizType[] = ["table"]; // table is always valid

  // Detail/record queries have multiple string columns (e.g. coin + buyer_address).
  // These are row-level data, not aggregated summaries — only table makes sense.
  const isDetailTable = categoricalColIndices.length >= 2;

  if (isDetailTable) {
    // Only table and maybe number — charts are meaningless for detail rows
    if (numericCount >= 1) valid.push("number");
  } else if (xType === "temporal" && numericCount >= 1) {
    valid.push("line", "area", "bar");
    // Pie doesn't make sense for time series
  } else if (xType === "categorical") {
    valid.push("bar");
    // Pie only if reasonable number of categories and at least 1 numeric col
    if (uniqueXValues <= 12 && numericCount >= 1) valid.push("pie");
    // Line/area don't make sense for categorical — categories have no continuity
  } else if (xType === "numeric") {
    valid.push("bar", "line");
  }

  // Number card is valid if there's numeric data (and not already added)
  if (!isDetailTable && (numericCount >= 1 || numericColIndices.length >= 1)) valid.push("number");

  return {
    xType,
    numericCols: numericCount,
    categoricalCols: categoricalColIndices.length,
    rowCount: rows.length,
    uniqueXValues,
    validVizTypes: ALL_TYPES.filter((t) => valid.includes(t)),
  };
}

/** Get which viz types are valid for the given result */
export function getValidVizTypes(result: QueryResult): VizType[] {
  return detectDataShape(result).validVizTypes;
}

/** If the given vizType is invalid for the data, return the best valid alternative */
export function ensureValidVizType(result: QueryResult, vizType: VizType): VizType {
  const valid = getValidVizTypes(result);
  if (valid.includes(vizType)) return vizType;
  // Fall back to auto-detected type
  return detectVizType(result);
}

// ── Auto-detect best visualization ──────────────────────

export function detectVizType(result: QueryResult): VizType {
  const shape = detectDataShape(result);
  const valid = shape.validVizTypes;

  // Single scalar → number
  if (shape.rowCount === 1 && shape.numericCols >= 1 && valid.includes("number")) {
    return "number";
  }

  // Time series → line (only if valid for this data shape)
  if (shape.xType === "temporal" && shape.numericCols >= 1 && valid.includes("line")) {
    return "line";
  }

  // Categorical → bar
  if (shape.xType === "categorical" && shape.numericCols >= 1 && valid.includes("bar")) {
    return "bar";
  }

  return "table";
}
