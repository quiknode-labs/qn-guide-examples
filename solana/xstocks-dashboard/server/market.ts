// US equity regular session: 09:30 to 16:00 America/New_York, Monday to Friday.
// Full-day NYSE holidays, plus the days the market closes early at 13:00.
const HOLIDAYS = new Set([
  "2026-01-01", "2026-01-19", "2026-02-16", "2026-04-03", "2026-05-25", "2026-06-19", "2026-07-03",
  "2026-09-07", "2026-11-26", "2026-12-25",
  "2027-01-01", "2027-01-18", "2027-02-15", "2027-03-26", "2027-05-31", "2027-06-18", "2027-07-05",
  "2027-09-06", "2027-11-25", "2027-12-24",
]);

/** NYSE early closes at 13:00 ET, from NYSE's published holiday and early closings calendar. */
const EARLY_CLOSES = new Set(["2026-11-27", "2026-12-24", "2027-11-26"]);

const nyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short",
});

function nyParts(ms: number) {
  const parts = Object.fromEntries(nyFormat.formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    weekday: parts.weekday as string,
  };
}

const OPEN_MINUTE = 9 * 60 + 30;
const CLOSE_MINUTE = 16 * 60;
const EARLY_CLOSE_MINUTE = 13 * 60;

export function isMarketOpen(ms: number): boolean {
  const { date, minutes, weekday } = nyParts(ms);
  if (weekday === "Sat" || weekday === "Sun" || HOLIDAYS.has(date)) return false;
  return minutes >= OPEN_MINUTE && minutes < (EARLY_CLOSES.has(date) ? EARLY_CLOSE_MINUTE : CLOSE_MINUTE);
}

/** Open intervals [start, end] in ms that overlap [from, to], found by scanning minute by minute. */
export function marketSessions(from: number, to: number): [number, number][] {
  const sessions: [number, number][] = [];
  const step = 60_000;
  let start: number | null = null;
  for (let t = Math.floor(from / step) * step; t <= to; t += step) {
    const open = isMarketOpen(t);
    if (open && start === null) start = Math.max(t, from);
    if (!open && start !== null) {
      sessions.push([start, t]);
      start = null;
    }
  }
  if (start !== null) sessions.push([start, to]);
  return sessions;
}
