# Hyperliquid Intelligence Bot

> A scheduled bot that queries Quicknode SQL Explorer for Hyperliquid market data and delivers a daily digest to Telegram. Built as part of the [Build a Hyperliquid Intelligence Bot with SQL Explorer](https://www.quicknode.com/guides/quicknode-products/sql-explorer/build-a-hyperliquid-intelligence-bot) guide.

## Features

- Queries four Hyperliquid tables via the SQL Explorer REST API: platform metrics, top assets by volume, liquidations, and funding rate extremes
- Composes a formatted daily market digest
- Sends the digest to a Telegram channel
- Supports `--dry-run` mode for testing without Telegram

## Prerequisites

- Python 3.10+ (or Node.js 20+ for TypeScript)
- A [Quicknode account](https://quicknode.com) with an API key that has SQL Explorer access
- A Telegram bot token and chat ID

## Setup

### Python

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/sql-explorer/hyperliquid-intel-bot
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### TypeScript

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/sql-explorer/hyperliquid-intel-bot/typescript
npm install
cp .env.example .env
```

### Environment Variables

Open `.env` and fill in the three required values:

| Variable | Description |
|----------|-------------|
| `QUICKNODE_API_KEY` | Your Quicknode API key with SQL Explorer access. Find it under **API Keys** in the [Quicknode Dashboard](https://dashboard.quicknode.com). |
| `TELEGRAM_BOT_TOKEN` | The token for your Telegram bot (see below). |
| `TELEGRAM_CHAT_ID` | The channel or group ID where the bot will post (see below). |

#### Creating a Telegram Bot

1. Open Telegram and search for **BotFather**.
2. Start a chat and send `/newbot`. Follow the prompts to set a name and username.
3. BotFather will reply with a **Bot Token**. Save it for your `.env` file.

#### Creating a Channel

1. In Telegram, create a new channel (public or private).
2. For a **public** channel, give it a username (e.g., `@hyperliquid_digest`). Use this username as your `TELEGRAM_CHAT_ID`.
3. For a **private** channel, forward a message from the channel to a bot like `@JsonDumpCUBot` and look for the `forward_from_chat.id` value. Use that numeric ID as your `TELEGRAM_CHAT_ID`.

#### Adding the Bot to the Channel

1. Open your channel's settings.
2. Add your bot as an administrator so it can post messages.

## Run

### Python

```bash
python bot.py              # send digest to Telegram
python bot.py --dry-run    # print digest to console only
```

### TypeScript

```bash
npm start                  # send digest to Telegram
npm run dry-run            # print digest to console only
```

## Notes

- **Python files** live at the project root: `bot.py`, `queries.py`, `formatter.py`
- **TypeScript files** live in `typescript/src/`: `bot.ts`, `queries.ts`, `formatter.ts`
- All SQL queries are identical across both implementations
- The bot is stateless, so you can schedule it with cron, systemd timers, or a cloud scheduler
- Modify the SQL in `queries.py` / `queries.ts` to customize the digest sections

## Support & Feedback

- Repo issues: please open a GitHub issue for bugs/requests related to this example.
