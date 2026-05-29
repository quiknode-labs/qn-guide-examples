import type { MarketConfig } from "../types";
import { fmtPct } from "../utils/format";

interface Props {
  config: MarketConfig | null;
}

function lotsToBase(lots: number | string, decimals: number): number {
  return Number(lots) * Math.pow(10, -decimals);
}

function fmtBase(amount: number, symbol: string): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M ${symbol}`;
  if (abs >= 1_000) return `${(amount / 1_000).toFixed(amount >= 10_000 ? 0 : 1)}k ${symbol}`;
  if (abs >= 1) return `${amount.toFixed(2)} ${symbol}`;
  return `${amount.toFixed(4)} ${symbol}`;
}

export function MarketInfo({ config }: Props) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="qn-eyebrow">Market Info</span>
        {config && (
          <span className="font-mono text-[10px] uppercase tracking-wide text-fg-ghost">
            assetId {config.assetId} · {config.marketStatus}
          </span>
        )}
      </div>
      {config == null ? (
        <div className="p-5 font-mono uppercase text-[10px] tracking-wide text-fg-ghost">
          // Loading
        </div>
      ) : (
        <MarketInfoBody config={config} />
      )}
    </div>
  );
}

function MarketInfoBody({ config }: { config: MarketConfig }) {
  const { symbol, baseLotsDecimals } = config;

  // The first tier defines the size band over which the max leverage applies.
  // Subsequent tiers extend the position-size cap at progressively lower leverage.
  const topTier = config.leverageTiers[0];
  const lastTier = config.leverageTiers[config.leverageTiers.length - 1];
  const highLevSizeCap = topTier ? lotsToBase(topTier.maxSizeBaseLots, baseLotsDecimals) : 0;
  const totalPositionCap = lastTier ? lotsToBase(lastTier.maxSizeBaseLots, baseLotsDecimals) : 0;
  const reducedLevTier = config.leverageTiers[1];
  const reducedLeverage = reducedLevTier ? reducedLevTier.maxLeverage : null;

  const lotSize = Math.pow(10, -baseLotsDecimals);
  const oiCap = lotsToBase(config.openInterestCapBaseLots, baseLotsDecimals);
  const maxLiq = lotsToBase(config.maxLiquidationSizeBaseLots, baseLotsDecimals);

  return (
    <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5 text-xs">
      <Field
        label="Max leverage"
        value={`${topTier?.maxLeverage.toFixed(0) ?? "—"}×`}
        sub={`up to ${fmtBase(highLevSizeCap, symbol)} position`}
      />
      <Field
        label="Position cap"
        value={fmtBase(totalPositionCap, symbol)}
        sub={
          reducedLeverage != null
            ? `> ${fmtBase(highLevSizeCap, symbol)} capped at ${reducedLeverage.toFixed(0)}×`
            : "hard cap"
        }
      />
      <Field label="Taker fee" value={fmtPct(config.takerFee * 100, 3, false)} />
      <Field label="Maker fee" value={fmtPct(config.makerFee * 100, 4, false)} />

      <Field
        label="Funding interval"
        value={`${(config.fundingIntervalSeconds / 3600).toFixed(0)}h`}
        sub={`period ${(config.fundingPeriodSeconds / 3600).toFixed(0)}h`}
      />
      <Field
        label="Lot size"
        value={`${lotSize.toFixed(baseLotsDecimals)} ${symbol}`}
        sub="smallest size increment"
      />
      <Field label="Open interest cap" value={fmtBase(oiCap, symbol)} sub="market-wide" />
      <Field label="Max liquidation" value={fmtBase(maxLiq, symbol)} sub="single liquidation" />

      <div className="col-span-2 md:col-span-4 mt-1">
        <div className="qn-eyebrow mb-2">Risk factors</div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-x-6 gap-y-3 text-[11px]">
          <Field label="Maintenance" value={`${config.riskFactors.maintenance}%`} compact />
          <Field label="Backstop" value={`${config.riskFactors.backstop}%`} compact />
          <Field label="High risk" value={`${config.riskFactors.highRisk}%`} compact />
          <Field label="UPNL" value={`${config.riskFactors.upnl}%`} compact />
          <Field
            label="UPNL (withdraw)"
            value={`${config.riskFactors.upnlForWithdrawals}%`}
            compact
          />
          <Field label="Cancel order" value={`${config.riskFactors.cancelOrder}%`} compact />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  sub,
  compact,
}: {
  label: string;
  value: string;
  sub?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono uppercase text-[10px] tracking-wider text-fg-ghost">{label}</span>
      <span className={`font-mono tabular-nums text-fg ${compact ? "text-xs" : "text-sm"}`}>
        {value}
      </span>
      {sub && <span className="font-mono text-[10px] text-fg-ghost">{sub}</span>}
    </div>
  );
}
