import { usePhoenix } from "../ws/PhoenixWebSocket";

export function ConnectionStatus() {
  const { connection, exchangeFlags } = usePhoenix();

  const label =
    connection === "open"
      ? "Connected"
      : connection === "reconnecting"
        ? "Reconnecting"
        : "Connecting";

  const dotColor =
    connection === "open"
      ? "bg-accent"
      : connection === "reconnecting"
        ? "bg-bear"
        : "bg-fg-ghost";

  const exchangeBadge = !exchangeFlags.active
    ? { text: "Closed", cls: "qn-badge qn-badge--bear" }
    : exchangeFlags.gated
      ? { text: "Gated", cls: "qn-badge" }
      : { text: "Live", cls: "qn-badge qn-badge--accent" };

  return (
    <div className="flex items-center gap-3">
      <span className={exchangeBadge.cls}>{exchangeBadge.text}</span>
      <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase text-fg-dim tracking-wide">
        <span
          className={`inline-block w-1.5 h-1.5 ${dotColor} ${
            connection !== "open" ? "animate-pulse" : ""
          }`}
        />
        {label}
      </span>
    </div>
  );
}
