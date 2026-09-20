# Goal Planner 🎯

A local-first goal planning app. Create a goal with a start date and total duration (days or hours), add weighted subtasks, and get an automatically calculated timeline with start/end dates for each subtask.

Each subtask renders as an expandable card — open it to attach links and notes, pin manual date overrides, or mark it done.

## Features

- **Goal management** — create, edit, and delete goals with a start date, duration (days **or** hours), and calendar kind (all days or Mon–Fri weekdays).
- **Weight-based scheduling** — sequential subtasks split the goal's time proportionally to their weights (e.g. weights 3:1 over 10 days → 8 + 2 days).
- **Mixed placement** — subtasks can be **sequential** (chained in order) or **parallel** (spanning the whole goal, e.g. ongoing QA/feedback).
- **Live timeline** — every edit (weight, duration, reorder, add/remove) recalculates dates instantly. No "recalculate" button needed.
- **Expandable subtask cards** — notes, link attachment (label + URL), and optional per-subtask start/end overrides (clamped to the goal span).
- **Progress tracking** — weight-weighted progress bar per goal; mark subtasks done.
- **Reorder subtasks** — ↑/↓ controls; ordering determines the sequential chain.
- **Export** — per-goal JSON download and a print/PDF layout (`Print / PDF` button).
- **Dark mode** — System / Light / Dark toggle, persisted across sessions.
- **Local storage** — all data lives in `localStorage`; nothing leaves your machine.
- **Seed data** — two sample goals on first launch so the app isn't empty.

## Tech stack

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (strict)
- [Vite 5](https://vitejs.dev/) — dev server & build
- [Tailwind CSS 3](https://tailwindcss.com/) (class-based dark mode)
- [Vitest 2](https://vitest.dev/) — unit tests for the scheduling engine
- No backend, no database — `localStorage` only

## Getting started

```bash
npm install
npm run dev        # start dev server at http://localhost:5173
npm test           # run the unit tests (watch: npm run test:watch)
npm run build      # type-check + production build into dist/
npm run preview    # preview the production build
```

## How the timeline is calculated

All scheduling lives in `src/lib/timeline.ts` as a pure, derived function `computeTimeline(goal, subtasks)` — computed dates are never stored, so the timeline stays in sync with every edit.

1. **Goal duration → day-units.** In `days` mode the duration is used directly; in `hours` mode it's divided by `hoursPerDay` (default 8) and rounded to whole days.
2. **Sequential allocation.** Each sequential subtask gets `dayUnits × weight / Σweights`. The fractional shares are rounded to whole days with the largest-remainder method, so the sum is always exact (each positive share gets at least 1 day — if the goal is too short, a warning is shown and the plan extends past the target end).
3. **Chaining.** Subtasks are laid out one after another; with "weekdays" calendars, weekend days are skipped (`addWorkdays`).
4. **Parallel subtasks** span `goalStart → goalEnd` and only contribute to progress, not dates.
5. **Overrides.** A pinned start/end date replaces the calculated range, clamped inside the goal span.
6. **Progress.** `Σ(weight of done subtasks) / Σ(all weights)` across all subtasks.

## Data model

```ts
Goal {
  id, title, startDate,               // "yyyy-mm-dd"
  durationMode: "days" | "hours",
  duration,                           // days, or total hours in hours mode
  hoursPerDay,                        // used when durationMode === "hours"
  calendarKind: "calendar" | "workdays",
  createdAt, updatedAt
}

Subtask {
  id, goalId, title,
  weight,                             // integer >= 1
  placement: "sequential" | "parallel",
  startOverride?, endOverride?,       // optional manual dates
  done, links: [{ id, url, label? }], notes,
  orderIndex
}
```

## Project structure

```
src/
  types.ts                    # Goal / Subtask / AppState models
  lib/
    timeline.ts               # allocation + computeTimeline + warnings (pure, tested)
    dates.ts                  # UTC date math, working-day helpers
    storage.ts                # localStorage load/save
    sample.ts                 # seed data
    export.ts                 # JSON download
    palette.ts                # segment/card colors
    utils.ts                  # uid, slugify, today
    *.test.ts                 # Vitest unit tests
  components/
    GoalList.tsx              # goal cards + progress + create/delete
    GoalDetail.tsx            # goal editor + stats + actions + subtask list
    SubtaskCard.tsx           # expandable card: notes, links, overrides
    OverviewStrip.tsx         # proportional timeline strip
    LinksEditor.tsx           # per-subtask link rows
    ProgressBar.tsx, ThemeToggle.tsx, icons.tsx
  App.tsx                     # state, persistence, navigation
  main.tsx, index.css
```

## Limitations / future ideas

- Holidays are not excluded from working-day calendars (weekends only).
- An override doesn't shift sibling subtasks (date overrides are clamped, not rebalanced).
- No drag-and-drop reordering (↑/↓ buttons instead).
- No JSON import (export only).
- Parallel subtasks intentionally don't consume calendar time — each spans the full goal.

## License

MIT (this is a starter project — adjust as you like).