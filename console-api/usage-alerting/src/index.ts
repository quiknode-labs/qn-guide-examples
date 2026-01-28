import { loadConfig, Config } from "./config";
import { sendAlerts, AlertPayload, AlertSeverity } from "./channels";

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

interface UsagePrediction {
  daysElapsed: number;
  daysRemaining: number;
  daysInMonth: number;
  averageDailyUsage: number;
  projectedMonthlyUsage: number;
  projectedMonthlyPercent: number;
  daysUntilLimit: number | null; // null if usage rate is 0 or already over limit
  willExceedLimit: boolean;
  projectedOverages: number;
}

interface FetchOptions {
  startTime?: number;
  endTime?: number;
}

// Detailed usage interfaces
interface EndpointMethod {
  method_name: string;
  credits_used: number;
}

interface EndpointUsage {
  name: string;
  label: string;
  chain: string;
  status: string;
  network: string;
  credits_used: number;
  requests: number;
  archive: boolean;
  methods: EndpointMethod[];
}

interface EndpointUsageResponse {
  data: {
    endpoints: EndpointUsage[];
    start_time: number;
    end_time: number;
  };
  error: string | null;
}

interface ChainUsage {
  name: string;
  credits_used: number;
  start_time: number;
  end_time: number;
}

interface ChainUsageResponse {
  data: {
    chains: ChainUsage[];
  };
  error: string | null;
}

interface MethodUsage {
  method_name: string;
  credits_used: number;
  archive: boolean;
  start_time: number;
  end_time: number;
}

interface MethodUsageResponse {
  data: {
    methods: MethodUsage[];
  };
  error: string | null;
}

async function fetchUsage(apiKey: string, options?: FetchOptions): Promise<UsageResponse> {
  // Build URL with optional parameters
  const params = new URLSearchParams();

  if (options?.startTime) {
    params.append("start_time", options.startTime.toString());
  }
  if (options?.endTime) {
    params.append("end_time", options.endTime.toString());
  }

  const queryString = params.toString();
  const url = `https://api.quicknode.com/v0/usage/rpc${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Quicknode API failed: ${response.status} - ${text}`);
  }

  return response.json() as Promise<UsageResponse>;
}

// Fetch usage for a specific month (historical data)
async function fetchUsageForMonth(apiKey: string, year: number, month: number): Promise<UsageResponse> {
  const startOfMonth = new Date(year, month - 1, 1); // month is 1-indexed
  const endOfMonth = new Date(year, month, 0, 23, 59, 59); // Last day of month

  const startTime = Math.floor(startOfMonth.getTime() / 1000);
  const endTime = Math.floor(endOfMonth.getTime() / 1000);

  return fetchUsage(apiKey, { startTime, endTime });
}

// Fetch detailed usage by endpoint
async function fetchUsageByEndpoint(apiKey: string): Promise<EndpointUsageResponse> {
  const url = "https://api.quicknode.com/v0/usage/rpc/by-endpoint";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Quicknode API failed: ${response.status} - ${text}`);
  }

  return response.json() as Promise<EndpointUsageResponse>;
}

// Fetch detailed usage by chain
async function fetchUsageByChain(apiKey: string): Promise<ChainUsageResponse> {
  const url = "https://api.quicknode.com/v0/usage/rpc/by-chain";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Quicknode API failed: ${response.status} - ${text}`);
  }

  return response.json() as Promise<ChainUsageResponse>;
}

