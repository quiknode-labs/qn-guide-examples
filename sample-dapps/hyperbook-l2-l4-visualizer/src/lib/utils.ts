export function formatPrice(px: string | undefined | null, coin: string): string {
  if (!px) return "—";
  const num = parseFloat(px);
  if (isNaN(num)) return "—";
  if (coin === "BTC" || coin === "ETH") return `$${num.toFixed(2)}`;
  if (num >= 100) return `$${num.toFixed(2)}`;
  if (num >= 1) return `$${num.toFixed(4)}`;
  if (num >= 0.01) return `$${num.toFixed(5)}`;
  return `$${num.toFixed(6)}`;
}

export function formatSize(sz: string | undefined | null): string {
  if (!sz) return "—";
  const num = parseFloat(sz);
  if (isNaN(num)) return "—";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  if (num >= 100) return num.toFixed(1);
  if (num >= 1) return num.toFixed(3);
  return num.toFixed(4);
}

export function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address || "—";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatBlockHeight(height: string): string {
  if (!height) return "";
  const num = parseInt(height, 10);
  if (isNaN(num)) return height;
  return num.toLocaleString();
}

export function normalizeSide(side: string | undefined | null): "Buy" | "Sell" {
  if (!side) return "Buy";
  const s = side.toLowerCase();
  if (s === "b" || s === "bid" || s === "buy") return "Buy";
  return "Sell";
}
