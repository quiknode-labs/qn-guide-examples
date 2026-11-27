import { Badge, Heading, Logo, Panel, RollingNumber, Status, Table, Tag, cn } from "../ui.tsx";
import type { CorporateAction, DecodedEvent, Opportunity, Snapshot } from "../../../shared/types.ts";
import { EVENT_META, countdown, duration, pct, span, stamp } from "../format.ts";
import type { Reading } from "../insights.ts";
import { Swatch } from "./Frame.tsx";
import { useTick } from "./charts.tsx";

export const EXCHANGE_NOTE =
  "Exchange trades on Kraken, Bybit, and Hyperliquid happen offchain and are not shown. Their deposits and withdrawals appear as transfers.";

export function TopBar({ snapshot }: { snapshot: Snapshot }) {
  useTick(1000);
  const { status } = snapshot;
  const slotAge = status.slotTime ? Math.max(0, Math.round((Date.now() - status.slotTime) / 1000)) : null;
  return (
    <header data-theme="inverted" className="bg-(--background) text-(--foreground)">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3">
        <a href="#/" className="flex items-center gap-3 no-underline">
          <Logo className="h-6 text-(--foreground)" aria-label="Quicknode" />
          <Heading level={1} size="xl">xStocks Live</Heading>
        </a>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <Badge>{status.marketOpen ? "US MARKET OPEN" : "US MARKET CLOSED"}</Badge>
          <Status
            size="sm"
            variant={status.phase === "live" ? "success" : status.phase === "reconnecting" ? "warning" : "info"}
            label={status.phase === "live" ? "Stream connected" : status.phase === "reconnecting" ? "Reconnecting" : "Starting"}
          />
          <span className="xs-num text-xs uppercase text-(--foreground-medium)">
            Slot {status.slot?.toLocaleString("en-US") ?? "n/a"}
            {slotAge !== null ? ` · ${slotAge}s ago` : ""}
          </span>
          <span className="xs-num text-xs uppercase text-(--foreground-medium)">
            Watching for {duration((Date.now() - status.startedAt) / 1000)}
          </span>
        </div>
      </div>
    </header>
  );
}

export function Kpi({ label, value, caption, partial }: { label: string; value: string; caption: string; partial?: boolean }) {
  return (
    <div data-theme="white" className="min-w-0">
      <Panel size="base" ink className="h-full w-full gap-1">
        <div className="flex w-full items-center justify-between gap-2">
          <span className="xs-num text-xs uppercase text-(--foreground-medium)">{label}</span>
          {partial ? <Tag label="partial" /> : null}
        </div>
        <span className="xs-num text-3xl text-(--foreground)">
          <RollingNumber>{value}</RollingNumber>
        </span>
        <span className="text-sm text-(--foreground-medium)">{caption}</span>
      </Panel>
    </div>
  );
}

export function EventBadge({ type }: { type: DecodedEvent["type"] }) {
  const meta = EVENT_META[type];
  return (
    <span className="inline-flex items-center gap-1.5">
      <Swatch color={meta.color} />
      <Badge>{meta.label}</Badge>
    </span>
  );
}

/** Summary card: one headline figure and the sentence that says what it means. Jumps to its section. */
export function Insight({ eyebrow, value, sentence, partial, onClick }: { eyebrow: string; value: string; sentence: string; partial?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex cursor-pointer flex-col gap-1 border border-(--border) bg-(--background-elevated) p-4 text-left hover:border-(--foreground)">
      <span className="flex w-full items-center justify-between gap-2">
        <span className="xs-num text-xs uppercase text-(--foreground-medium)">{eyebrow}</span>
        {partial ? <Tag label="partial" /> : null}
      </span>
      <span className="xs-num text-3xl text-(--foreground)"><RollingNumber>{value}</RollingNumber></span>
      <span className="text-sm text-(--foreground-medium)">{sentence}</span>
    </button>
  );
}

/** A small bar showing how far a gap sits above or below zero. The scale stops at 2% each way,
 * and the shaded band marks 0.5% either side, the range that counts as near fair price. */
export function GapBar({ value, muted = false }: { value: number | null; muted?: boolean }) {
  const half = value === null ? 0 : Math.min(50, (Math.abs(value) / 2) * 50);
  return (
    <span aria-hidden="true" className="relative inline-block h-3 w-24 shrink-0 bg-(--background-elevated)">
      <span className="absolute inset-y-0 left-[37.5%] w-1/4 bg-(--grid)" />
      {value !== null ? (
        <span
          className={cn("absolute inset-y-0", muted ? "bg-(--foreground-light)" : "bg-(--foreground)")}
          style={value >= 0 ? { left: "50%", width: `${half}%` } : { right: "50%", width: `${half}%` }}
        />
      ) : null}
      <span className="absolute inset-y-[-2px] left-1/2 w-px bg-(--foreground-medium)" />
    </span>
  );
}