// Fetch detailed usage by method
async function fetchUsageByMethod(apiKey: string): Promise<MethodUsageResponse> {
  const url = "https://api.quicknode.com/v0/usage/rpc/by-method";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Quicknode API failed: ${response.status} - ${text}`);
  }

  return response.json() as Promise<MethodUsageResponse>;
}

function calculatePrediction(
  usageData: UsageData,
  now: Date = new Date()
): UsagePrediction {
  // Calculate billing period boundaries
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysInMonth = endOfMonth.getDate();

  // Calculate days elapsed (minimum 1 to avoid division by zero)
  const msElapsed = now.getTime() - startOfMonth.getTime();
  const daysElapsed = Math.max(1, Math.ceil(msElapsed / (1000 * 60 * 60 * 24)));
  const daysRemaining = daysInMonth - daysElapsed;

  // Calculate average daily usage
  const averageDailyUsage = usageData.credits_used / daysElapsed;

  // Handle null limit (treat as no limit)
  const limit = usageData.limit ?? Infinity;
  const creditsRemaining = usageData.credits_remaining ?? (limit - usageData.credits_used);

  // Project monthly usage
  const projectedMonthlyUsage = Math.round(averageDailyUsage * daysInMonth);
  const projectedMonthlyPercent =
    limit > 0 && limit !== Infinity ? (projectedMonthlyUsage / limit) * 100 : 0;

  // Calculate days until limit is reached
  let daysUntilLimit: number | null = null;
  if (averageDailyUsage > 0 && creditsRemaining > 0 && limit !== Infinity) {
    daysUntilLimit = Math.floor(creditsRemaining / averageDailyUsage);
  } else if (creditsRemaining <= 0 && limit !== Infinity) {
    daysUntilLimit = 0; // Already at or over limit
  }

  // Determine if limit will be exceeded this month
  const willExceedLimit = limit !== Infinity && projectedMonthlyUsage > limit;
  const projectedOverages = willExceedLimit
    ? projectedMonthlyUsage - limit
    : 0;

  return {
    daysElapsed,
    daysRemaining,
    daysInMonth,
    averageDailyUsage: Math.round(averageDailyUsage),
    projectedMonthlyUsage,
    projectedMonthlyPercent,
    daysUntilLimit,
    willExceedLimit,
    projectedOverages,
  };
}

function determineAlertLevel(
  usagePercent: number,
  overages: number,
  prediction: UsagePrediction,
  thresholds: Config["thresholds"]
): AlertSeverity | null {
  // Already in overage - critical
  if (overages > 0) {
    return "critical";
  }

  // Currently at critical threshold
  if (usagePercent >= thresholds.critical) {
    return "critical";
  }

  // Projected to exceed limit within the billing period
  if (
    prediction.willExceedLimit &&
    prediction.daysUntilLimit !== null &&
    prediction.daysUntilLimit <= 3
  ) {
    return "critical";
  }

  // Currently at warning threshold
  if (usagePercent >= thresholds.warning) {
    return "warning";
  }

  // Projected to exceed limit but more than 3 days away
  if (prediction.willExceedLimit) {
    return "warning";
  }

  return null;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTimeUTC(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toISOString().replace("T", " ").replace(".000Z", " UTC");
}

function formatPeriodWithTimestamps(startTime: number, endTime: number): string {
  return `${formatDateTimeUTC(startTime)} - ${formatDateTimeUTC(endTime)}\n        Timestamps: ${startTime} - ${endTime}`;
}

function formatPredictionMessage(
  prediction: UsagePrediction,
  usageData: UsageData
): string {
  const parts: string[] = [];

  const limit = usageData.limit ?? Infinity;

  if (limit === Infinity) {
    parts.push(
      `At current rate (${prediction.averageDailyUsage.toLocaleString()} credits/day), you're projected to use ${prediction.projectedMonthlyUsage.toLocaleString()} credits this month.`
    );
  } else {
    parts.push(
      `At current rate (${prediction.averageDailyUsage.toLocaleString()} credits/day), you're projected to use ${prediction.projectedMonthlyUsage.toLocaleString()} credits this month (${prediction.projectedMonthlyPercent.toFixed(1)}% of limit).`
    );
  }

  if (prediction.willExceedLimit) {
    if (prediction.daysUntilLimit !== null && prediction.daysUntilLimit > 0) {
      parts.push(
        `You will hit your limit in approximately ${prediction.daysUntilLimit} day${prediction.daysUntilLimit === 1 ? "" : "s"}.`
      );
    }
    parts.push(
      `Projected overages: ${prediction.projectedOverages.toLocaleString()} credits.`
    );
  } else if (limit !== Infinity) {
    parts.push(
      `You're on track to stay within your limit with ${(limit - prediction.projectedMonthlyUsage).toLocaleString()} credits to spare.`
    );
  }

  return parts.join(" ");
}

