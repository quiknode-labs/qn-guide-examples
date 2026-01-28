# Custom Prometheus Exporter for Quicknode Usage

This document covers the optional Prometheus exporter included in this package. Use this if you want to integrate Quicknode usage metrics into an existing Prometheus/Grafana monitoring stack.

## Why Use This?

Quicknode provides a built-in Prometheus endpoint (`/v0/prometheus/metrics`) for Enterprise customers, but it focuses on real-time RPC metrics (requests, response times, status codes). It **does not include**:

- `credits_remaining` - How many credits are left
- `limit` - Your plan's credit limit
- `overages` - Credits consumed beyond your limit
- `usage_percent` - Percentage of limit consumed

This custom exporter fills that gap by exposing usage data from the `v0/usage/rpc` REST endpoint as Prometheus metrics.

## Prerequisites

- Completed the [Grafana Dashboard guide](https://www.quicknode.com/guides/quicknode-products/console-api/how-to-build-a-grafana-dashboard-to-monitor-your-rpc-infrastructure) (recommended)
- Prometheus server running
- Node.js 18+

## Quick Start

1. Configure your `.env` file with your API key:
   ```env
   QUICKNODE_API_KEY=your_api_key_here
   EXPORTER_PORT=9091
   ```

2. Start the exporter:
   ```bash
   npm run exporter        # Development
   npm run exporter:start  # Production (after npm run build)
   ```

3. Verify it's working:
   ```bash
   curl http://localhost:9091/metrics
   ```

## Exposed Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `quicknode_credits_used` | gauge | Credits consumed in current billing period |
| `quicknode_credits_remaining` | gauge | Credits available until limit |
| `quicknode_credits_limit` | gauge | Total credit limit for billing period |
| `quicknode_usage_percent` | gauge | Percentage of limit consumed (0-100) |
| `quicknode_overages` | gauge | Credits consumed beyond the limit |
| `quicknode_exporter_scrape_success` | gauge | 1 if scrape succeeded, 0 if failed |

## Prometheus Configuration

Add to your `prometheus.yml`:

```yaml
scrape_configs:
  # Existing Quicknode metrics (Enterprise only)
  - job_name: 'quicknode_prometheus_exporter'
    metrics_path: '/v0/prometheus/metrics'
    scheme: 'https'
    authorization:
      type: 'bearer'
      credentials: 'YOUR_API_KEY'
    static_configs:
      - targets: ['api.quicknode.com']

  # Custom usage metrics (this exporter)
  - job_name: 'quicknode_usage'
    scrape_interval: 5m  # Usage data doesn't change frequently
    static_configs:
      - targets: ['localhost:9091']
```

> Note: If you're running Prometheus in Docker and the exporter on your host machine, update the target to use `host.docker.internal:9091` and add the following `extra_hosts` to your Docker Compose file:

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    extra_hosts:
      - "host.docker.internal:host-gateway"
    // other configurations...
```

## Grafana Dashboard

A pre-built Grafana dashboard is included in `console-api/usage-alerting/dashboards/quicknode-usage-alerting-grafana.json`. Import it directly into your Grafana instance.

### Dashboard Features

The dashboard includes:

| Panel | Description |
|-------|-------------|
| **Credit Usage Gauge** | Visual gauge with 80% warning and 95% critical thresholds |
| **Credits Used** | Current credits consumed this billing period |
| **Credits Remaining** | Credits available until limit |
| **Credit Limit** | Total credit limit for the period |
| **Overages** | Credits consumed beyond limit (highlighted when > 0) |
| **Days Until Limit** | Estimated days until limit at current rate |
| **Daily Average** | Average daily credit consumption |
| **Projected Monthly** | Estimated total credits for the month |
| **Exporter Status** | Health status of the custom exporter |
| **Usage % Over Time** | Time series with threshold lines |
| **Credits Used vs Remaining** | Comparison chart with limit line |
| **Overage Credits** | Bar chart of overages over time |
| **Days Until Limit Trend** | Track how runway changes over time |

### Import Instructions

1. In Grafana, go to **Dashboards** > **Import**
2. Upload `console-api/usage-alerting/dashboards/quicknode-usage-alerting-grafana.json`
3. Select your Prometheus data source
4. Click **Import**

### Manual Panel Setup

If you prefer to add panels to an existing dashboard:

**Usage Gauge:**
```promql
quicknode_usage_percent
```
With thresholds: Green (0-80%), Yellow (80-95%), Red (95-100%)

**Credits Remaining:**
```promql
quicknode_credits_remaining
```

**Days Until Limit:**
```promql
quicknode_credits_remaining / (quicknode_credits_used / day_of_month(timestamp(quicknode_credits_used)))
```

## Alerting Rules

Add to your Prometheus AlertManager rules:

```yaml
groups:
  - name: quicknode_usage_alerts
    rules:
      - alert: QuicknodeUsageWarning
        expr: quicknode_usage_percent > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Quicknode usage at {{ $value | printf \"%.1f\" }}%"
          description: "RPC credit usage has exceeded 80% of the monthly limit."

      - alert: QuicknodeUsageCritical
        expr: quicknode_usage_percent > 95
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Quicknode usage critical at {{ $value | printf \"%.1f\" }}%"
          description: "RPC credit usage has exceeded 95% of the monthly limit. Immediate action required."

      - alert: QuicknodeOverages
        expr: quicknode_overages > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Quicknode has {{ $value }} credits in overages"
          description: "You have exceeded your credit limit and are now incurring overage charges."

      - alert: QuicknodeExporterDown
        expr: quicknode_exporter_scrape_success == 0
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Quicknode usage exporter is failing"
          description: "The usage exporter has been unable to fetch data for 10 minutes."
```

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `/metrics` | Prometheus metrics endpoint |
| `/health` | Health check (returns "OK") |

## Related Resources

- [How to Build a Grafana Dashboard](https://www.quicknode.com/guides/quicknode-products/console-api/how-to-build-a-grafana-dashboard-to-monitor-your-rpc-infrastructure)
- [Console API Usage Endpoint](https://www.quicknode.com/docs/console-api/usage/v0-usage-rpc)
- [Prometheus Documentation](https://prometheus.io/docs/introduction/overview/)
