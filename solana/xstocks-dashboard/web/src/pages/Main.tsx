import { useState } from "react";
import { Button, Heading, Panel, Select, TabController, Table, Tag } from "../ui.tsx";
import type { SignalRow, Snapshot, WindowKey } from "../../../shared/types.ts";
import type { Controls } from "../App.tsx";
import { BarList, DivergingBars, SplitBar, TimeChart } from "../components/charts.tsx";
import { Frame, Note, Plot, Swatch, WarmingUp } from "../components/Frame.tsx";
import { CorporateTable, GapBar, Insight, OpportunityRow, Premium, ReadingLabel } from "../components/shared.tsx";
import { EVENT_META, chartColor, clock, pct, price, signedUsd, span, usd } from "../format.ts";
import {
  WINDOW_PHRASE, emptyFlowsNote, emptyMintNote, normalReading, opportunityNote, paceLearningNote, paceReading,
  learningNote, quoteAt,
} from "../insights.ts";

export const WINDOWS: WindowKey[] = ["15m", "1h", "all"];
const WINDOW_LABELS = ["Last 15 min", "Last hour", "Since start (max 24h)"];
const QUOTE_SIZES = [1_000, 10_000, 50_000];

/** The one control that applies to the whole page: how far back the activity figures look. */
export function WindowBar({ controls, setControls }: { controls: Controls; setControls: (next: Controls) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-(--foreground-medium)">Show activity for</span>
      <TabController
        aria-label="Time window"
        tabs={WINDOW_LABELS}
        active={WINDOWS.indexOf(controls.window)}
        onChange={(index) => setControls({ ...controls, window: WINDOWS[index] })}
      />
    </div>
  );
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}