function printUsageReport(
  usageData: UsageData,
  prediction: UsagePrediction
): void {
  const limit = usageData.limit ?? Infinity;
  const creditsRemaining = usageData.credits_remaining ?? (limit !== Infinity ? limit - usageData.credits_used : Infinity);
  const overages = usageData.overages ?? 0;
  const usagePercent =
    limit > 0 && limit !== Infinity ? (usageData.credits_used / limit) * 100 : 0;

  console.log("=== Quicknode RPC Usage Report ===");
  console.log(
    `Period: ${formatPeriodWithTimestamps(usageData.start_time, usageData.end_time)}`
  );
  console.log(
    `Days in Period:    ${prediction.daysElapsed} elapsed, ${prediction.daysRemaining} remaining`
  );
  console.log("----------------------------------");
  console.log(`Credits Used:      ${usageData.credits_used.toLocaleString()}`);

  if (limit !== Infinity) {
    console.log(
      `Credits Remaining: ${creditsRemaining === Infinity ? 'Unlimited' : creditsRemaining.toLocaleString()}`
    );
    console.log(`Limit:             ${limit.toLocaleString()}`);
    console.log(`Current Usage:     ${usagePercent.toFixed(1)}%`);
  } else {
    console.log(`Limit:             No limit set`);
  }

  if (overages > 0) {
    console.log(
      `Overages:          ${overages.toLocaleString()} credits (!)`
    );
  }
  console.log("----------------------------------");
  console.log("PREDICTIONS");
  console.log(
    `Daily Average:     ${prediction.averageDailyUsage.toLocaleString()} credits/day`
  );

  if (limit !== Infinity) {
    console.log(
      `Projected Monthly: ${prediction.projectedMonthlyUsage.toLocaleString()} credits (${prediction.projectedMonthlyPercent.toFixed(1)}%)`
    );
  } else {
    console.log(
      `Projected Monthly: ${prediction.projectedMonthlyUsage.toLocaleString()} credits`
    );
  }

  if (prediction.willExceedLimit) {
    if (prediction.daysUntilLimit !== null && prediction.daysUntilLimit > 0) {
      console.log(`Days Until Limit:  ~${prediction.daysUntilLimit} days`);
    } else if (prediction.daysUntilLimit === 0) {
      console.log(`Days Until Limit:  Already at limit!`);
    }
    console.log(
      `Projected Overage: ${prediction.projectedOverages.toLocaleString()} credits`
    );
  } else if (limit !== Infinity) {
    console.log(`Status:            On track to stay within limit`);
  } else {
    console.log(`Status:            No limit configured`);
  }
  console.log("==================================\n");
}

async function checkUsageAndAlert(config: Config): Promise<void> {
  console.log("Fetching Quicknode RPC usage...\n");

  const usage = await fetchUsage(config.quicknodeApiKey);

  if (usage.error) {
    throw new Error(`API returned error: ${usage.error}`);
  }

  const usageData = usage.data;
  const limit = usageData.limit ?? Infinity;
  const usagePercent =
    limit > 0 && limit !== Infinity ? (usageData.credits_used / limit) * 100 : 0;
  const prediction = calculatePrediction(usageData);

  // Display current usage and predictions
  printUsageReport(usageData, prediction);

  // Check if alert is needed
  const overages = usageData.overages ?? 0;
  const alertLevel = determineAlertLevel(
    usagePercent,
    overages,
    prediction,
    config.thresholds
  );

  if (!alertLevel) {
    console.log(
      `Usage is within normal limits (< ${config.thresholds.warning}%) and not projected to exceed. No alert needed.`
    );
    return;
  }

  // Build alert message with prediction context
  let message: string;
  if (overages > 0) {
    message = `Your Quicknode RPC usage has exceeded the limit. You have ${overages.toLocaleString()} credits in overages. ${formatPredictionMessage(prediction, usageData)}`;
  } else if (
    prediction.willExceedLimit &&
    prediction.daysUntilLimit !== null &&
    prediction.daysUntilLimit <= 3
  ) {
    message = `Your Quicknode RPC usage is at ${usagePercent.toFixed(1)}% and projected to hit the limit in ${prediction.daysUntilLimit} day${prediction.daysUntilLimit === 1 ? "" : "s"}. ${formatPredictionMessage(prediction, usageData)}`;
  } else if (alertLevel === "critical") {
    message = `Your Quicknode RPC usage has reached ${usagePercent.toFixed(1)}% of your limit. ${formatPredictionMessage(prediction, usageData)}`;
  } else {
    message = `Your Quicknode RPC usage has reached ${usagePercent.toFixed(1)}% of your limit. ${formatPredictionMessage(prediction, usageData)}`;
  }

  // Build alert payload
  const alert: AlertPayload = {
    severity: alertLevel,
    title:
      alertLevel === "critical"
        ? "Quicknode RPC Usage Critical"
        : "Quicknode RPC Usage Warning",
    message,
    usagePercent,
    creditsUsed: usageData.credits_used,
    creditsRemaining: usageData.credits_remaining ?? 0,
    limit: usageData.limit ?? 0,
    overages: overages,
    prediction: {
      dailyAverage: prediction.averageDailyUsage,
      projectedMonthly: prediction.projectedMonthlyUsage,
      projectedPercent: prediction.projectedMonthlyPercent,
      daysUntilLimit: prediction.daysUntilLimit,
      projectedOverages: prediction.projectedOverages,
    },
  };

  console.log(`Alert level: ${alertLevel.toUpperCase()}`);

  // Check if any channels are configured
  const channelCount = Object.keys(config.channels).length;
  if (channelCount === 0) {
    console.log(
      "\nNo alerting channels configured. Add webhook URLs or API keys to .env file."
    );
    console.log(
      "Supported channels: Slack, PagerDuty, Discord, Opsgenie, Email (SendGrid), Generic Webhook"
    );
    return;
  }

  console.log(`\nSending alerts to ${channelCount} channel(s)...`);

  const results = await sendAlerts(config, alert);

  for (const result of results) {
    if (result.success) {
      console.log(`  [OK] ${result.channel}`);
    } else {
      console.log(`  [FAILED] ${result.channel}: ${result.error}`);
    }
  }
}

