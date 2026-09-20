# Architecture

## System shape

- Single-page Vite app. No backend, no router, no state library.
- Entry: `src/main.tsx` → `src/App.tsx`.
- All domain state lives in `App.tsx` (`useState`) and flows down via props; mutations happen through callbacks passed to components.
- Navigation is a single `selectedId: string | null` state: `null` renders `GoalList`, otherwise `GoalDetail` for that goal.
- Persistence: `localStorage` key `goal-planner:v1` (see `state_management.md`).

## Module map

| Path | Responsibility |
|---|---|
| `src/lib/timeline.ts` | Pure scheduling engine (`computeTimeline`, `goalWarnings`). The **only** place allocation/dates are derived. Its output is never stored. |
| `src/lib/dates.ts` | Pure date math on `"yyyy-mm-dd"` UTC strings. |
| `src/lib/storage.ts` | `loadState` / `saveState` of the `AppState` envelope. |
| `src/lib/sample.ts` | Seed state used only when storage is empty. |
| `src/lib/export.ts` | Per-goal JSON download (Blob + anchor). |
| `src/lib/utils.ts` | `uid()`, `slugify()`, `todayStr()`. |
| `src/lib/palette.ts` | Color arrays for timeline segments and card accents. |
| `src/types.ts` | `Goal`, `Subtask`, `AppState`, `LinkItem` (see `data_model.md`). |

## Component tree

```
App
├─ GoalList
│  └─ GoalCard ×N          (per-goal computeTimeline + progress; delete)
└─ GoalDetail
   ├─ goal fields          (title, start, duration, unit, hours/day, calendar kind)
   ├─ ProgressBar + OverviewStrip + warnings list
   ├─ actions              (Export JSON, Print/PDF, Delete goal)
   └─ SubtaskCard ×N       (expandable: notes, links, override dates)
      └─ LinksEditor
```

- `GoalDetail` runs `useMemo(() => computeTimeline(goal, subtasks), [goal, subtasks])` once and hands each card its matching `ComputedSubtask` by id lookup — cards never recompute the schedule.
- `OverviewStrip` draws proportional segments from the sequential entries' `units` (width = `units / Σ seq units`). Parallel tasks are noted in the caption, not drawn.
- `SubtaskCard` expand state is local `useState` per card.

## Data flow on any edit

1. Input change → bound callback (`updateGoal` / `updateSubtask` / etc.) in `App.tsx` → `setState`.
2. State change → `useEffect` persists to localStorage.
3. Re-render → `computeTimeline` re-derives all dates. This is what makes recalculation automatic; never cache its result anywhere.

## Print / theming

- Print = `window.print()` + Tailwind `print:` variants + `.print-card` (`break-inside: avoid`) in `src/index.css`.
- Dark mode = Tailwind `darkMode: "class"`: the `dark` class on `<html>` is toggled in `App.tsx`; explicit preference stored at `gp-theme`; an inline script in `index.html` pre-applies it before first paint to avoid a theme flash.