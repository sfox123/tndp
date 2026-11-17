const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** +2.0, −0.4 (true minus sign) */
export function signed(value: number, digits = 1): string {
  const fixed = Math.abs(value).toFixed(digits);
  if (Number(fixed) === 0) return fixed;
  return `${value > 0 ? "+" : "−"}${fixed}`;
}

/** "2026-09" → "Sep 2026" */
export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** Three-month season centred on a month: "2026-09" → "Aug–Oct 2026" */
export function seasonAround(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const first = MONTHS[(m + 10) % 12];
  const last = MONTHS[m % 12];
  return `${first}–${last} ${m === 12 ? y + 1 : y}`;
}

/** "2026-11-16" → "16 Nov" */
export function dayLabel(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

/** "2026-11-16" → "16 Nov 2026" */
export function dateLabel(iso: string): string {
  return `${dayLabel(iso)} ${iso.slice(0, 4)}`;
}

/** Index in a monthly series starting at `start` ("1950-01") → "YYYY-MM" */
export function monthAt(start: string, index: number): string {
  const [y, m] = start.split("-").map(Number);
  const total = y * 12 + (m - 1) + index;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

export function percent(share: number): string {
  const p = share * 100;
  if (p > 0 && p < 1) return "<1%";
  if (p > 99 && p < 100) return ">99%";
  return `${Math.round(p)}%`;
}
