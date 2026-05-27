export function formatCost(cost: number): string {
  if (cost < 0.0001) return "<$0.0001";
  return `$${cost.toFixed(4)}`;
}

export function formatTokenCount(n: number): string {
  if (n < 1_000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${(n / 1_000_000).toFixed(2)}M`;
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

export function jsonPreview(obj: unknown, maxLen = 100): string {
  const str = JSON.stringify(obj);
  return truncate(str, maxLen);
}

export function pluralize(n: number, singular: string, plural?: string): string {
  return n === 1 ? `${n} ${singular}` : `${n} ${plural ?? singular + "s"}`;
}

export function timestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
}
