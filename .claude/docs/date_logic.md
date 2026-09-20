# Date logic

## Conventions — read before touching dates

- Dates are **strings** `"yyyy-mm-dd"` (type alias `DateStr`), always UTC.
- Lexicographic string comparison (`<`, `<=`) equals chronological order — used by `clampDate` and the workday-count loop.
- `Date` objects never cross component/state boundaries. No date library (no date-fns/dayjs). All helpers live in `src/lib/dates.ts`.

## Helpers (`src/lib/dates.ts`)

| Function | Behavior |
|---|---|
| `parseDate(s)` | `new Date(\`${s}T00:00:00.000Z\`)` — UTC midnight |
| `formatDate(d)` | Date → `yyyy-mm-dd` (UTC) |
| `addDays(s, n)` | ±n calendar days via fixed ms math (DST-safe) |
| `isWeekend(s)` | UTC day is Sat/Sun |
| `addWorkdays(s, n)` | n ≥ 0 working days, skipping weekends |
| `daysBetween(a, b)` | b − a in calendar days (may be negative) |
| `countWorkdaysInclusive(a, b)` | Working days in inclusive range; 0 if `end < start` |
| `formatDisplay(s)` | "Sep 21, 2026" |

## Semantics that matter

- **End dates are inclusive.** A 1-unit task has `start == end`.
- Example: from Mon `2026-09-21`, +7 working days = `2026-09-30` (weekends skipped). These exact dates are load-bearing in the tests.
- Fractional day math is **not** supported at the UI/date layer — durations collapse to whole day-units first (see below).

## Hours → day-units

In `src/lib/timeline.ts`:

```ts
goalTotalUnits(goal):
  days  → max(1, round(duration))
  hours → max(1, round(duration / hoursPerDay))   // hoursPerDay < 1 falls back to 8
```

- Whether weekends are skipped depends on `calendarKind` (`calendar` vs `workdays`), **not** on the unit mode.
- Result is whole day-units; that value is what sequential subtasks consume.

## Gotchas

- `addWorkdays` / `countWorkdaysInclusive` iterate day-by-day — fine for v1 goals, but avoid calling them in loops over large durations.
- `daysBetween` can return negatives; `unitsInRange` guards `end < start` → 0.
- Year boundaries, leap days, and month lengths are handled by the UTC ms math — do not reimplement with local-time `Date` arithmetic.