function parseMonthArg(): { year: number; month: number } | null {
  const monthIndex = process.argv.indexOf("--month");
  if (monthIndex === -1 || !process.argv[monthIndex + 1]) {
    return null;
  }

  const monthArg = process.argv[monthIndex + 1];

  // Support formats: "2025-12", "12" (assumes current year), "2025-1"
  if (monthArg.includes("-")) {
    const [yearStr, monthStr] = monthArg.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      throw new Error(`Invalid month format: ${monthArg}. Use YYYY-MM (e.g., 2025-12) or MM (e.g., 12)`);
    }
    return { year, month };
  } else {
    const month = parseInt(monthArg, 10);
    if (isNaN(month) || month < 1 || month > 12) {
      throw new Error(`Invalid month: ${monthArg}. Use 1-12 or YYYY-MM format.`);
    }
    const year = new Date().getFullYear();
    return { year, month };
  }
}

function printEndpointReport(data: EndpointUsageResponse["data"]): void {
  console.log("=== Quicknode RPC Usage by Endpoint ===");
  console.log(
    `Period: ${formatPeriodWithTimestamps(data.start_time, data.end_time)}`
  );
  console.log("----------------------------------------\n");

  // Filter out endpoints with 0 credits and 0 requests
  const activeEndpoints = data.endpoints.filter(e => e.credits_used > 0 || e.requests > 0);

  if (activeEndpoints.length === 0) {
    console.log("No endpoint data available.\n");
    return;
  }

  // Sort by credits used descending
  const sorted = [...activeEndpoints].sort((a, b) => b.credits_used - a.credits_used);
  const totalCredits = sorted.reduce((sum, e) => sum + e.credits_used, 0);

  for (const endpoint of sorted) {
    const percent = totalCredits > 0 ? ((endpoint.credits_used / totalCredits) * 100).toFixed(1) : "0.0";
    console.log(`Endpoint: ${endpoint.label || endpoint.name}`);
    console.log(`  Chain:    ${endpoint.chain} (${endpoint.network})`);
    console.log(`  Status:   ${endpoint.status}${endpoint.archive ? " [Archive]" : ""}`);
    console.log(`  Credits:  ${endpoint.credits_used.toLocaleString()} (${percent}%)`);
    console.log(`  Requests: ${endpoint.requests.toLocaleString()}`);

    if (endpoint.methods && endpoint.methods.length > 0) {
      console.log("  Top Methods:");
      const topMethods = endpoint.methods
        .sort((a, b) => b.credits_used - a.credits_used)
        .slice(0, 5);
      for (const method of topMethods) {
        console.log(`    - ${method.method_name}: ${method.credits_used.toLocaleString()} credits`);
      }
    }
    console.log("");
  }

  console.log(`Total Credits: ${totalCredits.toLocaleString()}`);
  console.log("========================================\n");
}

