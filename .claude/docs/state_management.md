# State management

No Redux / Zustand / Context. All state is plain `useState` inside `App.tsx`, passed down as props.

## State in `App.tsx`

1. `state: AppState` — domain data (`goals`, `subtasks`).
2. `selectedId: string | null` — navigation (null = goal list).
3. `theme: "light" | "dark" | null` — UI preference, not domain state (`null` = follow system).

## Persistence (automatic)

```ts
useEffect(() => { saveState(state); }, [state]);
```

- Runs after every state change; writes `localStorage["goal-planner:v1"]`. No debounce needed (small payload).
- `saveState` swallows quota/availability errors — do not surface them.
- Initial state: `loadState() ?? createSampleState()`. `loadState` returns `null` on parse failure or if `goals`/`subtasks` aren't arrays, which falls back to seed data.

### Storage envelope

```json
{ "goals": Goal[], "subtasks": Subtask[] }
```
No version field. If the persisted shape changes incompatibly, **bump the key** (`goal-planner:v1` → `goal-planner:v2`) instead of writing a migration.

## Actions (all in `App.tsx`, all immutable)

| Action | Behavior |
|---|---|
| `updateGoal(id, patch)` | Merges patch, stamps `updatedAt = new Date().toISOString()` |
| `createGoal()` | New goal: 7 days, calendar kind, start = today; selects it |
| `deleteGoal(id)` | Removes the goal **and its subtasks**; navigates home if it was open |
| `addSubtask(goalId)` | `orderIndex = max + 1`; defaults: weight 1, sequential |
| `updateSubtask(id, patch)` | Generic merge — used for title, weight, placement, done, notes, links, overrides |
| `deleteSubtask(id)` | Filters out by id |
| `moveSubtask(id, dir)` | Swaps `orderIndex` with the neighbor in `goalId`-scoped, order-sorted list |

`SubtaskCard` receives a bound `onPatch: (p) => updateSubtask(st.id, p)` — cards stay dumb.

## Theme state

- `ThemeToggle` renders System / Light / Dark (active = current value).
- Effect resolves `dark = theme === "dark" || (theme === null && prefers-color-scheme: dark)`, toggles the `dark` class on `document.documentElement`, and persists explicit choices to `gp-theme`.
- `index.html` has an inline script applying the same resolution pre-paint to prevent a flash.

## Conventions

- Never store computed dates or `ComputedTimeline` in state — always re-derive (see `timeline_math.md`).
- IDs come from `uid()` (`crypto.randomUUID`, with fallback).
- Destructive actions confirm via `window.confirm`.