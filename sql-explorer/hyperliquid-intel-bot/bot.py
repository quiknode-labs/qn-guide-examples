"""
Hyperliquid Intelligence Bot

Queries Quicknode SQL Explorer for Hyperliquid market data, composes a
formatted digest, and sends it to a Telegram channel.

Usage:
    python bot.py              # run once, send digest immediately
    python bot.py --dry-run    # print digest to console without sending

Guide: https://www.quicknode.com/guides/quicknode-products/sql-explorer/build-a-hyperliquid-intelligence-bot
"""

import os
import sys

import requests
from dotenv import load_dotenv

from formatter import format_digest
from queries import (
    get_funding_extremes,
    get_liquidations,
    get_platform_overview,
    get_top_assets,
)

load_dotenv()

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")


def send_telegram(message: str) -> None:
    """Send a message to the configured Telegram chat."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        raise ValueError(
            "TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set to send messages."
        )
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    resp = requests.post(
        url,
        json={
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": "Markdown",
        },
    )
    resp.raise_for_status()
    print(f"Digest sent (chat_id={TELEGRAM_CHAT_ID})")


def main() -> None:
    dry_run = "--dry-run" in sys.argv

    print("Fetching digest data from SQL Explorer...")

    print("Platform overview:", end="")
    overview = get_platform_overview()

    print("Top assets:", end="")
    assets = get_top_assets()

    print("Liquidations:", end="")
    liquidations = get_liquidations()

    print("Funding extremes:", end="")
    funding = get_funding_extremes()

    digest = format_digest(overview, assets, liquidations, funding)
    print(f"\n{digest}")

    if dry_run:
        print("\n[dry-run] Skipping Telegram send.")
    else:
        send_telegram(digest)


if __name__ == "__main__":
    main()
