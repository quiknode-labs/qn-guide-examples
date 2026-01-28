import dotenv from "dotenv";

dotenv.config();

export interface Config {
  quicknodeApiKey: string;
  thresholds: {
    warning: number;
    critical: number;
  };
  channels: {
    slack?: { webhookUrl: string };
    pagerduty?: { routingKey: string };
    discord?: { webhookUrl: string };
    opsgenie?: { apiKey: string };
    sendgrid?: {
      apiKey: string;
      fromEmail: string;
      recipients: string[];
    };
    genericWebhook?: { url: string };
  };
}

export function loadConfig(): Config {
  const apiKey = process.env.QUICKNODE_API_KEY;
  if (!apiKey) {
    throw new Error("QUICKNODE_API_KEY is required");
  }

  const channels: Config["channels"] = {};

  if (process.env.SLACK_WEBHOOK_URL) {
    channels.slack = { webhookUrl: process.env.SLACK_WEBHOOK_URL };
  }

  if (process.env.PAGERDUTY_ROUTING_KEY) {
    channels.pagerduty = { routingKey: process.env.PAGERDUTY_ROUTING_KEY };
  }

  if (process.env.DISCORD_WEBHOOK_URL) {
    channels.discord = { webhookUrl: process.env.DISCORD_WEBHOOK_URL };
  }

  if (process.env.OPSGENIE_API_KEY) {
    channels.opsgenie = { apiKey: process.env.OPSGENIE_API_KEY };
  }

  if (
    process.env.SENDGRID_API_KEY &&
    process.env.SENDGRID_FROM_EMAIL &&
    process.env.ALERT_EMAIL_RECIPIENTS
  ) {
    channels.sendgrid = {
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL,
      recipients: process.env.ALERT_EMAIL_RECIPIENTS.split(",").map((e) =>
        e.trim()
      ),
    };
  }

  if (process.env.GENERIC_WEBHOOK_URL) {
    channels.genericWebhook = { url: process.env.GENERIC_WEBHOOK_URL };
  }

  return {
    quicknodeApiKey: apiKey,
    thresholds: {
      warning: parseInt(process.env.ALERT_THRESHOLD_WARNING || "80", 10),
      critical: parseInt(process.env.ALERT_THRESHOLD_CRITICAL || "95", 10),
    },
    channels,
  };
}
