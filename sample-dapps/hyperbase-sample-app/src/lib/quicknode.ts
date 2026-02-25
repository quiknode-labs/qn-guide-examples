import type { QueryResult, SchemaResponse, TableInfo, ColumnInfo } from "./types";

const API_BASE = "https://api.quicknode.com/sql/rest/v1";
const CLUSTER_ID = "hyperliquid-core-mainnet";

// ── Concurrency Limiter ─────────────────────────────────
// Prevents overwhelming the Quicknode API when dashboards load many cards at once
const MAX_CONCURRENT = 2;
let running = 0;
const queue: Array<{ resolve: () => void }> = [];

async function acquireSlot(): Promise<void> {
  if (running < MAX_CONCURRENT) {
    running++;
    return;
  }
  return new Promise<void>((resolve) => {
    queue.push({ resolve });
  });
}

function releaseSlot(): void {
  running--;
  const next = queue.shift();
  if (next) {
    running++;
    next.resolve();
  }
}

function getApiKey(): string {
  const key = process.env.QUICKNODE_API_KEY;
  if (!key) throw new Error("QUICKNODE_API_KEY environment variable not set");
  return key;
}

function headers(): HeadersInit {
  return {
    "x-api-key": getApiKey(),
    "Content-Type": "application/json",
    "accept": "application/json",
  };
}

// ── Execute SQL Query ───────────────────────────────────

export async function executeQuery(sql: string, maxRows = 1000): Promise<QueryResult> {
  // Inject LIMIT if not present (safety net)
  const hasLimit = /\bLIMIT\b/i.test(sql);
  const finalSql = hasLimit ? sql : `${sql} LIMIT ${maxRows}`;

  // Wait for a concurrency slot before hitting the API
  await acquireSlot();

  try {
    // Retry with backoff
    let lastError: Error = new Error("Query failed");
    for (let attempt = 0; attempt < 3; attempt++) {
      const start = Date.now();
      try {
        const res = await fetch(`${API_BASE}/query`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            query: finalSql,
            clusterId: CLUSTER_ID,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Query failed (${res.status}): ${text}`);
        }

        const data = await res.json();
        const elapsed = Date.now() - start;

        const meta: { name: string; type: string }[] = data.meta || [];
        const columnNames = meta.map((m) => m.name);
        const rows = (data.data || []).map((row: Record<string, unknown>) =>
          columnNames.map((col) => row[col] ?? null)
        );

        return {
          columns: columnNames,
          rows,
          metadata: {
            row_count: data.rows || rows.length,
            execution_time_ms: data.statistics?.elapsed
              ? Math.round(data.statistics.elapsed * 1000)
              : elapsed,
          },
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
    throw lastError;
  } finally {
    releaseSlot();
  }
}

// ── Fetch Schema (with in-memory cache) ─────────────────

let schemaCache: SchemaResponse | null = null;
let schemaCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchSchema(): Promise<SchemaResponse> {
  if (schemaCache && Date.now() - schemaCacheTime < CACHE_TTL) {
    return schemaCache;
  }

  const res = await fetch(`${API_BASE}/schema`, {
    method: "GET",
    headers: headers(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Schema fetch failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  // Quicknode returns: [ { chain, cluster_id, tables: [...] } ]
  // Find the Hyperliquid cluster
  const clusters = Array.isArray(data) ? data : [data];
  const cluster = clusters.find(
    (c: Record<string, unknown>) =>
      c.cluster_id === CLUSTER_ID ||
      (c.chain as string || "").toLowerCase().includes("hyperliquid")
  );

  if (!cluster) {
    throw new Error("Hyperliquid cluster not found in schema response");
  }

  const rawTables = cluster.tables || [];

  const tables: TableInfo[] = rawTables.map((t: Record<string, unknown>) => ({
    name: t.name as string,
    columns: ((t.columns || []) as { name: string; type: string }[]).map((c): ColumnInfo => ({
      name: c.name,
      type: c.type,
      is_nullable: (c.type || "").includes("Nullable"),
    })),
    row_count: (t.total_rows || 0) as number,
    sorting_key: Array.isArray(t.sorting_key) ? (t.sorting_key as string[]).join(", ") : (t.sorting_key || "") as string,
    partition_key: (t.partition_key || "") as string,
  }));

  schemaCache = { tables };
  schemaCacheTime = Date.now();

  return schemaCache;
}
