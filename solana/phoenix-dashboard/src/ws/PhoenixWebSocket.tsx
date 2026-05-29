import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Candle,
  ConnectionState,
  ExchangeFlags,
  FundingPoint,
  MarketStats,
  Orderbook,
  OrderbookLevel,
  Side,
  Timeframe,
  TradePrint,
} from "../types";
import { fetchCandles } from "../api";
import { toNum } from "../utils/format";

const WS_URL = "wss://perp-api.phoenix.trade/v1/ws";
const SYMBOL = "SOL";
const TRADE_CAP = 25;
const MAX_BACKOFF_MS = 15_000;

type SubscriptionParams = Record<string, unknown>;

interface CtxValue {
  connection: ConnectionState;
  exchangeFlags: ExchangeFlags;
  stats: MarketStats;
  orderbook: Orderbook;
  candles: Candle[];
  trades: TradePrint[];
  fundingHistory: FundingPoint[];
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
}

const defaultStats: MarketStats = {
  markPx: null,
  oraclePx: null,
  midPx: null,
  prevDayPx: null,
  dayNtlVlm: null,
  openInterest: null,
  funding: null,
};

const PhoenixCtx = createContext<CtxValue | null>(null);

export function usePhoenix(): CtxValue {
  const ctx = useContext(PhoenixCtx);
  if (!ctx) throw new Error("usePhoenix must be used inside <PhoenixProvider>");
  return ctx;
}

interface ProviderProps {
  children: React.ReactNode;
  initialCandles?: Candle[];
}

