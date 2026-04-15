/**
 * Digest formatting for Telegram delivery.
 *
 * Takes raw query result dictionaries and composes a Markdown-formatted
 * message suitable for Telegram's "Markdown" parse mode.
 */

/** Format large numbers with K/M/B suffixes. */
function formatNumber(n: number, prefix = "$"): string {
  const absN = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (absN >= 1_000_000_000) return `${sign}${prefix}${(absN / 1e9).toFixed(1)}B`;
  if (absN >= 1_000_000) return `${sign}${prefix}${(absN / 1e6).toFixed(1)}M`;
  if (absN >= 1_000) return `${sign}${prefix}${(absN / 1e3).toFixed(1)}K`;
  return `${sign}${prefix}${absN.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type Row = Record<string, string>;

/** Compose all query results into a Telegram-ready digest. */
export function formatDigest(
  overview: Row[],
  assets: Row[],
  liquidations: Row[],
  funding: Row[]
): string {
  const now = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const lines: string[] = [];
  lines.push("*Hyperliquid Daily Digest*");
  lines.push(`_${now}_`);
  lines.push("");

  // Platform overview (aggregate the week)
  if (overview.length > 0) {
    const totalVol = overview.reduce((s, r) => s + Number(r.total_volume_usd), 0);
    const totalFills = overview.reduce((s, r) => s + Number(r.total_fills), 0);
    const peakTraders = Math.max(...overview.map((r) => Number(r.active_traders)));
    const totalFees = overview.reduce((s, r) => s + Number(r.total_fees), 0);
    const totalLiqVol = overview.reduce(
      (s, r) => s + Number(r.liquidation_volume_usd),
      0
    );

    lines.push("*Overview (7d)*");
    lines.push(`Volume: ${formatNumber(totalVol)}`);
    lines.push(`Fills: ${formatNumber(totalFills, "")}`);
    lines.push(`Active traders: ${peakTraders.toLocaleString()}`);
    lines.push(`Fees: ${formatNumber(totalFees)}`);
    lines.push(`Liquidation volume: ${formatNumber(totalLiqVol)}`);
    lines.push("");
  }

  // Top assets by volume
  if (assets.length > 0) {
    lines.push("*Top Assets by Volume (24h)*");
    assets.slice(0, 5).forEach((row, i) => {
      const vol = formatNumber(Number(row.volume_usd));
      lines.push(`${i + 1}. ${row.coin}  ${vol}`);
    });
    lines.push("");
  }

  // Liquidations
  if (liquidations.length > 0) {
    const totalLiq = liquidations.reduce(
      (s, r) => s + Number(r.liq_volume_usd),
      0
    );
    const totalUsers = liquidations.reduce(
      (s, r) => s + Number(r.users_rekt),
      0
    );

    lines.push("*Liquidations (24h)*");
    lines.push(`Total: ${formatNumber(totalLiq)}`);
    lines.push(`Unique addresses: ${totalUsers.toLocaleString()}`);

    liquidations.slice(0, 3).forEach((row) => {
      const vol = formatNumber(Number(row.liq_volume_usd));
      lines.push(`  ${row.coin}: ${vol} (${row.users_rekt} users)`);
    });
    lines.push("");
  }

  // Funding rate extremes
  if (funding.length > 0) {
    lines.push("*Funding Rate Extremes*");
    funding.slice(0, 5).forEach((row) => {
      const rate = Number(row.annualized_rate_pct);
      const sign = rate > 0 ? "+" : "";
      const oi = formatNumber(Number(row.oi_usd));
      lines.push(`${row.coin}: ${sign}${rate}% ann.  OI ${oi}`);
    });
    lines.push("");
  }

  lines.push("_Powered by Quicknode SQL Explorer_");
  return lines.join("\n");
}
