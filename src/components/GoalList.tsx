import { useMemo } from "react";
import type { Goal, Subtask } from "../types";
import { computeTimeline } from "../lib/timeline";
import { formatDisplay } from "../lib/dates";
import { ProgressBar } from "./ProgressBar";
import { Icons } from "./icons";

interface Props {
  goals: Goal[];
  subtasks: Subtask[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

interface CardProps {
  goal: Goal;
  subtasks: Subtask[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

function GoalCard({ goal, subtasks, onOpen, onDelete }: CardProps) {
  const tl = useMemo(() => computeTimeline(goal, subtasks), [goal, subtasks]);
  const doneCount = subtasks.filter((s) => s.done).length;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 print-card">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onOpen(goal.id)}
          className="min-w-0 flex-1 text-left"
        >
          <h3 className="truncate text-lg font-semibold">{goal.title}</h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {tl.unitsDescription} · {formatDisplay(tl.goalStart)} →{" "}
            {formatDisplay(tl.goalEnd)}
          </p>
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Delete "${goal.title}" and all its subtasks?`)) {
              onDelete(goal.id);
            }
          }}
          className="shrink-0 p-1 text-slate-400 hover:text-red-500 print:hidden"
          aria-label="Delete goal"
        >
          <Icons.Trash />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <ProgressBar value={tl.progress} className="flex-1" />
        <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
          {doneCount}/{subtasks.length} done · {Math.round(tl.progress * 100)}%
        </span>
      </div>
    </div>
  );
}

export function GoalList({ goals, subtasks, onOpen, onCreate, onDelete }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Your goals</h2>
        <button
          type="button"
          onClick={onCreate}
          className="flex items-center gap-1.5 rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-600 print:hidden"
        >
          <Icons.Plus /> New goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <p className="text-lg">🎯 No goals yet</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create your first goal, add weighted subtasks, and get a timeline.
          </p>
          <button
            type="button"
            onClick={onCreate}
            className="mt-4 rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-600"
          >
            Create a goal
          </button>
        </div>
      ) : (
        goals.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            subtasks={subtasks.filter((s) => s.goalId === g.id)}
            onOpen={onOpen}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}