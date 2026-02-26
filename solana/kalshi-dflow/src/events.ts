import { fetchJson, requireEnv } from './utils';
import type { EventsResponse } from './types';

const METADATA_API  = requireEnv('METADATA_API_URL');
const SERIES_TICKER = requireEnv('SERIES_TICKER');
const USDC_MINT     = requireEnv('USDC_MINT');

// Helpers
function toUsd(price: string | null): string {
  if (!price) return '  N/A  ';
  return `${Number(price).toFixed(2)}`;
}

function closeDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Main
async function listEvents() {
  const url = `${METADATA_API}/api/v1/events?seriesTickers=${SERIES_TICKER}&status=active&withNestedMarkets=true`;
  const { events } = await fetchJson<EventsResponse>(url);

  if (events.length === 0) {
    console.log(`No active events found for series "${SERIES_TICKER}".`);
    return;
  }

  console.log(`\n${SERIES_TICKER} — ${events.length} active event(s)\n`);

  for (const event of events) {
    // closeTime lives on the markets, not the event itself
    const closeTime = event.markets[0]?.closeTime;

    console.log(`┌─ ${event.title}`);
    console.log(`│  Ticker:  ${event.ticker}`);
    if (event.subtitle) console.log(`│  Subtitle: ${event.subtitle}`);
    if (closeTime) console.log(`│  Closes:  ${closeDate(closeTime)}`);
    console.log('│');

    for (const market of event.markets) {
      // Prefer USDC accounts; fall back to first account available
      const acct = market.accounts[USDC_MINT] ?? Object.values(market.accounts)[0];

      console.log(`│  ▸ YES label: ${market.yesSubTitle}`);
      console.log(`│    Ticker:   ${market.ticker}`);
      console.log(`│    YES mint: ${acct?.yesMint ?? 'not initialized'}`);
      console.log(`│    NO  mint: ${acct?.noMint  ?? 'not initialized'}`);
      console.log(`│    Price (ask):  YES ${toUsd(market.yesAsk)}   NO ${toUsd(market.noAsk)}`);
      console.log('│');
    }

    console.log('└─────────────────────────────────────────────────────\n');
  }
}

listEvents().catch(console.error);
