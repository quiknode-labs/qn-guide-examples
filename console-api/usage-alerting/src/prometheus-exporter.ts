/**
 * Custom Prometheus Exporter for Quicknode Usage Metrics
 *
 * This exposes v0/usage/rpc data as Prometheus metrics, allowing you to:
 * - Build Grafana dashboards with usage limits and remaining credits
 * - Set up Prometheus alerting rules (AlertManager)
 * - Combine with metrics from other vendors in a single Prometheus instance
 *
 * Run: npx ts-node src/prometheus-exporter.ts
 * Then configure Prometheus to scrape http://localhost:9091/metrics
 */

import http from "http";
import dotenv from "dotenv";

dotenv.config();

const PORT = parseInt(process.env.EXPORTER_PORT || "9091", 10);
const API_KEY = process.env.QUICKNODE_API_KEY;

if (!API_KEY) {
  console.error("QUICKNODE_API_KEY is required");
  process.exit(1);
}

interface UsageData {
  credits_used: number;
  credits_remaining: number | null;
  limit: number | null;
  overages: number | null;
  start_time: number;
  end_time: number;
}

interface UsageResponse {
  data: UsageData;
  error: string | null;
}

async function fetchUsage(): Promise<UsageResponse> {
  // Don't pass end_time - API automatically uses current date and returns proper limit values
  const url = "https://api.quicknode.com/v0/usage/rpc";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": API_KEY!,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`API failed: ${response.status}`);
  }

  return response.json() as Promise<UsageResponse>;
}

function formatPrometheusMetrics(usage: UsageData): string {
  const limit = usage.limit ?? 0;
  const creditsRemaining = usage.credits_remaining ?? 0;
  const overages = usage.overages ?? 0;
  const usagePercent = limit > 0 ? (usage.credits_used / limit) * 100 : 0;

  return `# HELP quicknode_credits_used Total RPC credits used in current billing period
# TYPE quicknode_credits_used gauge
quicknode_credits_used ${usage.credits_used}

# HELP quicknode_credits_remaining RPC credits remaining in current billing period
# TYPE quicknode_credits_remaining gauge
quicknode_credits_remaining ${creditsRemaining}

# HELP quicknode_credits_limit Total RPC credit limit for billing period
# TYPE quicknode_credits_limit gauge
quicknode_credits_limit ${limit}

# HELP quicknode_usage_percent Percentage of RPC credit limit used
# TYPE quicknode_usage_percent gauge
quicknode_usage_percent ${usagePercent.toFixed(2)}

# HELP quicknode_overages RPC credits used beyond the limit (overage charges)
# TYPE quicknode_overages gauge
quicknode_overages ${overages}

# HELP quicknode_exporter_scrape_success Whether the last scrape was successful (1=success, 0=failure)
# TYPE quicknode_exporter_scrape_success gauge
quicknode_exporter_scrape_success 1
`;
}

function formatErrorMetrics(error: string): string {
  return `# HELP quicknode_exporter_scrape_success Whether the last scrape was successful (1=success, 0=failure)
# TYPE quicknode_exporter_scrape_success gauge
quicknode_exporter_scrape_success 0

# HELP quicknode_exporter_error_info Information about the last error
# TYPE quicknode_exporter_error_info gauge
quicknode_exporter_error_info{error="${error.replace(/"/g, '\\"')}"} 1
`;
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/metrics") {
    try {
      const response = await fetchUsage();

      if (response.error) {
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(formatErrorMetrics(response.error));
        return;
      }

      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(formatPrometheusMetrics(response.data));
    } catch (err) {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(formatErrorMetrics(String(err)));
    }
  } else if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  } else {
    res.writeHead(404);
    res.end("Not found. Try /metrics");
  }
});

server.listen(PORT, () => {
  console.log(`Quicknode Prometheus Exporter running on http://localhost:${PORT}`);
  console.log(`Metrics endpoint: http://localhost:${PORT}/metrics`);
  console.log(`Health endpoint:  http://localhost:${PORT}/health`);
});
