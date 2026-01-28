# Quicknode RPC Usage Alerting

Monitor your Quicknode RPC credit usage and receive proactive alerts before hitting your limits. This tool uses the [Console API Usage endpoint](https://www.quicknode.com/docs/console-api/usage/v0-usage-rpc) to check your current billing period usage, predict end-of-month consumption, and send notifications through your preferred alerting channels.

## Features

- **Real-time Usage Monitoring**: Check current credit consumption against your plan limits
- **Predictive Analytics**: Forecasts monthly usage based on current consumption rate
- **Days-Until-Limit Calculation**: Know exactly when you'll hit your limit at the current rate
- **Multi-Channel Alerting**: Send alerts to Slack, PagerDuty, Discord, Opsgenie, Email, or custom webhooks
- **Configurable Thresholds**: Set warning (default 80%) and critical (default 95%) alert levels
- **Overage Detection**: Automatic critical alerts when overages occur
- **Historical Data**: View usage for any past billing period
- **Detailed Breakdowns**: Analyze usage by endpoint, chain, or RPC method

## Supported Alerting Channels

| Channel | Use Case | Setup Link |
|---------|----------|------------|
| **Slack** | Team notifications via webhook | [Create Webhook](https://api.slack.com/messaging/webhooks) |
| **PagerDuty** | On-call alerting and incident management | [Events API v2](https://support.pagerduty.com/docs/services-and-integrations) |
| **Discord** | Team/community notifications | Server Settings > Integrations |
| **Opsgenie** | Alert management and escalation | [API Key Management](https://docs.opsgenie.com/docs/api-key-management) |
| **Email** | Direct notifications via SendGrid | [SendGrid API Keys](https://app.sendgrid.com/settings/api_keys) |
| **Generic Webhook** | Custom integrations (Zapier, n8n, etc.) | Any HTTP endpoint |

## Prerequisites

- Node.js 18+ (for native `fetch` support)
- Quicknode account with a paid plan
- API key with `CONSOLE_REST` permission ([Create API Key](https://dashboard.quicknode.com/api-keys))

## Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/quiknode-labs/qn-guide-examples.git
   cd qn-guide-examples/console-api/usage-alerting
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   ```

4. **Add your API key** to `.env`:
   ```
   QUICKNODE_API_KEY=your_api_key_here
   ```

5. **Check your usage** (no alerts sent):
   ```bash
   npm run check
   ```

## Usage

### Check Mode (Preview Only)

See your current usage and predictions without sending alerts:

```bash
npm run check
```

Example output:
```
=== Quicknode RPC Usage Report ===
Period: 2024-01-01 00:00:00 UTC - 2024-01-15 14:30:00 UTC
        Timestamps: 1704067200 - 1705329000
Days in Period:    15 elapsed, 16 remaining
----------------------------------
Credits Used:      450,000
Credits Remaining: 550,000
Limit:             1,000,000
Current Usage:     45.0%
----------------------------------
PREDICTIONS
Daily Average:     30,000 credits/day
Projected Monthly: 930,000 credits (93.0%)
Status:            On track to stay within limit
==================================

Thresholds: Warning=80%, Critical=95%
Would trigger: No alert
```

### Historical Data

View usage for a specific month:

```bash
# Check December 2025
npm run history 2025-12

# Check month 6 of current year
npm run history 6
```

Example output:
```
=== Quicknode RPC Usage Report (Historical) ===
Period: 2025-12-01 00:00:00 UTC - 2025-12-31 23:59:59 UTC
        Timestamps: 1733011200 - 1735689599
------------------------------------------------
Credits Used:      1,234,567
Limit:             No limit set
================================================
```

### Detailed Breakdowns

Analyze your usage with granular breakdowns:

```bash
# Usage by endpoint
npm run by-endpoint

# Usage by blockchain
npm run by-chain

# Usage by RPC method
npm run by-method

# All detailed reports at once
npm run detailed
```

**By Chain Example:**
```
=== Quicknode RPC Usage by Chain ===
------------------------------------

sol                 496,830 credits   48.8%  ██████████
matic               284,260 credits   27.9%  ██████
eth                   5,700 credits    0.6%  ▏
base                  4,990 credits    0.5%  ▏
------------------------------------
TOTAL                 791,780 credits
====================================
```

**By Method Example:**
```
=== Quicknode RPC Usage by Method ===
-------------------------------------

getaccountinfo Archive       276,600 credits   27.2%  █████ [Archive]
eth_getlogs Archive          224,130 credits   22.0%  ████ [Archive]
gettransaction Archive       184,800 credits   18.2%  ████ [Archive]
-------------------------------------
TOTAL                      1,017,860 credits  (37 methods)
=====================================
```

### Run with Alerts

Check usage and send alerts if thresholds are exceeded:

```bash
npm run dev    # Development
npm start      # Production (after npm run build)
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `QUICKNODE_API_KEY` | Yes | - | Your Quicknode API key |
| `ALERT_THRESHOLD_WARNING` | No | 80 | Warning threshold (%) |
| `ALERT_THRESHOLD_CRITICAL` | No | 95 | Critical threshold (%) |

### Alert Thresholds

Alerts trigger based on:

1. **Current usage** exceeds threshold
2. **Projected usage** will exceed limit (warning if >3 days away, critical if ≤3 days)
3. **Overages detected** (always critical)

## Configuring Alerting Channels

Add the relevant variables to your `.env` file:

### Slack

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
```

### PagerDuty

```env
PAGERDUTY_ROUTING_KEY=your_routing_key
```

### Discord

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/XXX/YYY
```

### Opsgenie

```env
OPSGENIE_API_KEY=your_api_key
```

### Email (SendGrid)

```env
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=alerts@yourdomain.com
ALERT_EMAIL_RECIPIENTS=team@example.com,oncall@example.com
```

### Generic Webhook

```env
GENERIC_WEBHOOK_URL=https://your-webhook-endpoint.com
```

Payload format:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "quicknode-usage-monitor",
  "severity": "warning",
  "title": "Quicknode RPC Usage Warning",
  "message": "Your Quicknode RPC usage has reached 82.5% of your limit...",
  "data": {
    "usage_percent": 82.5,
    "credits_used": 825000,
    "credits_remaining": 175000,
    "limit": 1000000,
    "overages": 0
  },
  "prediction": {
    "daily_average": 55000,
    "projected_monthly": 1705000,
    "projected_percent": 170.5,
    "days_until_limit": 3,
    "projected_overages": 705000
  }
}
```

## Scheduling

This script is designed to run on a schedule. Options include:

### Cron (Linux/macOS)

```bash
# Check every hour
0 * * * * cd /path/to/usage-alerting && node dist/index.js >> /var/log/quicknode-alerts.log 2>&1

# Check every 6 hours
0 */6 * * * cd /path/to/usage-alerting && node dist/index.js
```

### GitHub Actions

```yaml
name: Quicknode Usage Check
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  check-usage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm start
        env:
          QUICKNODE_API_KEY: ${{ secrets.QUICKNODE_API_KEY }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          ALERT_THRESHOLD_WARNING: 80
          ALERT_THRESHOLD_CRITICAL: 95
```

### AWS Lambda

Package as a Lambda function:

```bash
npm run build
zip -r function.zip dist/ node_modules/ package.json
```

Use CloudWatch Events to trigger on a schedule.

## Prometheus Exporter (Advanced)

For teams using Prometheus/Grafana, this package includes a custom exporter. See [PROMETHEUS.md](./PROMETHEUS.md) for details.

## API Endpoints Used

This tool uses the following Console API endpoints:

| Endpoint | Description |
|----------|-------------|
| [/v0/usage/rpc](https://www.quicknode.com/docs/console-api/usage/v0-usage-rpc) | Overall RPC usage and limits |
| [/v0/usage/rpc/by-endpoint](https://www.quicknode.com/docs/console-api/usage/v0-usage-rpc-by-endpoint) | Usage breakdown by endpoint |
| [/v0/usage/rpc/by-chain](https://www.quicknode.com/docs/console-api/usage/v0-usage-rpc-by-chain) | Usage breakdown by blockchain |
| [/v0/usage/rpc/by-method](https://www.quicknode.com/docs/console-api/usage/v0-usage-rpc-by-method) | Usage breakdown by RPC method |

## Related Resources

- [Console API Documentation](https://www.quicknode.com/docs/console-api)
- [How to Build a Grafana Dashboard](https://www.quicknode.com/guides/quicknode-products/console-api/how-to-build-a-grafana-dashboard-to-monitor-your-rpc-infrastructure)
- [Monitor RPC Usage and Set Up Alerts with Console API](https://www.quicknode.com/guides/quicknode-products/console-api/monitor-rpc-usage-and-set-up-alerts)