/** A plain-language verdict. Flagged readings get an ink chip so they stand out in a column. */
export function ReadingLabel({ reading }: { reading: Reading }) {
  return (
    <span title={reading.detail} className={cn("text-sm whitespace-nowrap", reading.flag ? "bg-(--background-inverted) px-1.5 py-0.5 text-(--foreground-inverted)" : reading.label === "Still learning" ? "text-(--foreground-light)" : "text-(--foreground)")}>
      {reading.label}
    </span>
  );
}

/**
 * Three levels: fresh, aging (market open and the reference is over 30s old, shown with a "~"
 * prefix), and stale (over 5 minutes, greyed out).
 */
export function Premium({ value, stale, aging = false, className }: { value: number | null; stale: boolean; aging?: boolean; className?: string }) {
  const title = stale
    ? "Reference price is stale"
    : aging
      ? "Reference price is over 30s old. The premium may include stock movement since then."
      : undefined;
  return (
    <span className={cn("xs-num", stale ? "text-(--foreground-light)" : aging ? "text-(--foreground-medium)" : "text-(--foreground)", className)} title={title}>
      {aging && value !== null ? "~" : ""}
      {pct(value)}
      {stale && value !== null ? " (stale)" : ""}
    </span>
  );
}

/** Percent change in shares per token from a multiplier change. */
function shareChange(action: CorporateAction): number {
  return (action.to / action.from - 1) * 100;
}

/** Scheduled and applied dividends and splits in one table, soonest first. */
export function CorporateTable({ upcoming, applied, now, showTicker = true }: { upcoming: CorporateAction[]; applied: CorporateAction[]; now: number; showTicker?: boolean }) {
  const rows = [...upcoming.map((action) => ({ action, upcoming: true })), ...applied.map((action) => ({ action, upcoming: false }))];
  return (
    <div className="-mx-4 max-h-80 overflow-auto">
      <Table className="w-full" hasBorder={false}>
        <Table.Header>
          {showTicker ? <Table.Column>Ticker</Table.Column> : null}
          <Table.Column>Type</Table.Column>
          <Table.Column align="right">Shares per token</Table.Column>
          <Table.Column align="right">When</Table.Column>
          <Table.Column align="right">Multiplier</Table.Column>
        </Table.Header>
        <Table.Body>
          {rows.map(({ action, upcoming: soon }) => {
            const change = shareChange(action);
            return (
              <Table.Row key={`${action.mint}${action.t}`} onPress={showTicker ? () => { window.location.hash = `#/t/${action.symbol}`; } : undefined}>
                {showTicker ? <Table.Cell><span className="xs-num text-sm">{action.symbol}</span></Table.Cell> : null}
                <Table.Cell><span className="text-sm">{action.kind === "split" ? "Split" : "Dividend"}</span></Table.Cell>
                <Table.Cell align="right"><span className="xs-num text-sm">{change >= 0 ? "+" : ""}{change.toFixed(3)}%</span></Table.Cell>
                <Table.Cell align="right">
                  <span className="xs-num text-sm">{soon ? `in ${countdown(action.t - now)}` : <span className="text-(--foreground-medium)">applied {stamp(action.t, now)}</span>}</span>
                </Table.Cell>
                <Table.Cell align="right"><span className="xs-num text-xs text-(--foreground-medium)">{action.from.toFixed(6)} → {action.to.toFixed(6)}</span></Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </div>
  );
}

/** One alert line: how far below the stock it trades, what a buy costs, and the evidence. */
export function OpportunityRow({ item, now }: { item: Opportunity; now: number }) {
  const evidence = [
    `${Math.abs(item.z).toFixed(1)} standard deviations below its usual gap`,
    `Best route ${item.route}`,
    `Holding for ${span((now - item.since) / 1000)}`,
  ];
  return (
    <a href={`#/t/${item.symbol}`} className="flex flex-wrap items-start gap-x-4 gap-y-1 border-b border-(--border) py-3 text-(--foreground) no-underline last:border-b-0 hover:bg-(--hover)">
      <span className="xs-num w-20 shrink-0 text-base">{item.symbol}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-base">
          {item.symbol} is <span className="xs-num">{Math.abs(item.premiumPct).toFixed(2)}%</span> below its stock price, unusually low for it. Buying $10K costs{" "}
          <span className="xs-num">{Math.abs(item.cost10k).toFixed(2)}%</span> less than the stock.
        </span>
        <span className="xs-num text-xs text-(--foreground-medium)">{evidence.join(" · ")}</span>
      </span>
    </a>
  );
}
