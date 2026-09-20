# Data model

All types in `src/types.ts`. Persisted as raw JSON in localStorage; no version/migration layer (bump the storage key instead — see `state_management.md`).

## Goal

| Field | Type | Notes |
|---|---|---|
| `id` | string | `uid()` (UUID) |
| `title` | string | Can be empty (warning shown) |
| `startDate` | `"yyyy-mm-dd"` UTC string | |
| `durationMode` | `"days" \| "hours"` | |
| `duration` | number | Days, or total hours in hours mode; `>= 1` enforced by warnings |
| `hoursPerDay` | number | Used only when `durationMode === "hours"`; `< 1` falls back to 8 in the engine |
| `calendarKind` | `"calendar" \| "workdays"` | `calendar` = every day counts; `workdays` = Mon–Fri only |
| `createdAt` / `updatedAt` | ISO string | `updatedAt` stamped on every patch |

## Subtask

| Field | Type | Notes |
|---|---|---|
| `id` / `goalId` | string | `goalId` links to `Goal.id` |
| `title` | string | |
| `weight` | integer `>= 1` | Relative effort, no fixed sum required |
| `placement` | `"sequential" \| "parallel"` | Sequential = chained in `orderIndex` order; parallel = spans entire goal |
| `startOverride` / `endOverride` | `"yyyy-mm-dd" \| null \| undefined` | Sequential only; UI writes `undefined` when cleared |
| `done` | boolean | |
| `links` | `LinkItem[]` | `{ id, url, label? }` |
| `notes` | string | |
| `orderIndex` | integer | Chain order; ↑/↓ buttons swap values with neighbors |

## AppState

```ts
interface AppState { goals: Goal[]; subtasks: Subtask[]; }
```

## Computed types (never persisted)

Defined in `src/lib/timeline.ts`, derived at render time:

- `ComputedRange { start; end }` — dates are **inclusive**.
- `ComputedSubtask { subtask; computed; effective; units }`
  - `computed` — pure schedule range
  - `effective` — `computed` with overrides applied + clamped to the goal span
  - `units` — unit count of `effective`
- `ComputedTimeline { goalStart; goalEnd; subtasks[]; totalUnits; seqUnits; progress; unitsDescription }`

## Invariants

- `orderIndex` values may have gaps — always sort by it, never assume contiguity.
- Overrides serialize as `null` or absent; treat both as "no override".
- Adding fields is backward-safe; renaming/removing fields breaks stored data (bump the storage key).
- Dates cross component/state boundaries only as `"yyyy-mm-dd"` strings.