function printChainReport(data: ChainUsageResponse["data"]): void {
  console.log("=== Quicknode RPC Usage by Chain ===");

  // Filter out chains with 0 credits
  const activeChains = data.chains.filter(c => c.credits_used > 0);

  if (activeChains.length === 0) {
    console.log("\nNo chain data available.\n");
    return;
  }

  // Get period from first chain entry
  const firstChain = activeChains[0];
  if (firstChain.start_time && firstChain.end_time) {
    console.log(
      `Period: ${formatPeriodWithTimestamps(firstChain.start_time, firstChain.end_time)}`
    );
  }
  console.log("------------------------------------\n");

  // Sort by credits used descending
  const sorted = [...activeChains].sort((a, b) => b.credits_used - a.credits_used);
  const totalCredits = sorted.reduce((sum, c) => sum + c.credits_used, 0);

  const maxNameLen = Math.max(...sorted.map(c => c.name.length), 10);

  for (const chain of sorted) {
    const percent = totalCredits > 0 ? ((chain.credits_used / totalCredits) * 100).toFixed(1) : "0.0";
    const bar = "█".repeat(Math.round(parseFloat(percent) / 5)) || "▏";
    console.log(
      `${chain.name.padEnd(maxNameLen)}  ${chain.credits_used.toLocaleString().padStart(15)} credits  ${percent.padStart(5)}%  ${bar}`
    );
  }

  console.log("------------------------------------");
  console.log(`${"TOTAL".padEnd(maxNameLen)}  ${totalCredits.toLocaleString().padStart(15)} credits`);
  console.log("====================================\n");
}

function printMethodReport(data: MethodUsageResponse["data"]): void {
  console.log("=== Quicknode RPC Usage by Method ===");

  // Filter out methods with 0 credits
  const activeMethods = data.methods.filter(m => m.credits_used > 0);

  if (activeMethods.length === 0) {
    console.log("\nNo method data available.\n");
    return;
  }

  // Get period from first method entry
  const firstMethod = activeMethods[0];
  if (firstMethod.start_time && firstMethod.end_time) {
    console.log(
      `Period: ${formatPeriodWithTimestamps(firstMethod.start_time, firstMethod.end_time)}`
    );
  }
  console.log("-------------------------------------\n");

  // Sort by credits used descending
  const sorted = [...activeMethods].sort((a, b) => b.credits_used - a.credits_used);
  const totalCredits = sorted.reduce((sum, m) => sum + m.credits_used, 0);

  // Show top 20 methods
  const topMethods = sorted.slice(0, 20);
  const maxNameLen = Math.max(...topMethods.map(m => m.method_name.length), 15);

  for (const method of topMethods) {
    const percent = totalCredits > 0 ? ((method.credits_used / totalCredits) * 100).toFixed(1) : "0.0";
    const archiveTag = method.archive ? " [Archive]" : "";
    const bar = "█".repeat(Math.round(parseFloat(percent) / 5)) || "▏";
    console.log(
      `${method.method_name.padEnd(maxNameLen)}  ${method.credits_used.toLocaleString().padStart(15)} credits  ${percent.padStart(5)}%  ${bar}${archiveTag}`
    );
  }

  if (sorted.length > 20) {
    const remainingCredits = sorted.slice(20).reduce((sum, m) => sum + m.credits_used, 0);
    const remainingPercent = totalCredits > 0 ? ((remainingCredits / totalCredits) * 100).toFixed(1) : "0.0";
    console.log(
      `${"... and " + (sorted.length - 20) + " more".padEnd(maxNameLen)}  ${remainingCredits.toLocaleString().padStart(15)} credits  ${remainingPercent.padStart(5)}%`
    );
  }

  console.log("-------------------------------------");
  console.log(`${"TOTAL".padEnd(maxNameLen)}  ${totalCredits.toLocaleString().padStart(15)} credits  (${sorted.length} methods)`);
  console.log("=====================================\n");
}

