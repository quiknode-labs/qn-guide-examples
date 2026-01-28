import { Config } from "./config";

export type AlertSeverity = "warning" | "critical";

export interface AlertPrediction {
  dailyAverage: number;
  projectedMonthly: number;
  projectedPercent: number;
  daysUntilLimit: number | null;
  projectedOverages: number;
}

export interface AlertPayload {
  severity: AlertSeverity;
  title: string;
  message: string;
  usagePercent: number;
  creditsUsed: number;
  creditsRemaining: number;
  limit: number;
  overages: number;
  prediction?: AlertPrediction;
}

// Slack
async function sendSlack(
  webhookUrl: string,
  alert: AlertPayload
): Promise<void> {
  const color = alert.severity === "critical" ? "#dc3545" : "#ffc107";
  const emoji = alert.severity === "critical" ? ":rotating_light:" : ":warning:";

  const payload = {
    attachments: [
      {
        color,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `${emoji} ${alert.title}`,
              emoji: true,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: alert.message,
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Current Usage:*\n${alert.usagePercent.toFixed(1)}%`,
              },
              {
                type: "mrkdwn",
                text: `*Credits Used:*\n${alert.creditsUsed.toLocaleString()}`,
              },
              {
                type: "mrkdwn",
                text: `*Credits Remaining:*\n${alert.creditsRemaining.toLocaleString()}`,
              },
              {
                type: "mrkdwn",
                text: `*Limit:*\n${alert.limit.toLocaleString()}`,
              },
            ],
          },
          ...(alert.prediction
            ? [
                {
                  type: "section",
                  fields: [
                    {
                      type: "mrkdwn",
                      text: `*Daily Average:*\n${alert.prediction.dailyAverage.toLocaleString()}/day`,
                    },
                    {
                      type: "mrkdwn",
                      text: `*Projected Monthly:*\n${alert.prediction.projectedMonthly.toLocaleString()} (${alert.prediction.projectedPercent.toFixed(1)}%)`,
                    },
                    ...(alert.prediction.daysUntilLimit !== null
                      ? [
                          {
                            type: "mrkdwn",
                            text: `*Days Until Limit:*\n${alert.prediction.daysUntilLimit === 0 ? "At limit!" : `~${alert.prediction.daysUntilLimit} days`}`,
                          },
                        ]
                      : []),
                    ...(alert.prediction.projectedOverages > 0
                      ? [
                          {
                            type: "mrkdwn",
                            text: `*Projected Overages:*\n${alert.prediction.projectedOverages.toLocaleString()}`,
                          },
                        ]
                      : []),
                  ],
                },
              ]
            : []),
          ...(alert.overages > 0
            ? [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `:money_with_wings: *Current Overages:* ${alert.overages.toLocaleString()} credits`,
                  },
                },
              ]
            : []),
        ],
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.status}`);
  }
}

// PagerDuty Events API v2
async function sendPagerDuty(
  routingKey: string,
  alert: AlertPayload
): Promise<void> {
  const severity = alert.severity === "critical" ? "critical" : "warning";

  const payload = {
    routing_key: routingKey,
    event_action: "trigger",
    dedup_key: `quicknode-usage-${alert.severity}`,
    payload: {
      summary: `${alert.title}: ${alert.usagePercent.toFixed(1)}% of limit used`,
      severity,
      source: "Quicknode Usage Monitor",
      custom_details: {
        usage_percent: alert.usagePercent,
        credits_used: alert.creditsUsed,
        credits_remaining: alert.creditsRemaining,
        limit: alert.limit,
        overages: alert.overages,
        ...(alert.prediction && {
          daily_average: alert.prediction.dailyAverage,
          projected_monthly: alert.prediction.projectedMonthly,
          projected_percent: alert.prediction.projectedPercent,
          days_until_limit: alert.prediction.daysUntilLimit,
          projected_overages: alert.prediction.projectedOverages,
        }),
      },
    },
  };

  const response = await fetch("https://events.pagerduty.com/v2/enqueue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PagerDuty API failed: ${response.status} - ${text}`);
  }
}

// Discord Webhook
async function sendDiscord(
  webhookUrl: string,
  alert: AlertPayload
): Promise<void> {
  const color = alert.severity === "critical" ? 0xdc3545 : 0xffc107;
  const emoji = alert.severity === "critical" ? "🚨" : "⚠️";

  const payload = {
    embeds: [
      {
        title: `${emoji} ${alert.title}`,
        description: alert.message,
        color,
        fields: [
          {
            name: "Current Usage",
            value: `${alert.usagePercent.toFixed(1)}%`,
            inline: true,
          },
          {
            name: "Credits Used",
            value: alert.creditsUsed.toLocaleString(),
            inline: true,
          },
          {
            name: "Credits Remaining",
            value: alert.creditsRemaining.toLocaleString(),
            inline: true,
          },
          { name: "Limit", value: alert.limit.toLocaleString(), inline: true },
          ...(alert.prediction
            ? [
                {
                  name: "Daily Average",
                  value: `${alert.prediction.dailyAverage.toLocaleString()}/day`,
                  inline: true,
                },
                {
                  name: "Projected Monthly",
                  value: `${alert.prediction.projectedMonthly.toLocaleString()} (${alert.prediction.projectedPercent.toFixed(1)}%)`,
                  inline: true,
                },
                ...(alert.prediction.daysUntilLimit !== null
                  ? [
                      {
                        name: "Days Until Limit",
                        value:
                          alert.prediction.daysUntilLimit === 0
                            ? "At limit!"
                            : `~${alert.prediction.daysUntilLimit} days`,
                        inline: true,
                      },
                    ]
                  : []),
              ]
            : []),
          ...(alert.overages > 0
            ? [
                {
                  name: "Current Overages",
                  value: alert.overages.toLocaleString(),
                  inline: true,
                },
              ]
            : []),
          ...(alert.prediction && alert.prediction.projectedOverages > 0
            ? [
                {
                  name: "Projected Overages",
                  value: alert.prediction.projectedOverages.toLocaleString(),
                  inline: true,
                },
              ]
            : []),
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed: ${response.status}`);
  }
}

// Opsgenie
async function sendOpsgenie(
  apiKey: string,
  alert: AlertPayload
): Promise<void> {
  const priority = alert.severity === "critical" ? "P1" : "P3";

  const payload = {
    message: alert.title,
    description: alert.message,
    priority,
    tags: ["quicknode", "usage", alert.severity],
    details: {
      usage_percent: String(alert.usagePercent),
      credits_used: String(alert.creditsUsed),
      credits_remaining: String(alert.creditsRemaining),
      limit: String(alert.limit),
      overages: String(alert.overages),
      ...(alert.prediction && {
        daily_average: String(alert.prediction.dailyAverage),
        projected_monthly: String(alert.prediction.projectedMonthly),
        projected_percent: String(alert.prediction.projectedPercent),
        days_until_limit: String(alert.prediction.daysUntilLimit ?? "N/A"),
        projected_overages: String(alert.prediction.projectedOverages),
      }),
    },
  };

  const response = await fetch("https://api.opsgenie.com/v2/alerts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `GenieKey ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Opsgenie API failed: ${response.status} - ${text}`);
  }
}

// SendGrid Email
async function sendEmail(
  config: NonNullable<Config["channels"]["sendgrid"]>,
  alert: AlertPayload
): Promise<void> {
  const emoji = alert.severity === "critical" ? "🚨" : "⚠️";

  const predictionRows = alert.prediction
    ? `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Daily Average</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${alert.prediction.dailyAverage.toLocaleString()} credits/day</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Projected Monthly</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${alert.prediction.projectedMonthly.toLocaleString()} (${alert.prediction.projectedPercent.toFixed(1)}%)</td>
      </tr>
      ${
        alert.prediction.daysUntilLimit !== null
          ? `<tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Days Until Limit</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd; ${alert.prediction.daysUntilLimit <= 3 ? "color: #dc3545; font-weight: bold;" : ""}">${alert.prediction.daysUntilLimit === 0 ? "At limit!" : `~${alert.prediction.daysUntilLimit} days`}</td>
      </tr>`
          : ""
      }
      ${
        alert.prediction.projectedOverages > 0
          ? `<tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Projected Overages</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd; color: #dc3545;">${alert.prediction.projectedOverages.toLocaleString()} credits</td>
      </tr>`
          : ""
      }`
    : "";

  const htmlContent = `
    <h2>${emoji} ${alert.title}</h2>
    <p>${alert.message}</p>
    <h3>Current Usage</h3>
    <table style="border-collapse: collapse; margin-top: 10px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Usage</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${alert.usagePercent.toFixed(1)}%</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Credits Used</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${alert.creditsUsed.toLocaleString()}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Credits Remaining</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${alert.creditsRemaining.toLocaleString()}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Limit</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${alert.limit.toLocaleString()}</td>
      </tr>
      ${
        alert.overages > 0
          ? `<tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Current Overages</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd; color: #dc3545;">${alert.overages.toLocaleString()}</td>
      </tr>`
          : ""
      }
    </table>
    ${
      alert.prediction
        ? `<h3 style="margin-top: 20px;">Predictions</h3>
    <table style="border-collapse: collapse; margin-top: 10px;">
      ${predictionRows}
    </table>`
        : ""
    }
    <p style="margin-top: 20px; color: #666; font-size: 12px;">
      This alert was generated by Quicknode Usage Monitor
    </p>
  `;

  const payload = {
    personalizations: config.recipients.map((email) => ({ to: [{ email }] })),
    from: { email: config.fromEmail },
    subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
    content: [{ type: "text/html", value: htmlContent }],
  };

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SendGrid API failed: ${response.status} - ${text}`);
  }
}

// Generic Webhook
async function sendGenericWebhook(
  url: string,
  alert: AlertPayload
): Promise<void> {
  const payload = {
    timestamp: new Date().toISOString(),
    source: "quicknode-usage-monitor",
    severity: alert.severity,
    title: alert.title,
    message: alert.message,
    data: {
      usage_percent: alert.usagePercent,
      credits_used: alert.creditsUsed,
      credits_remaining: alert.creditsRemaining,
      limit: alert.limit,
      overages: alert.overages,
    },
    ...(alert.prediction && {
      prediction: {
        daily_average: alert.prediction.dailyAverage,
        projected_monthly: alert.prediction.projectedMonthly,
        projected_percent: alert.prediction.projectedPercent,
        days_until_limit: alert.prediction.daysUntilLimit,
        projected_overages: alert.prediction.projectedOverages,
      },
    }),
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Generic webhook failed: ${response.status}`);
  }
}

// Main dispatch function
export async function sendAlerts(
  config: Config,
  alert: AlertPayload
): Promise<{ channel: string; success: boolean; error?: string }[]> {
  const results: { channel: string; success: boolean; error?: string }[] = [];

  if (config.channels.slack) {
    try {
      await sendSlack(config.channels.slack.webhookUrl, alert);
      results.push({ channel: "slack", success: true });
    } catch (err) {
      results.push({
        channel: "slack",
        success: false,
        error: String(err),
      });
    }
  }

  if (config.channels.pagerduty) {
    try {
      await sendPagerDuty(config.channels.pagerduty.routingKey, alert);
      results.push({ channel: "pagerduty", success: true });
    } catch (err) {
      results.push({
        channel: "pagerduty",
        success: false,
        error: String(err),
      });
    }
  }

  if (config.channels.discord) {
    try {
      await sendDiscord(config.channels.discord.webhookUrl, alert);
      results.push({ channel: "discord", success: true });
    } catch (err) {
      results.push({
        channel: "discord",
        success: false,
        error: String(err),
      });
    }
  }

  if (config.channels.opsgenie) {
    try {
      await sendOpsgenie(config.channels.opsgenie.apiKey, alert);
      results.push({ channel: "opsgenie", success: true });
    } catch (err) {
      results.push({
        channel: "opsgenie",
        success: false,
        error: String(err),
      });
    }
  }

  if (config.channels.sendgrid) {
    try {
      await sendEmail(config.channels.sendgrid, alert);
      results.push({ channel: "email", success: true });
    } catch (err) {
      results.push({
        channel: "email",
        success: false,
        error: String(err),
      });
    }
  }

  if (config.channels.genericWebhook) {
    try {
      await sendGenericWebhook(config.channels.genericWebhook.url, alert);
      results.push({ channel: "webhook", success: true });
    } catch (err) {
      results.push({
        channel: "webhook",
        success: false,
        error: String(err),
      });
    }
  }

  return results;
}
