# Streams Discord AI Bot (Block Metrics Q&A)

Ask a Discord bot about specific Ethereum blocks and get Michael Scott–style answers backed by block metrics from your database.

## Prerequisites
- Node.js 18+
- PostgreSQL with a `block-metrics` table containing block data JSON (one row per block)
- Discord Bot token
- OpenAI API key

## Setup
1. Install deps:
   ```bash
   npm install
   ```
2. Create `.env` with:
   ```bash
   DISCORD_TOKEN=your_discord_bot_token
   OPENAI_API_KEY=your_openai_key
   DATABASE_URL=postgres://user:pass@host:port/dbname
   ```
3. Start the bot:
   ```bash
   node main.js
   ```

## How it works
- Users message the bot with a block number (e.g., "block 20500000").
- The bot fetches the block’s metrics from PostgreSQL and starts a thread.
- Follow-up messages in the thread keep context; responses are generated via OpenAI.

## Notes
- Ensure your DB rows are stored in `block-metrics` with a `data` JSON column containing `blockNumber`.
- If rate-limited by OpenAI, the bot retries with exponential backoff.
