/** Dates are stored as "yyyy-mm-dd" strings and treated as UTC to avoid DST/timezone issues. */
export type DateStr = string;

const MS_PER_DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function parseDate(s: DateStr): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

export function formatDate(d: Date): DateStr {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Add `n` calendar days (may be negative). */
export function addDays(s: DateStr, n: number): DateStr {
  return formatDate(new Date(parseDate(s).getTime() + n * MS_PER_DAY));
}

export function isWeekend(s: DateStr): boolean {
  const dow = parseDate(s).getUTCDay();
  return dow === 0 || dow === 6;
}

/** Add `n` working days (Mon–Fri). Returns the date `n` working days after `s` (exclusive of `s`). */
export function addWorkdays(s: DateStr, n: number): DateStr {
  let cur = s;
  let remaining = Math.max(0, n);
  while (remaining > 0) {
    cur = addDays(cur, 1);
    if (!isWeekend(cur)) remaining -= 1;
  }
  return cur;
}

/** Number of calendar days between two dates (b - a). */
export function daysBetween(a: DateStr, b: DateStr): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / MS_PER_DAY);
}

/** Number of working days in the inclusive range [start, end]. */
export function countWorkdaysInclusive(start: DateStr, end: DateStr): number {
  if (end < start) return 0;
  let n = 0;
  let cur = start;
  let guard = 0;
  while (cur <= end && guard < 1_000_000) {
    if (!isWeekend(cur)) n += 1;
    cur = addDays(cur, 1);
    guard += 1;
  }
  return n;
}

export function formatDisplay(s: DateStr): string {
  const d = parseDate(s);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}