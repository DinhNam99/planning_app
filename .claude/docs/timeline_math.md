# Timeline math (the scheduler)

Single pure function: `computeTimeline(goal, subtasks)` in `src/lib/timeline.ts`. No side effects, no persistence, no memoization of the result — components call it in `useMemo` and re-derive on every edit. Never cache or store its output.

## 1. Day-units

`totalUnits = goalTotalUnits(goal)` (full conversion rules in `date_logic.md`). Sequential subtasks consume these units; parallel subtasks consume none.

## 2. Sequential allocation by weight

Weights are **relative integers ≥ 1** — they do not need to sum to 100 or any fixed total; the denominator is the sum of sequential weights only:

```
share_i = totalUnits × (weight_i / Σ sequential weights)
```

Fractional shares are converted to **whole units by largest remainder**, so allocated units always sum **exactly** to `totalUnits`. Every positive share is guaranteed ≥ 1 unit (if the goal is shorter than the number of sequential subtasks, the plan overruns the target end — intentional, surfaced by `goalWarnings`).

> Divergence from product spec: the original description said "rounded to 1 decimal." The implementation rounds to whole units with an exact-sum guarantee instead. Preserve the exact-sum property; do not switch to naive per-task rounding.

## 3. Chaining sequential tasks

Walk from `goal.startDate`, honoring `orderIndex`:

- `end = addWorkdays(cursor, units − 1)` (or `addDays` in calendar mode)
- next `cursor` = next working day (or next calendar day) after that end

No overlap, no gaps.

## 4. Goal end

- If any sequential task exists → `goalEnd` = end of the last sequential task (this is the layout truth; the overview strip and parallel spans use it).
- Otherwise → `unitsToEnd(goal, totalUnits)`.

## 5. Parallel subtasks

`computed = { start: goal.startDate, end: goalEnd }` — they span the entire goal. They never consume time; their weight only affects progress.

## 6. Overrides

- Per-subtask `startOverride` / `endOverride` (sequential only, exposed in the expanded card).
- Effective range = computed range with overrides applied, clamped to `[goal.startDate, goalEnd]`, end forced ≥ start.
- Overrides do **not** reflow sibling subtasks.
- Only overrides persist; computed ranges never do.

## 7. Units & display

`unitsInRange` = working-day count (workdays kind) or calendar-day count (calendar kind) of the effective range. Card meta line shows `start → end · N days`.

## 8. Progress

`Σ weight of done subtasks / Σ weight of all subtasks` (0–1), across both placements.

## Warnings (`goalWarnings`)

Rendered as an amber list in `GoalDetail`. Triggers: empty title; duration < 1; `hoursPerDay < 1`; goal shorter than its sequential count (overrun case); weight < 1; override end before start.

## Tests

- `src/lib/timeline.test.ts` + `src/lib/dates.test.ts` — 22 tests covering allocation, chaining, calendar kind, overrides, warnings.
- Run all: `npm test`. Single file: `npx vitest run src/lib/timeline.test.ts` (vitest only picks up `src/**/*.test.ts`).
- The September 2026 fixture dates and the exact-sum allocation cases are load-bearing — update both if the engine changes.