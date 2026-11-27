import { Badge, Button, Heading, Message, Table, useCopyToClipboard } from "../ui.tsx";
import type { Snapshot } from "../../../shared/types.ts";
import type { Controls } from "../App.tsx";
import { Columns, TimeChart } from "../components/charts.tsx";
import { Frame, Note, Plot, Swatch, WarmingUp } from "../components/Frame.tsx";
import { CorporateTable, EventBadge, Kpi } from "../components/shared.tsx";
import { addressUrl, chartColor, clock, countdown, pct, price, shares, short, span, txUrl, usd } from "../format.ts";
import { WINDOW_PHRASE, gapWords, normalReading, paceReading, quoteAt } from "../insights.ts";
import { WindowBar } from "./Main.tsx";

const QUOTE_SIZES = [1_000, 10_000, 50_000];

function CopyButton({ text }: { text: string }) {
  const { copied, copy } = useCopyToClipboard();
  return <Button variant="secondary" onClick={() => copy(text)}>{copied ? "Copied" : "Copy"}</Button>;
}


export function Ticker({ snapshot, symbol, controls, setControls }: {
  snapshot: Snapshot;
  symbol: string;
  controls: Controls;
  setControls: (next: Controls) => void;
}) {
  const detail = snapshot.ticker;
  const { window: win, status } = snapshot;
  if (!detail) {
    return (
      <>
        <a href="#/" className="text-sm text-(--foreground)">← All tickers</a>
        <Message variant="warning" title={`${symbol} is not a tracked xStocks ticker.`} description="Pick one from the main page." />
      </>
    );
  }
  const when = WINDOW_PHRASE[win.key];
  const signal = detail.signal;
  const priceReady = detail.series.filter((p) => p[1] !== null).length >= 2;
  const underlying = detail.symbol.replace(/x$/, "");
  const decoderOff = Math.abs(detail.decodedNetShares - detail.supplyChangeShares) > Math.max(1e-6, Math.abs(detail.supplyChangeShares) * 0.001);
  const normal = normalReading(signal);
  const pace = paceReading(signal);

  // The headline: what the token costs against the stock, and whether that is normal.
  let headline: string;
  if (detail.onchain === null) headline = `No ${detail.symbol} trades with a clear price have been seen since the app started.`;
  else if (detail.ref !== null && detail.premiumPct === null && detail.onchainT !== null) headline = `${detail.symbol} last traded at ${price(detail.onchain)} at ${clock(detail.onchainT)}, too long ago to compare with the ${underlying} stock price.`;
  else if (detail.ref === null || detail.premiumPct === null) headline = `${detail.symbol} last traded at ${price(detail.onchain)}. There is no ${underlying} stock price to compare it with yet.`;
  else if (detail.stale) headline = `${detail.symbol} last traded at ${price(detail.onchain)}. The ${underlying} stock price is over 5 minutes old, so the gap can't be trusted right now.`;
  else {
    headline = detail.aging
      ? `${detail.symbol} costs ${price(detail.onchain)} onchain, about ${gapWords(detail.premiumPct)} ${underlying}'s stock price of ${price(detail.ref)}. The stock price is over 30 seconds old, so the gap is approximate.`
      : `${detail.symbol} costs ${price(detail.onchain)} onchain, ${gapWords(detail.premiumPct)} ${underlying}'s stock price of ${price(detail.ref)}.`;
    if (signal.z === null) headline += " The app is still learning what gap is normal for this ticker.";
    else headline += normal.flag ? ` That gap is ${normal.label.toLowerCase()} for this ticker.` : " That gap is within this ticker's normal range.";
  }

  const quote10 = quoteAt(signal, 10_000);
  const costAnswer = quote10
    ? `Buying $10K of ${detail.symbol} right now would cost about ${Math.abs(quote10.impactPct).toFixed(2)}% ${quote10.impactPct >= 0 ? "more" : "less"} than the stock price, through ${quote10.route}.`
    : `No live quote for ${detail.symbol} in the last 3 minutes. Quotes cover the five busiest tickers and any close to an alert.`;

  let volumeAnswer = detail.trades > 0 ? `${usd(detail.volumeUsd)} of ${detail.symbol} traded ${when}, in ${detail.trades.toLocaleString("en-US")} ${detail.trades === 1 ? "trade" : "trades"}.` : `No ${detail.symbol} trades ${when}.`;
  if (signal.spike !== null) volumeAnswer += pace.flag ? ` It is trading at ${signal.spike.toFixed(1)} times its usual pace.` : " That is in line with its usual pace.";
  if (!status.marketOpen && signal.impliedOpenPct !== null) {
    volumeAnswer += ` With the US market closed, the token is ${signal.impliedOpenPct >= 0 ? "up" : "down"} ${Math.abs(signal.impliedOpenPct).toFixed(2)}% since the close. That is onchain sentiment, not a forecast.`;
  }

  const supplyAnswer = Math.abs(detail.supplyChangeShares) < 1e-6
    ? `No ${detail.symbol} has been minted or redeemed since the app started. ${shares(detail.supplyShares)} shares' worth exist on Solana.`
    : `${shares(Math.abs(detail.supplyChangeShares))} shares' worth of ${detail.symbol} ${detail.supplyChangeShares > 0 ? "has been created" : "has been redeemed"} on balance since the app started. ${detail.supplyChangeShares > 0 ? "That is new money coming in." : "That is money leaving."}`;

  const corporateAnswer = detail.upcoming
    ? `A ${detail.upcoming.kind} is scheduled in ${countdown(detail.upcoming.t - snapshot.now)}. Balances update on their own.`
    : `No dividend or split is scheduled for ${detail.symbol}.`;

  return (
    <>
      <a href="#/" className="text-sm text-(--foreground)">← All tickers</a>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-[80ch] flex-col gap-2">
          <Badge>TOKENIZED EQUITY · BACKED</Badge>
          <Heading level={2}><span className="xs-num">{detail.symbol}</span></Heading>
          <span className="text-(--foreground-medium)">{detail.name} · tracks <span className="xs-num">{underlying}</span></span>
          <p className="m-0 text-lg text-(--foreground)">{headline}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <span className="flex items-center gap-2">
            <span className="text-xs text-(--foreground-medium)">Mint address</span>
            <span className="xs-num text-sm" title={detail.mint}>{short(detail.mint)}</span>
            <CopyButton text={detail.mint} />
            <a href={addressUrl(detail.mint)} target="_blank" rel="noopener noreferrer" className="text-sm text-(--foreground)">Explorer</a>
          </span>
          <WindowBar controls={controls} setControls={setControls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Kpi label="Token price" value={price(detail.onchain)} caption={detail.onchainT ? `Last exchange trade at ${clock(detail.onchainT)}` : "No trade yet"} />
        <Kpi label="Stock price" value={price(detail.ref)} caption={detail.refAgeSec !== null ? `Updated ${span(detail.refAgeSec)} ago${detail.stale ? ", too old to trust" : ""}` : "Not available yet"} />
        <Kpi
          label="Gap to stock"
          value={detail.aging && detail.premiumPct !== null ? `~${pct(detail.premiumPct)}` : pct(detail.premiumPct)}
          caption={detail.stale ? "Stock price too old to trust" : detail.aging ? "Approximate, stock price over 30s old" : normal.label}
        />
        <Kpi label="Volume" value={usd(detail.volumeUsd)} caption={`${detail.trades.toLocaleString("en-US")} trades ${when}`} partial={win.partial} />
        <Kpi label="Supply change" value={`${detail.supplyChangeShares >= 0 ? "+" : ""}${shares(detail.supplyChangeShares)}`} caption="Shares' worth since the app started" />
      </div>

      <Frame
        label={`Price vs the stock · ${detail.symbol}`}
        answer={signal.closeMedianSec !== null ? `After new tokens are minted, the gap has typically closed in ${span(signal.closeMedianSec)}, measured over ${signal.closeEpisodes} ${signal.closeEpisodes === 1 ? "mint" : "mints"}.` : undefined}
        how={
          <>
            <span>The top chart shows the token's price and the stock's price. The lower band is the gap between them: token price ÷ stock price − 1.</span>
            <span>The token price is the volume-weighted price of exchange trades, sampled every 15 seconds. The stock price comes from Jupiter's Price API and updates about once a minute.</span>
            <span>{normal.detail}</span>
          </>
        }
      >
        {priceReady ? (
          <Plot>
            <TimeChart
              from={win.from}
              to={win.to}
              height={280}
              minSpan={detail.ref ? detail.ref * 0.004 : 1}
              format={(value) => price(value)}
              sessions={snapshot.premium.sessions}
              gaps={status.gaps}
              markers={detail.markers}
              markerSeries={() => "Token price"}
              series={[
                { label: "Stock price", color: "var(--foreground-medium)", dashed: true, width: 1.5, points: detail.series.map((p) => [p[0], p[2]]) },
                { label: "Token price", color: chartColor(0), points: detail.series.map((p) => [p[0], p[1]]) },
              ]}
            />
            <TimeChart
              from={win.from}
              to={win.to}
              height={130}
              includeZero
              minSpan={0.4}
              format={(value) => pct(value)}
              sessions={snapshot.premium.sessions}
              gaps={status.gaps}
              series={[{ label: "Gap to stock", color: chartColor(1), points: detail.series.map((p) => [p[0], p[3], p[4]]) }]}
            />
          </Plot>
        ) : (
          <WarmingUp since={status.startedAt} height={300} detail={`${detail.trades} trades so far · the chart appears after two 15s samples with a priced trade`} />
        )}
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-(--foreground-medium)">
          <span className="inline-flex items-center gap-1.5"><Swatch color={chartColor(0)} />Token price</span>
          <span className="inline-flex items-center gap-1.5"><Swatch color="var(--foreground-medium)" />Stock price (dashed)</span>
          <span className="inline-flex items-center gap-1.5"><Swatch color={chartColor(1)} />Gap to stock (lower band)</span>
          <span>Shaded = US market open</span>
          <span>▲ minted</span>
          <span>▼ redeemed</span>
          <span>◆ dividend or split</span>
        </div>
      </Frame>

      <div className="grid gap-4 xl:grid-cols-2">
        <Frame
          label="Cost by order size"
          answer={costAnswer}
          how={<span>Live Jupiter Swap API quotes for a USDC buy, refreshed once a minute, against the stock price. Each figure includes the current gap and the extra cost of the order's size. A negative figure means the token is cheaper than the stock.</span>}
        >
          {signal.slippage ? (
            <div className="grid grid-cols-3 gap-3">
              {QUOTE_SIZES.map((size) => {
                const quote = quoteAt(signal, size);
                return (
                  <div key={size} className="flex flex-col gap-1 border border-(--border) bg-(--background-elevated) p-3">
                    <span className="xs-num text-xs uppercase text-(--foreground-medium)">Buy ${size / 1000}K</span>
                    <span className="xs-num text-2xl text-(--foreground)">{quote ? pct(quote.impactPct) : "No route"}</span>
                    <span className="xs-num text-xs text-(--foreground-medium)">{quote ? `${price(quote.price)} a share` : ""}</span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </Frame>

        <Frame
          label="Trading activity"
          answer={volumeAnswer}
          how={<span>Dollar value of exchange trades over time. {pace.detail}</span>}
        >
          {detail.trades > 0 ? <Plot><Columns bars={detail.volumeBars} color={chartColor(0)} format={(value) => usd(value)} /></Plot> : null}
        </Frame>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Frame
          label="Supply"
          answer={supplyAnswer}
          how={
            <>
              <span>Supply is read from the token's mint account every time it changes, and shown in shares (raw amount × multiplier).</span>
              <span>
                As a cross-check, decoded mint and redeem transactions net to <span className="xs-num">{shares(detail.decodedNetShares)}</span> shares
                {decoderOff ? ". That differs from the account, so the decoder missed something." : ", which matches the account."}
              </span>
            </>
          }
        >
          <Plot>
            <TimeChart
              from={Math.min(win.from, status.startedAt)}
              to={win.to}
              height={170}
              minSpan={Math.max(1, detail.supplyShares * 0.0005)}
              format={(value) => shares(value)}
              markers={detail.markers.filter((m) => m.kind !== "corp")}
              markerSeries={() => "Supply"}
              series={[{ label: "Supply", color: chartColor(0), step: true, points: [...detail.supply.map((p): [number, number] => [p[0], p[1]]), [win.to, detail.supplyShares]] }]}
            />
          </Plot>
        </Frame>

        <Frame
          label="Dividends and splits"
          answer={corporateAnswer}
          how={<span>The mint stores a multiplier, now <span className="xs-num">{detail.multiplier.toFixed(6)}</span>. It converts raw token amounts into shares. A dividend nudges it up and a split changes it by the split ratio. Scheduled changes are stored onchain with their start time.</span>}
        >
          {detail.upcoming || detail.applied.length > 0 ? (
            <CorporateTable upcoming={detail.upcoming ? [detail.upcoming] : []} applied={detail.applied} now={snapshot.now} showTicker={false} />
          ) : null}
        </Frame>
      </div>

      <Frame label="Largest trades">
        {detail.largest.length > 0 ? (
          <div className="-mx-4 overflow-x-auto">
            <Table className="w-full" hasBorder={false}>
              <Table.Header>
                <Table.Column>Time</Table.Column>
                <Table.Column>Side</Table.Column>
                <Table.Column align="right">Shares</Table.Column>
                <Table.Column align="right">Price</Table.Column>
                <Table.Column align="right">Gap to stock</Table.Column>
                <Table.Column align="right">Value</Table.Column>
                <Table.Column>Exchange</Table.Column>
                <Table.Column>Wallet</Table.Column>
                <Table.Column>Transaction</Table.Column>
              </Table.Header>
              <Table.Body>
                {detail.largest.map((event) => (
                  <Table.Row key={event.id}>
                    <Table.Cell><span className="xs-num text-xs">{clock(event.t)}</span></Table.Cell>
                    <Table.Cell><EventBadge type={event.type} /></Table.Cell>
                    <Table.Cell align="right"><span className="xs-num text-sm">{shares(event.shares)}</span></Table.Cell>
                    <Table.Cell align="right"><span className="xs-num text-sm">{price(event.price)}</span></Table.Cell>
                    <Table.Cell align="right"><span className="xs-num text-sm">{event.price !== null && event.ref ? pct((event.price / event.ref - 1) * 100) : "n/a"}</span></Table.Cell>
                    <Table.Cell align="right"><span className="xs-num text-sm">{usd(event.usd, false)}</span></Table.Cell>
                    <Table.Cell><span className="text-sm">{event.venue ?? "Unknown"}</span></Table.Cell>
                    <Table.Cell><a className="xs-num text-sm text-(--foreground)" href={addressUrl(event.wallet)} target="_blank" rel="noopener noreferrer">{short(event.wallet)}</a></Table.Cell>
                    <Table.Cell><a className="text-sm text-(--foreground)" href={txUrl(event.signature)} target="_blank" rel="noopener noreferrer">View</a></Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        ) : (
          <Note>No trades for {detail.symbol} {when}.</Note>
        )}
        <Note>Largest by dollar value {when}. Buy and sell are a best guess when a router trades on a wallet's behalf.</Note>
      </Frame>
    </>
  );
}
