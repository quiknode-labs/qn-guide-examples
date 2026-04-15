"""
Digest formatting for Telegram delivery.

Takes raw query result dictionaries and composes a Markdown-formatted
message suitable for Telegram's "Markdown" parse mode.
"""

from datetime import datetime, timezone


def format_number(n: float, prefix: str = "$") -> str:
    """Format large numbers with K/M/B suffixes."""
    abs_n = abs(n)
    sign = "-" if n < 0 else ""
    if abs_n >= 1_000_000_000:
        return f"{sign}{prefix}{abs_n / 1_000_000_000:.1f}B"
    if abs_n >= 1_000_000:
        return f"{sign}{prefix}{abs_n / 1_000_000:.1f}M"
    if abs_n >= 1_000:
        return f"{sign}{prefix}{abs_n / 1_000:.1f}K"
    return f"{sign}{prefix}{abs_n:,.2f}"


def format_digest(
    overview: list[dict],
    assets: list[dict],
    liquidations: list[dict],
    funding: list[dict],
) -> str:
    """Compose all query results into a Telegram-ready digest."""
    now = datetime.now(timezone.utc).strftime("%B %d, %Y")
    lines: list[str] = []

    lines.append(f"*Hyperliquid Daily Digest*")
    lines.append(f"_{now}_")
    lines.append("")

    # --- Platform overview (aggregate the week) ---
    if overview:
        total_vol = sum(float(r["total_volume_usd"]) for r in overview)
        total_fills = sum(int(r["total_fills"]) for r in overview)
        peak_traders = max(int(r["active_traders"]) for r in overview)
        total_fees = sum(float(r["total_fees"]) for r in overview)
        total_liq_vol = sum(float(r["liquidation_volume_usd"]) for r in overview)

        lines.append("*Overview (7d)*")
        lines.append(f"Volume: {format_number(total_vol)}")
        lines.append(f"Fills: {format_number(total_fills, prefix='')}")
        lines.append(f"Active traders: {peak_traders:,}")
        lines.append(f"Fees: {format_number(total_fees)}")
        lines.append(f"Liquidation volume: {format_number(total_liq_vol)}")
        lines.append("")

    # --- Top assets by volume ---
    if assets:
        lines.append("*Top Assets by Volume (24h)*")
        for i, row in enumerate(assets[:5], 1):
            vol = format_number(float(row["volume_usd"]))
            lines.append(f"{i}. {row['coin']}  {vol}")
        lines.append("")

    # --- Liquidations ---
    if liquidations:
        total_liq = sum(float(r["liq_volume_usd"]) for r in liquidations)
        total_users = sum(int(r["users_rekt"]) for r in liquidations)

        lines.append("*Liquidations (24h)*")
        lines.append(f"Total: {format_number(total_liq)}")
        lines.append(f"Unique addresses: {total_users:,}")

        # Top 3 coins by liquidation volume
        for row in liquidations[:3]:
            vol = format_number(float(row["liq_volume_usd"]))
            lines.append(f"  {row['coin']}: {vol} ({row['users_rekt']} users)")
        lines.append("")

    # --- Funding rate extremes ---
    if funding:
        sorted_funding = sorted(
            funding, key=lambda r: float(r["annualized_rate_pct"])
        )
        most_neg = sorted_funding[0]
        most_pos = sorted_funding[-1]

        lines.append("*Funding Rate Extremes*")
        # Show top 5 by absolute value (already sorted that way from the query)
        for row in funding[:5]:
            rate = float(row["annualized_rate_pct"])
            sign = "+" if rate > 0 else ""
            oi = format_number(float(row["oi_usd"]))
            lines.append(f"{row['coin']}: {sign}{rate}% ann.  OI {oi}")
        lines.append("")

    lines.append("_Powered by Quicknode SQL Explorer_")

    return "\n".join(lines)
