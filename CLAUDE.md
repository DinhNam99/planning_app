# CLAUDE.md

## 1. Project Overview

GoalStack is a local-first React SPA for weighted goal planning. Users create a goal with a start date and total duration (days or hours), add subtasks with relative effort weights, and GoalStack derives each subtask's start/end dates into a timeline of expandable cards (notes, links, progress). All data persists to browser `localStorage`; there is no backend.

## 2. Tech Stack

- React 18.3 / TypeScript ~5.6 (strict) / Vite 5.4
- Tailwind CSS 3.4 — class-based dark mode (`darkMode: "class"`)
- Vitest 2.1 — unit tests
- No state library, no router, no date library, no backend
- Node 18 — dependency majors are pinned for it

## 3. Dev Commands

```bash
npm install
npm run dev       # dev server → http://localhost:5173
npm test          # vitest run (watch: npm run test:watch)
npm run build     # tsc --noEmit (strict typecheck) THEN vite build
```

```bash
# single test file (vitest only picks up src/**/*.test.ts):
npx vitest run src/lib/timeline.test.ts
```

No lint/format tooling configured — the typecheck inside `npm run build` is the gate.

## 4. Core Logic Summary

Sequential subtasks split the goal's total day-units proportionally to weight:

```
allocated_units_i = totalUnits × (weight_i / Σ sequential weights)
```

Shares are rounded to whole units via largest remainder, always summing exactly to the goal's day-units. Parallel subtasks span the whole goal and never consume time. All dates are derived by the pure function `computeTimeline()` in `src/lib/timeline.ts` and are never stored — that's what makes edits recalculate instantly. Full detail: `.claude/docs/timeline_math.md`.

## 5. Key Constraints

- **Never persist or cache computed dates** — scheduling must stay a pure derivation; only user overrides are stored.
- **Dates are `"yyyy-mm-dd"` UTC strings** — no `Date` objects in state, no date library; helpers in `src/lib/dates.ts`.
- **Weights are integers ≥ 1** (relative, no fixed sum). Parallel subtasks affect progress only, never dates.
- **Storage keys are load-bearing**: `goal-planner:v1` (state) and `gp-theme` (theme). On incompatible shape changes, bump the key — don't write migrations.
- **Don't bump Vite/React/Vitest majors** — they're pinned for Node 18.
- The `workdays` calendar excludes weekends only — holidays are not supported.
- **Strict TS**: unused imports/variables fail the build.
- Do not change the exact-sum allocation property (see divergence note in `timeline_math.md`).
- **Branch Management**: Before adding any features or fix bugs, always work on a new git branch. Never commit directly on main. Bug branchs must follow naming convention bug/[desc]. feature branchs follow naming convention feature/[dess].

## 6. Additional Documentation

- `.claude/docs/architecture.md` — system shape, module map, component tree, data flow, print/dark-mode wiring
- `.claude/docs/data_model.md` — `Goal` / `Subtask` / `AppState` field tables and invariants
- `.claude/docs/state_management.md` — state location, persistence, action callbacks, theme
- `.claude/docs/date_logic.md` — date string conventions, workday math, hours→days conversion
- `.claude/docs/timeline_math.md` — weight allocation, chaining, overrides, warnings, test coverage