function printHistoricalReport(usageData: UsageData): void {
  const limit = usageData.limit ?? Infinity;
  const creditsRemaining = usageData.credits_remaining ?? (limit !== Infinity ? limit - usageData.credits_used : Infinity);
  const overages = usageData.overages ?? 0;
  const usagePercent =
    limit > 0 && limit !== Infinity ? (usageData.credits_used / limit) * 100 : 0;

  console.log("=== Quicknode RPC Usage Report (Historical) ===");
  console.log(
    `Period: ${formatPeriodWithTimestamps(usageData.start_time, usageData.end_time)}`
  );
  console.log("------------------------------------------------");
  console.log(`Credits Used:      ${usageData.credits_used.toLocaleString()}`);

  if (limit !== Infinity) {
    console.log(
      `Credits Remaining: ${creditsRemaining === Infinity ? 'Unlimited' : creditsRemaining.toLocaleString()}`
    );
    console.log(`Limit:             ${limit.toLocaleString()}`);
    console.log(`Usage:             ${usagePercent.toFixed(1)}%`);
  } else {
    console.log(`Limit:             No limit set`);
  }

  if (overages > 0) {
    console.log(
      `Overages:          ${overages.toLocaleString()} credits (!)`
    );
  }
  console.log("================================================\n");
}

// Main entry point
async function main(): Promise<void> {
  try {
    const config = loadConfig();

    // Check for detailed report flags
    const byEndpoint = process.argv.includes("--by-endpoint");
    const byChain = process.argv.includes("--by-chain");
    const byMethod = process.argv.includes("--by-method");
    const detailed = process.argv.includes("--detailed");

    // Handle detailed reports
    if (byEndpoint || detailed) {
      console.log("Fetching usage by endpoint...\n");
      const endpointData = await fetchUsageByEndpoint(config.quicknodeApiKey);
      if (endpointData.error) {
        throw new Error(`API returned error: ${endpointData.error}`);
      }
      printEndpointReport(endpointData.data);
    }

    if (byChain || detailed) {
      console.log("Fetching usage by chain...\n");
      const chainData = await fetchUsageByChain(config.quicknodeApiKey);
      if (chainData.error) {
        throw new Error(`API returned error: ${chainData.error}`);
      }
      printChainReport(chainData.data);
    }

    if (byMethod || detailed) {
      console.log("Fetching usage by method...\n");
      const methodData = await fetchUsageByMethod(config.quicknodeApiKey);
      if (methodData.error) {
        throw new Error(`API returned error: ${methodData.error}`);
      }
      printMethodReport(methodData.data);
    }

    // If any detailed flag was used, exit after showing reports
    if (byEndpoint || byChain || byMethod || detailed) {
      return;
    }

    // Check for --month flag for historical data
    const monthArg = parseMonthArg();

    if (monthArg) {
      console.log(`Fetching usage for ${monthArg.year}-${String(monthArg.month).padStart(2, "0")}...\n`);
      const usage = await fetchUsageForMonth(config.quicknodeApiKey, monthArg.year, monthArg.month);

      if (usage.error) {
        throw new Error(`API returned error: ${usage.error}`);
      }

      printHistoricalReport(usage.data);
      return;
    }

    // Check mode: just display usage without alerting
    const checkMode = process.argv.includes("--check");

    if (checkMode) {
      console.log("Running in check mode (no alerts will be sent)\n");
      const usage = await fetchUsage(config.quicknodeApiKey);

      if (usage.error) {
        throw new Error(`API returned error: ${usage.error}`);
      }

      const usageData = usage.data;
      const limit = usageData.limit ?? Infinity;
      const overages = usageData.overages ?? 0;
      const usagePercent =
        limit > 0 && limit !== Infinity ? (usageData.credits_used / limit) * 100 : 0;
      const prediction = calculatePrediction(usageData);

      printUsageReport(usageData, prediction);

      console.log(
        `Thresholds: Warning=${config.thresholds.warning}%, Critical=${config.thresholds.critical}%`
      );

      const alertLevel = determineAlertLevel(
        usagePercent,
        overages,
        prediction,
        config.thresholds
      );
      console.log(
        `Would trigger: ${alertLevel ? alertLevel.toUpperCase() + " alert" : "No alert"}`
      );

      return;
    }

    await checkUsageAndAlert(config);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main();
