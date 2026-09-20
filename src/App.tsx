import { useEffect, useMemo, useState } from "react";
import type { AppState, Goal, Subtask } from "./types";
import { loadState, saveState } from "./lib/storage";
import { createSampleState } from "./lib/sample";
import { uid, todayStr } from "./lib/utils";
import { GoalList } from "./components/GoalList";
import { GoalDetail } from "./components/GoalDetail";
import { ThemeToggle, type Theme } from "./components/ThemeToggle";

function initialTheme(): Theme {
  try {
    const t = localStorage.getItem("gp-theme");
    return t === "light" || t === "dark" ? (t as Theme) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    try {
      return loadState() ?? createSampleState();
    } catch {
      return createSampleState();
    }
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(initialTheme);

  // Persist on every change.
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Apply + remember the theme.
  useEffect(() => {
    const dark =
      theme === "dark" ||
      (theme === null &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    try {
      if (theme !== null) localStorage.setItem("gp-theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const goal = state.goals.find((g) => g.id === selectedId) ?? null;
  const subtasks = useMemo(
    () =>
      state.subtasks
        .filter((s) => s.goalId === selectedId)
        .sort((a, b) => a.orderIndex - b.orderIndex),
    [state.subtasks, selectedId]
  );

  const updateGoal = (id: string, patch: Partial<Goal>) =>
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) =>
        g.id === id ? { ...g, ...patch, updatedAt: new Date().toISOString() } : g
      ),
    }));

  const createGoal = () => {
    const now = new Date().toISOString();
    const goal: Goal = {
      id: uid(),
      title: "New goal",
      startDate: todayStr(),
      durationMode: "days",
      duration: 7,
      hoursPerDay: 8,
      calendarKind: "calendar",
      createdAt: now,
      updatedAt: now,
    };
    setState((s) => ({ ...s, goals: [...s.goals, goal] }));
    setSelectedId(goal.id);
  };

  const deleteGoal = (id: string) => {
    setState((s) => ({
      ...s,
      goals: s.goals.filter((g) => g.id !== id),
      subtasks: s.subtasks.filter((t) => t.goalId !== id),
    }));
    if (selectedId === id) setSelectedId(null);
  };

  const addSubtask = (goalId: string) => {
    setState((s) => {
      const maxOrder = s.subtasks
        .filter((t) => t.goalId === goalId)
        .reduce((m, t) => Math.max(m, t.orderIndex), -1);
      const st: Subtask = {
        id: uid(),
        goalId,
        title: "New subtask",
        weight: 1,
        placement: "sequential",
        done: false,
        links: [],
        notes: "",
        orderIndex: maxOrder + 1,
      };
      return { ...s, subtasks: [...s.subtasks, st] };
    });
  };

  const updateSubtask = (id: string, patch: Partial<Subtask>) =>
    setState((s) => ({
      ...s,
      subtasks: s.subtasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));

  const deleteSubtask = (id: string) =>
    setState((s) => ({
      ...s,
      subtasks: s.subtasks.filter((t) => t.id !== id),
    }));

  const moveSubtask = (id: string, dir: -1 | 1) =>
    setState((s) => {
      const target = s.subtasks.find((t) => t.id === id);
      if (!target) return s;
      const list = s.subtasks
        .filter((t) => t.goalId === target.goalId)
        .sort((a, b) => a.orderIndex - b.orderIndex);
      const idx = list.findIndex((t) => t.id === id);
      const swap = list[idx + dir];
      if (!swap) return s;
      const a = list[idx];
      const b = swap;
      return {
        ...s,
        subtasks: s.subtasks.map((t) =>
          t.id === a.id
            ? { ...t, orderIndex: b.orderIndex }
            : t.id === b.id
              ? { ...t, orderIndex: a.orderIndex }
              : t
        ),
      };
    });

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 print:bg-white print:text-black dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white print:hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <span aria-hidden="true">🎯</span> Goal Planner
          </button>
          <ThemeToggle value={theme} onChange={setTheme} />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        {goal ? (
          <GoalDetail
            goal={goal}
            subtasks={subtasks}
            onBack={() => setSelectedId(null)}
            onUpdateGoal={updateGoal}
            onDeleteGoal={deleteGoal}
            onAddSubtask={addSubtask}
            onUpdateSubtask={updateSubtask}
            onDeleteSubtask={deleteSubtask}
            onMoveSubtask={moveSubtask}
          />
        ) : (
          <GoalList
            goals={state.goals}
            subtasks={state.subtasks}
            onOpen={setSelectedId}
            onCreate={createGoal}
            onDelete={deleteGoal}
          />
        )}
      </main>
    </div>
  );
}