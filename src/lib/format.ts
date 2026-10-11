const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Money is always handled as integer paise; this only formats for display. */
export function formatPaise(paise: number): string {
  return inr.format(paise / 100);
}

export function priceRange(prices: number[]): string {
  if (prices.length === 0) return "";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatPaise(min) : `${formatPaise(min)} – ${formatPaise(max)}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(iso: string): string {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

/** Client-side mirror of the server's phone check, for instant feedback only. */
export function phoneProblem(raw: string): string | null {
  const s = raw.trim();
  if (!s) return "Please enter your WhatsApp/mobile number.";
  const plus = s.startsWith("+") || s.startsWith("00");
  let d = s.replace(/\D/g, "");
  if (s.startsWith("00")) d = d.slice(2);
  if (plus && !d.startsWith("91")) {
    return d.length >= 8 && d.length <= 15 && d[0] !== "0" ? null : "Please enter a valid international number, e.g. +44 7700 900123.";
  }
  if (d.startsWith("91") && d.length === 12) d = d.slice(2);
  else if (d.startsWith("0") && d.length === 11) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? null : "Please enter a valid 10-digit Indian mobile number.";
}

export function pincodeProblem(raw: string): string | null {
  return /^[1-9]\d{5}$/.test(raw.replace(/\s/g, "")) ? null : "Please enter a valid 6-digit PIN code.";
}