/** One row per busy ticker: the gap, whether it is normal, and how fast gaps close. */
function GapTable({ rows }: { rows: SignalRow[] }) {
  return (
    <div className="-mx-4 overflow-x-auto">
      <Table className="w-full" hasBorder={false}>
        <Table.Header>
          <Table.Column>Ticker</Table.Column>
          <Table.Column align="right">Token price</Table.Column>
          <Table.Column align="right">Stock price</Table.Column>
          <Table.Column align="right">Gap to stock</Table.Column>
          <Table.Column>Is that normal?</Table.Column>
          <Table.Column align="right">Gaps usually close in</Table.Column>
        </Table.Header>
        <Table.Body>
          {rows.map((row) => (
            <Table.Row key={row.symbol} onPress={() => { window.location.hash = `#/t/${row.symbol}`; }}>
              <Table.Cell><span className="xs-num text-sm">{row.symbol}</span></Table.Cell>
              <Table.Cell align="right"><span className="xs-num text-sm">{price(row.onchain)}</span></Table.Cell>
              <Table.Cell align="right">
                <span className="xs-num text-sm">{price(row.ref)}</span>
                <span className="xs-num ml-1 text-xs text-(--foreground-light)">{row.refAgeSec !== null ? `${span(row.refAgeSec)} ago` : ""}</span>
              </Table.Cell>
              <Table.Cell align="right">
                <span className="inline-flex items-center gap-3">
                  <GapBar value={row.premiumPct} muted={row.stale} />
                  <Premium value={row.premiumPct} stale={row.stale} aging={row.aging} className="w-20 text-sm" />
                </span>
              </Table.Cell>
              <Table.Cell><ReadingLabel reading={normalReading(row)} /></Table.Cell>
              <Table.Cell align="right">
                {row.closeMedianSec !== null ? (
                  <span className="xs-num text-sm">{span(row.closeMedianSec)} <span className="text-xs text-(--foreground-light)">over {row.closeEpisodes} {row.closeEpisodes === 1 ? "mint" : "mints"}</span></span>
                ) : (
                  <span className="text-sm text-(--foreground-light)">No mints seen yet</span>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}

/** Volume, pace against the ticker's own baseline, and the move since the close when the market is shut. */
function PaceTable({ rows, volume, marketOpen }: { rows: SignalRow[]; volume: Map<string, number>; marketOpen: boolean }) {
  return (
    <div className="-mx-4 overflow-x-auto">
      <Table className="w-full" hasBorder={false}>
        <Table.Header>
          <Table.Column>Ticker</Table.Column>
          <Table.Column align="right">Volume</Table.Column>
          <Table.Column>Trading pace</Table.Column>
          <Table.Column align="right">Move since the close</Table.Column>
        </Table.Header>
        <Table.Body>
          {rows.map((row) => (
            <Table.Row key={row.symbol} onPress={() => { window.location.hash = `#/t/${row.symbol}`; }}>
              <Table.Cell><span className="xs-num text-sm">{row.symbol}</span></Table.Cell>
              <Table.Cell align="right"><span className="xs-num text-sm">{usd(volume.get(row.symbol) ?? 0)}</span></Table.Cell>
              <Table.Cell><ReadingLabel reading={paceReading(row)} /></Table.Cell>
              <Table.Cell align="right">
                {marketOpen ? <span className="text-sm text-(--foreground-light)">Market is open</span> : <span className="xs-num text-sm">{pct(row.impliedOpenPct)}</span>}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}

/** What a buy of each size costs against the stock price, from live Jupiter quotes. */
function CostTable({ rows }: { rows: SignalRow[] }) {
  return (
    <div className="-mx-4 overflow-x-auto">
      <Table className="w-full" hasBorder={false}>
        <Table.Header>
          <Table.Column>Ticker</Table.Column>
          {QUOTE_SIZES.map((size) => <Table.Column key={size} align="right">Buy ${size / 1000}K</Table.Column>)}
          <Table.Column>Best route for $10K</Table.Column>
        </Table.Header>
        <Table.Body>
          {rows.map((row) => (
            <Table.Row key={row.symbol} onPress={() => { window.location.hash = `#/t/${row.symbol}`; }}>
              <Table.Cell><span className="xs-num text-sm">{row.symbol}</span></Table.Cell>
              {QUOTE_SIZES.map((size) => {
                const quote = quoteAt(row, size);
                return (
                  <Table.Cell key={size} align="right">
                    {quote ? (
                      <span className="flex flex-col items-end">
                        <span className="xs-num text-sm">{pct(quote.impactPct)}</span>
                        <span className="xs-num text-xs whitespace-nowrap text-(--foreground-light)">{price(quote.price)} a share</span>
                      </span>
                    ) : (
                      <span className="text-sm text-(--foreground-light)">No route</span>
                    )}
                  </Table.Cell>
                );
              })}
              <Table.Cell><span className="text-sm">{quoteAt(row, 10_000)?.route ?? "n/a"}</span></Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}

export function Main({ snapshot, controls, setControls }: {
  snapshot: Snapshot;
  controls: Controls;
  setControls: (next: Controls) => void;
}) {
  const { window: win, kpis, premium, status, signals } = snapshot;
  const [expanded, setExpanded] = useState(false);
  const when = WINDOW_PHRASE[win.key];
  const goTicker = (symbol: string) => { window.location.hash = `#/t/${symbol}`; };

  const shown = premium.series.map((s) => s.symbol);
  const setChart = (next: string[]) => setControls({ ...controls, chart: next });
  const chartReady = premium.series.some((s) => s.points.filter((p) => p[1] !== null).length >= 2);

  const top = snapshot.volumeByTicker.slice(0, 11);
  const rest = snapshot.volumeByTicker.slice(11);
  const restUsd = rest.reduce((sum, row) => sum + row.usd, 0);
  const volumeRows = [
    ...top.map((row, index) => ({ key: row.symbol, label: row.symbol, value: row.usd, display: usd(row.usd), color: chartColor(index) })),
    ...(rest.length > 0 && !expanded ? [{ key: "__others", label: `Others (${rest.length})`, value: restUsd, display: usd(restUsd), color: chartColor(11) }] : []),
    ...(expanded ? rest.map((row) => ({ key: row.symbol, label: row.symbol, value: row.usd, display: usd(row.usd), color: chartColor(11) })) : []),
  ];

  const flowParts = [
    { label: "Exchange trades", value: snapshot.flows.dex, color: EVENT_META.buy.color },
    { label: "Wallet to wallet", value: snapshot.flows.transfers, color: EVENT_META.transfer.color },
    { label: "Minted or redeemed", value: snapshot.flows.mintRedeem, color: EVENT_META.mint.color },
    { label: "Lending", value: snapshot.flows.lending, color: EVENT_META.lend_deposit.color },
    { label: "Trading pool deposits", value: snapshot.flows.liquidity, color: EVENT_META.lp_add.color },
  ];

  // Widest gap first, so the tickers furthest from fair price lead the table.
  const gapRows = [...signals].sort((a, b) => Math.abs(b.premiumPct ?? -1) - Math.abs(a.premiumPct ?? -1));
  const quotedRows = signals.filter((row) => row.slippage);
  const volumeMap = new Map(snapshot.volumeByTicker.map((row) => [row.symbol, row.usd]));
  const scheduled = snapshot.corporate.upcoming.length;

  return (
    <>
      <div data-theme="white">
        <Panel size="base" ink className="w-full gap-4">
          <div className="flex w-full flex-wrap items-end justify-between gap-4">
            <div className="flex max-w-[80ch] flex-col gap-2">
              <Heading level={2} size="3xl">xStocks right now</Heading>
            </div>
            <WindowBar controls={controls} setControls={setControls} />
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Insight
              eyebrow="Active xStocks"
              value={kpis.tradedSinceStart.toLocaleString("en-US")}
              sentence={`traded since the app started, out of ${status.mints.toLocaleString("en-US")} xStocks on Solana`}
              onClick={() => scrollTo("volume")}
            />
            <Insight
              eyebrow="Volume"
              value={usd(kpis.volumeUsd)}
              sentence={`traded ${when}, in ${kpis.trades.toLocaleString("en-US")} trades by ${kpis.traders.toLocaleString("en-US")} wallets`}
              partial={win.partial}
              onClick={() => scrollTo("volume")}
            />
            <Insight
              eyebrow="Net minted"
              value={signedUsd(kpis.netMintUsd)}
              sentence={`of tokens minted minus redeemed ${when}`}
              partial={win.partial}
              onClick={() => scrollTo("mint")}
            />
            <Insight
              eyebrow="Dividends and splits"
              value={String(scheduled)}
              sentence={scheduled === 1 ? "change is scheduled onchain" : "changes are scheduled onchain"}
              onClick={() => scrollTo("corporate")}
            />
          </div>
        </Panel>
      </div>

      <Frame
        id="alerts"
        label="Alerts"
        answer={opportunityNote(snapshot) ?? undefined}
        how={
          <>
            <span>These are conditions in the data, not recommendations.</span>
            <span>A ticker is listed during US market hours when it trades unusually low against its own history (two standard deviations or more), at least 0.25% below the stock price, and a live $10K Jupiter quote still lands below the stock price.</span>
            <span>It is listed only when the stock price is under 30 seconds old, the token traded in the last 5 minutes, the ticker has at least 5 minutes of history, and the condition has held for a minute.</span>
          </>
        }
      >
        {snapshot.opportunities.length > 0 ? (
          <div className="flex flex-col">
            {snapshot.opportunities.map((item) => <OpportunityRow key={item.mint} item={item} now={snapshot.now} />)}
          </div>
        ) : null}
      </Frame>

      <Frame
        id="gap"
        label="Gap to stock over time"
        answer={status.marketOpen ? "The US stock market is open." : "The US stock market is closed."}
        how={
          <>
            <span>Gap = token price ÷ stock price − 1. The token price is the volume-weighted price of exchange trades, sampled every 15 seconds.</span>
            <span>
              The stock price comes from Jupiter's Price API{premium.refMaxAgeSec !== null ? <>, last updated <span className="xs-num">{span(premium.refMaxAgeSec)}</span> ago</> : ""}.
              It updates about once a minute, so during market hours a gap marked "~" may include stock movement since the last update. A grey dashed line means the stock price is over 5 minutes old.
            </span>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {premium.series.map((s, index) => (
            <Tag key={s.symbol} size="sm" className="normal-case" leftAccessory={<Swatch color={chartColor(index)} />} label={s.symbol} onDismiss={shown.length > 1 ? () => setChart(shown.filter((symbol) => symbol !== s.symbol)) : undefined} />
          ))}
          {shown.length < 12 ? (
            <div className="w-40">
              <Select
                aria-label="Add ticker to chart"
                placeholder="+ Add ticker"
                value=""
                onValueChange={(value) => value && setChart([...shown, value])}
                items={snapshot.options.tickers.filter((t) => !shown.includes(t.symbol)).map((t) => ({ value: t.symbol, label: t.symbol }))}
              />
            </div>
          ) : null}
          {controls.chart.length > 0 ? <Button variant="link" onClick={() => setChart([])}>Back to the 4 busiest</Button> : null}
        </div>
        {chartReady ? (
          <Plot>
            <TimeChart
              from={win.from}
              to={win.to}
              height={320}
              includeZero
              minSpan={0.4}
              format={(value) => pct(value)}
              sessions={premium.sessions}
              gaps={status.gaps}
              markers={premium.markers}
              series={premium.series.map((s, index) => ({ label: s.symbol, color: chartColor(index), points: s.points }))}
            />
          </Plot>
        ) : (
          <WarmingUp since={status.startedAt} height={320} detail={`${kpis.trades.toLocaleString("en-US")} trades so far · the chart appears after two 15s samples`} />
        )}
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-(--foreground-medium)">
          <span>0% = same price as the stock</span>
          <span>Shaded = US market open</span>
          <span>▲ tokens minted</span>
          <span>▼ tokens redeemed</span>
          <span>◆ dividend or split</span>
        </div>
      </Frame>

      <Frame
        id="gaps"
        label="Gap by ticker"
        answer={learningNote(signals) ?? undefined}
        how={
          <>
            <span>Covers the 10 busiest tickers in the selected window, widest gap first. The shaded band on each bar marks 0.5% either side of the stock price. Click a row for that ticker's page.</span>
            <span>"Is that normal?" compares the current gap with the ticker's own gaps since the app started. Two standard deviations or more counts as unusual.</span>
            <span>"Gaps usually close in" is the typical time from the first new tokens being minted to the gap returning to normal. A short time means arbitrage is working for that ticker.</span>
            <span>A gap marked "~" is approximate because the stock price is over 30 seconds old. A greyed gap means the stock price is over 5 minutes old and should not be trusted.</span>
          </>
        }
      >
        {signals.length > 0 ? (
          <GapTable rows={gapRows} />
        ) : (
          <WarmingUp since={status.startedAt} height={120} detail="Waiting for the first trades" />
        )}
      </Frame>

      <div className="grid gap-4 xl:grid-cols-2">
        <Frame
          id="flows"
          label="Where tokens go"
          answer={emptyFlowsNote(snapshot) ?? undefined}
          how={
            <>
              <span>Every decoded transaction is sorted into one of five kinds and valued in dollars. Transfers and mints are valued at the stock price.</span>
              <span>Deposits to exchanges such as Kraken and Bybit look like wallet-to-wallet transfers, because the app has no address labels yet.</span>
            </>
          }
        >
          <SplitBar parts={flowParts} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {flowParts.map((part) => (
              <div key={part.label} className="flex flex-col">
                <span className="xs-num text-xl text-(--foreground)">{usd(part.value)}</span>
                <span className="inline-flex items-center gap-1.5 text-sm text-(--foreground-medium)"><Swatch color={part.color} />{part.label}</span>
              </div>
            ))}
          </div>
        </Frame>

        <Frame
          id="volume"
          label="Volume by ticker"
          how={<span>Dollar value of exchange trades per ticker {when}. The top 11 are shown, with the rest grouped as Others. Click a bar for that ticker's page.</span>}
        >
          {volumeRows.length > 0 ? (
            <BarList rows={volumeRows} onSelect={(key) => (key === "__others" ? setExpanded(true) : goTicker(key))} />
          ) : (
            <WarmingUp since={status.startedAt} detail="0 trades in this window" />
          )}
          {rest.length > 0 ? <Button variant="link" className="w-fit" onClick={() => setExpanded(!expanded)}>{expanded ? "Group the smaller tickers" : `Show all ${snapshot.volumeByTicker.length} tickers`}</Button> : null}
        </Frame>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Frame
          id="pace"
          label="Trading pace"
          answer={paceLearningNote(snapshot) ?? undefined}
          how={
            <>
              <span>"Trading pace" compares dollar volume in the last 5 minutes with the average 5 minutes since the app started. Twice the average or more is flagged.</span>
              <span>"Move since the close" fills in while the US market is closed. It is the token's move against the last stock price seen during market hours. It shows onchain sentiment and is not a forecast of the opening price.</span>
            </>
          }
        >
          {signals.length > 0 ? <PaceTable rows={signals} volume={volumeMap} marketOpen={status.marketOpen} /> : <WarmingUp since={status.startedAt} height={120} detail="Waiting for the first trades" />}
        </Frame>

        <Frame
          id="cost"
          label="Cost to buy by order size"
          how={
            <>
              <span>Once a minute the app asks Jupiter's Swap API for a USDC buy of $1K, $10K, and $50K on the five busiest tickers, and takes the best route.</span>
              <span>Each figure is the quoted price per share against the stock price. It includes both the current gap and the extra cost of the order's size. A negative figure means the token is cheaper than the stock.</span>
              <span>When the stock price is over 5 minutes old, sizes are compared with the $1K quote.</span>
            </>
          }
        >
          {quotedRows.length > 0 ? <CostTable rows={quotedRows} /> : <WarmingUp since={status.startedAt} height={120} detail="Quotes start about 20s after the first trades" />}
        </Frame>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Frame
          id="mint"
          label="Minted and redeemed"
          answer={emptyMintNote(snapshot) ?? undefined}
          how={
            <>
              <span>Net dollars minted (right) or redeemed (left) per ticker {when}, valued at the stock price. Tickers that net to less than $1 are left out. Each ticker's page shows its supply over time.</span>
              <span>Mints and redemptions are also marked on the gap chart (▲ and ▼), so you can see a gap close after new tokens arrive.</span>
              <span>Moving tokens between blockchains can also mint and burn, so some of this is not new demand.</span>
            </>
          }
        >
          {snapshot.netMint.length > 0 ? (
            <DivergingBars rows={snapshot.netMint.map((row) => ({ label: row.symbol, value: row.usd }))} positiveColor={EVENT_META.mint.color} negativeColor={EVENT_META.redeem.color} format={signedUsd} />
          ) : null}
        </Frame>

        <Frame
          id="corporate"
          label="Dividends and splits"
          answer={snapshot.corporate.upcoming.length === 0 && snapshot.corporate.applied.length === 0 ? "No dividends or splits are scheduled for any xStock." : undefined}
          how={<span>Each xStock mint stores a multiplier and, when a change is scheduled, the new value and its start time. The app reads these onchain, so a change shows here as soon as the issuer schedules it. Wallet balances update on their own when it takes effect. Past changes are marked ◆ on the gap chart.</span>}
        >
          {snapshot.corporate.upcoming.length + snapshot.corporate.applied.length > 0 ? (
            <CorporateTable upcoming={snapshot.corporate.upcoming} applied={snapshot.corporate.applied} now={snapshot.now} />
          ) : null}
        </Frame>
      </div>

      <Note>
        Figures cover what the app has seen since it started at <span className="xs-num">{clock(status.startedAt)}</span>. There is no history before that.
      </Note>
    </>
  );
}