export function PhoenixProvider({ children, initialCandles }: ProviderProps) {
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [exchangeFlags, setExchangeFlags] = useState<ExchangeFlags>({
    active: true,
    gated: false,
  });
  const [stats, setStats] = useState<MarketStats>(defaultStats);
  const [orderbook, setOrderbook] = useState<Orderbook>({ bids: [], asks: [] });
  const [candles, setCandles] = useState<Candle[]>([]);
  const [trades, setTrades] = useState<TradePrint[]>([]);
  const [fundingHistory, setFundingHistory] = useState<FundingPoint[]>([]);
  const [timeframe, setTimeframeState] = useState<Timeframe>("1m");

  // Hydrate from REST seed once it arrives (App fetches it on mount).
  useEffect(() => {
    if (!initialCandles?.length) return;
    setCandles((prev) => (prev.length ? prev : initialCandles));
  }, [initialCandles]);

  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(500);
  const reconnectTimer = useRef<number | null>(null);
  const subscriptionsRef = useRef<SubscriptionParams[]>([]);
  const timeframeRef = useRef<Timeframe>(timeframe);
  const tradeCounter = useRef(0);

  // Keep a ref so the message handler always reads the latest active timeframe.
  useEffect(() => {
    timeframeRef.current = timeframe;
  }, [timeframe]);

  const send = useCallback((payload: unknown) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }, []);

  const subscribe = useCallback(
    (params: SubscriptionParams) => {
      subscriptionsRef.current.push(params);
      send({ type: "subscribe", subscription: params });
    },
    [send],
  );

  const unsubscribe = useCallback(
    (match: (p: SubscriptionParams) => boolean) => {
      const remaining: SubscriptionParams[] = [];
      for (const sub of subscriptionsRef.current) {
        if (match(sub)) {
          send({ type: "unsubscribe", subscription: sub });
        } else {
          remaining.push(sub);
        }
      }
      subscriptionsRef.current = remaining;
    },
    [send],
  );

  const subscribeAll = useCallback(
    (tf: Timeframe) => {
      subscriptionsRef.current = [];
      subscribe({ channel: "market", symbol: SYMBOL });
      subscribe({ channel: "orderbook", symbol: SYMBOL });
      subscribe({ channel: "trades", symbol: SYMBOL });
      subscribe({ channel: "candles", symbol: SYMBOL, timeframe: tf });
      subscribe({ channel: "fundingRate", symbol: SYMBOL });
      subscribe({ channel: "exchange", encoding: "json" });
    },
    [subscribe],
  );

  const handleMessage = useCallback((raw: MessageEvent<string>) => {
    let msg: any;
    try {
      msg = JSON.parse(raw.data);
    } catch {
      return;
    }
    if (!msg || typeof msg !== "object") return;

    const kind: string | undefined = msg.channel ?? msg.type;
    if (!kind) return;

    if (kind === "subscriptionStatus") return;
    if (kind === "subscriptionError" || kind === "error") {
      // eslint-disable-next-line no-console
      console.warn("[phoenix-ws]", kind, msg);
      return;
    }

    switch (kind) {
      case "market":
        applyMarketStats(msg);
        break;
      case "orderbook":
        applyOrderbook(msg.orderbook ?? msg);
        break;
      case "trades":
        applyTrades(msg.trades ?? []);
        break;
      case "candle":
      case "candles":
        applyCandle(msg.candle ?? msg.candles ?? msg);
        break;
      case "fundingRate":
        applyFunding(msg);
        break;
      case "exchange":
        applyExchange(msg);
        break;
      default:
        break;
    }
  }, []);

  const applyMarketStats = (data: any) => {
    if (!data) return;
    const next: MarketStats = {
      markPx: toNum(data.markPx ?? data.markPrice),
      oraclePx: toNum(data.oraclePx ?? data.oraclePrice ?? data.indexPx),
      midPx: toNum(data.midPx ?? data.midPrice),
      prevDayPx: toNum(data.prevDayPx ?? data.prevDayPrice),
      dayNtlVlm: toNum(data.dayNtlVlm ?? data.dayNotionalVolume ?? data.volume24h),
      openInterest: toNum(data.openInterest ?? data.oi),
      funding: toNum(data.funding ?? data.fundingRate),
    };
    setStats((prev) => ({
      markPx: next.markPx ?? prev.markPx,
      oraclePx: next.oraclePx ?? prev.oraclePx,
      midPx: next.midPx ?? prev.midPx,
      prevDayPx: next.prevDayPx ?? prev.prevDayPx,
      dayNtlVlm: next.dayNtlVlm ?? prev.dayNtlVlm,
      openInterest: next.openInterest ?? prev.openInterest,
      funding: next.funding ?? prev.funding,
    }));
  };

  const parseLevels = (raw: any): OrderbookLevel[] => {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((lvl: any) => {
        if (Array.isArray(lvl)) {
          return { price: toNum(lvl[0]) ?? 0, size: toNum(lvl[1]) ?? 0 };
        }
        return {
          price: toNum(lvl.price ?? lvl.px) ?? 0,
          size: toNum(lvl.size ?? lvl.sz ?? lvl.quantity) ?? 0,
        };
      })
      .filter((lvl: OrderbookLevel) => lvl.price > 0 && lvl.size > 0);
  };

  const applyOrderbook = (data: any) => {
    if (!data) return;
    // Common shapes: { bids: [], asks: [] } or { levels: [bids, asks] } (Hyperliquid-style)
    let bids: OrderbookLevel[] = [];
    let asks: OrderbookLevel[] = [];
    if (Array.isArray(data.levels) && data.levels.length === 2) {
      bids = parseLevels(data.levels[0]);
      asks = parseLevels(data.levels[1]);
    } else {
      bids = parseLevels(data.bids);
      asks = parseLevels(data.asks);
    }
    bids.sort((a, b) => b.price - a.price);
    asks.sort((a, b) => a.price - b.price);
    setOrderbook({ bids, asks, time: toNum(data.time) ?? Date.now() });

    // Derive mid if market stats hasn't given us one yet
    if (bids.length && asks.length) {
      const mid = (bids[0].price + asks[0].price) / 2;
      setStats((prev) => (prev.midPx == null ? { ...prev, midPx: mid } : prev));
    }
  };

  const normalizeSide = (s: unknown): Side => {
    const v = typeof s === "string" ? s.toLowerCase() : "";
    if (v === "b" || v === "bid" || v === "buy" || v === "long") return "buy";
    if (v === "a" || v === "ask" || v === "sell" || v === "short") return "sell";
    return "buy";
  };

  const applyTrades = (data: any) => {
    if (!data) return;
    const list: any[] = Array.isArray(data) ? data : data.trades ?? [data];
    if (!list.length) return;

    const incoming: TradePrint[] = list
      .map((t: any): TradePrint | null => {
        const baseAmount = toNum(t.baseAmount);
        const quoteAmount = toNum(t.quoteAmount);
        const size = toNum(t.size ?? t.sz ?? t.quantity) ?? baseAmount;
        const explicitPrice = toNum(t.price ?? t.px);
        const price =
          explicitPrice ??
          (baseAmount && quoteAmount && baseAmount > 0 ? quoteAmount / baseAmount : null);
        // timestamp comes in seconds (string-encoded); other fields may already be ms.
        const tsSec = toNum(t.timestamp);
        const tsMs = toNum(t.time ?? t.ts);
        const time = tsMs != null ? tsMs : tsSec != null ? tsSec * 1000 : null;
        if (price == null || size == null || time == null) return null;
        const notional = quoteAmount ?? price * size;
        tradeCounter.current += 1;
        const stableId =
          t.tradeSequenceNumber ?? `${t.slot ?? ""}-${t.slotIndex ?? ""}`;
        return {
          id: `${stableId}-${tradeCounter.current}`,
          time,
          side: normalizeSide(t.side ?? t.direction),
          price,
          size,
          notional,
          numFills: toNum(t.numFills) ?? undefined,
        };
      })
      .filter((t): t is TradePrint => t !== null)
      .sort((a, b) => b.time - a.time);

    if (!incoming.length) return;
    setTrades((prev) => [...incoming, ...prev].slice(0, TRADE_CAP));
  };

  const applyCandle = (data: any) => {
    if (!data) return;
    const list: any[] = Array.isArray(data) ? data : data.candles ?? [data];
    setCandles((prev) => {
      const map = new Map<number, Candle>();
      for (const c of prev) map.set(c.time, c);
      for (const c of list) {
        const rawTime = toNum(c.time ?? c.t);
        if (rawTime == null) continue;
        // WebSocket sends seconds; REST sends ms. Normalize to ms.
        const time = rawTime < 1e12 ? rawTime * 1000 : rawTime;
        const open = toNum(c.open ?? c.o);
        const high = toNum(c.high ?? c.h);
        const low = toNum(c.low ?? c.l);
        const close = toNum(c.close ?? c.c);
        if (open == null || high == null || low == null || close == null) continue;
        map.set(time, {
          time,
          open,
          high,
          low,
          close,
          markOpen: toNum(c.markOpen) ?? undefined,
          markHigh: toNum(c.markHigh) ?? undefined,
          markLow: toNum(c.markLow) ?? undefined,
          markClose: toNum(c.markClose) ?? undefined,
          volume: toNum(c.volume ?? c.v) ?? 0,
          volumeQuote: toNum(c.volumeQuote) ?? 0,
          tradeCount: toNum(c.tradeCount) ?? 0,
        });
      }
      return Array.from(map.values()).sort((a, b) => a.time - b.time);
    });
  };

  const applyFunding = (data: any) => {
    if (!data) return;
    const rate = toNum(data.funding ?? data.fundingRate ?? data.rate ?? data);
    if (rate == null) return;
    setStats((prev) => ({ ...prev, funding: rate }));
    setFundingHistory((prev) => [...prev, { time: Date.now(), rate }].slice(-720));
  };

  const applyExchange = (msg: any) => {
    if (!msg) return;
    const pickFlags = (src: any): ExchangeFlags | null => {
      if (!src) return null;
      const features: string[] = (src.exchangeStatusFeatures ?? src.features ?? [])
        .map((t: unknown) => String(t).toLowerCase());
      if (typeof src.active === "boolean" || typeof src.gated === "boolean" || features.length) {
        return {
          active: typeof src.active === "boolean" ? src.active : features.includes("active"),
          gated: typeof src.gated === "boolean" ? src.gated : features.includes("gated"),
        };
      }
      return null;
    };

    if (msg.messageType === "snapshot") {
      const flags = pickFlags(msg.exchange);
      if (flags) setExchangeFlags(flags);
      return;
    }
    if (msg.messageType === "delta") {
      const ops: any[] = msg.deltas ?? msg.ops ?? [];
      for (const op of ops) {
        if (op?.kind === "exchangeStatusChanged" || op?.op === "exchangeStatusChanged") {
          const flags = pickFlags(op.status ?? op.data ?? op.exchange ?? op);
          if (flags) setExchangeFlags(flags);
        }
      }
      return;
    }
    const flags = pickFlags(msg.exchange) ?? pickFlags(msg);
    if (flags) setExchangeFlags(flags);
  };

  const connect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    setConnection((prev) => (prev === "open" ? prev : prev === "closed" ? "connecting" : prev));
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      backoffRef.current = 500;
      setConnection("open");
      subscribeAll(timeframeRef.current);
    };

    ws.onmessage = handleMessage;

    ws.onerror = () => {
      // The close event will follow; backoff is handled there.
    };

    ws.onclose = () => {
      wsRef.current = null;
      setConnection("reconnecting");
      // Re-seed candles on reconnect — the WS may have advanced past us.
      fetchCandles(SYMBOL, timeframeRef.current, 500)
        .then(setCandles)
        .catch(() => {});
      const delay = Math.min(backoffRef.current, MAX_BACKOFF_MS);
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
      reconnectTimer.current = window.setTimeout(connect, delay);
    };
  }, [handleMessage, subscribeAll]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
    // connect is stable via useCallback dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTimeframe = useCallback(
    (tf: Timeframe) => {
      if (tf === timeframeRef.current) return;
      // Unsubscribe the current candles channel, swap in the new one.
      unsubscribe((p) => p.channel === "candles");
      subscribe({ channel: "candles", symbol: SYMBOL, timeframe: tf });
      setCandles([]);
      timeframeRef.current = tf;
      setTimeframeState(tf);
      fetchCandles(SYMBOL, tf, 500)
        .then(setCandles)
        .catch(() => {});
    },
    [subscribe, unsubscribe],
  );

  const value = useMemo<CtxValue>(
    () => ({
      connection,
      exchangeFlags,
      stats,
      orderbook,
      candles,
      trades,
      fundingHistory,
      timeframe,
      setTimeframe,
    }),
    [connection, exchangeFlags, stats, orderbook, candles, trades, fundingHistory, timeframe, setTimeframe],
  );

  return <PhoenixCtx.Provider value={value}>{children}</PhoenixCtx.Provider>;
}
