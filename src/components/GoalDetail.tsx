import { useMemo } from "react";
import type { Goal, Subtask } from "../types";
import { computeTimeline, goalWarnings } from "../lib/timeline";
import { formatDisplay } from "../lib/dates";
import { downloadGoalJson } from "../lib/export";
import { ProgressBar } from "./ProgressBar";
import { OverviewStrip } from "./OverviewStrip";
import { SubtaskCard } from "./SubtaskCard";
import { Icons } from "./icons";

interface Props {
  goal: Goal;
  subtasks: Subtask[];
  onBack: () => void;
  onUpdateGoal: (id: string, patch: Partial<Goal>) => void;
  onDeleteGoal: (id: string) => void;
  onAddSubtask: (goalId: string) => void;
  onUpdateSubtask: (id: string, patch: Partial<Subtask>) => void;
  onDeleteSubtask: (id: string) => void;
  onMoveSubtask: (id: string, dir: -1 | 1) => void;
}

const inputClass =
  "rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

const labelClass =
  "mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400";

export function GoalDetail({
  goal,
  subtasks,
  onBack,
  onUpdateGoal,
  onDeleteGoal,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onMoveSubtask,
}: Props) {
  const timeline = useMemo(
    () => computeTimeline(goal, subtasks),
    [goal, subtasks]
  );
  const warnings = useMemo(() => goalWarnings(goal, subtasks), [goal, subtasks]);

  const patch = (p: Partial<Goal>) => onUpdateGoal(goal.id, p);
  const durationValue =
    goal.durationMode === "days"
      ? String(goal.duration)
      : String(Math.round(goal.duration * 10) / 10);

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 print:hidden"
      >
        <Icons.ArrowLeft /> All goals
      </button>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 print-card print:break-inside-avoid">
        {/* Goal fields */}
        <div>
          <input
            value={goal.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="Goal title"
            className="w-full rounded border border-transparent bg-transparent px-0 py-0 text-xl font-semibold outline-none placeholder:text-slate-400 focus:border-slate-300 dark:focus:border-slate-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="text-xs">
            <span className={labelClass}>Start date</span>
            <input
              type="date"
              value={goal.startDate}
              onChange={(e) => e.target.value && patch({ startDate: e.target.value })}
              className={`${inputClass} w-full`}
            />
          </label>
          <label className="text-xs">
            <span className={labelClass}>Duration</span>
            <input
              type="number"
              min={1}
              step={goal.durationMode === "hours" ? 0.5 : 1}
              value={durationValue}
              onChange={(e) =>
                patch({
                  duration: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              className={`${inputClass} w-full`}
            />
          </label>
          <label className="text-xs">
            <span className={labelClass}>Unit</span>
            <select
              value={goal.durationMode}
              onChange={(e) =>
                patch({ durationMode: e.target.value as Goal["durationMode"] })
              }
              className={`${inputClass} w-full`}
            >
              <option value="days">Days</option>
              <option value="hours">Hours</option>
            </select>
          </label>
          {goal.durationMode === "hours" ? (
            <label className="text-xs">
              <span className={labelClass}>Hours / day</span>
              <input
                type="number"
                min={1}
                value={goal.hoursPerDay}
                onChange={(e) =>
                  patch({ hoursPerDay: Math.max(1, parseFloat(e.target.value) || 1) })
                }
                className={`${inputClass} w-full`}
              />
            </label>
          ) : (
            <div className="text-xs">
              <span className={labelClass}>Calendar</span>
              <div className="flex gap-1.5">
                {(
                  [
                    { v: "calendar", label: "All days" },
                    { v: "workdays", label: "Weekdays" },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => patch({ calendarKind: o.v })}
                    className={`rounded px-2 py-1.5 text-xs font-medium ${
                      goal.calendarKind === o.v
                        ? "bg-indigo-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats + progress */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {timeline.unitsDescription}
          </span>
          <span>·</span>
          <span>
            {formatDisplay(timeline.goalStart)} → {formatDisplay(timeline.goalEnd)}
          </span>
          <span>·</span>
          <span>{Math.round(timeline.progress * 100)}% complete</span>
        </div>
        <ProgressBar value={timeline.progress} />

        <OverviewStrip timeline={timeline} />

        {warnings.length > 0 && (
          <ul className="space-y-1 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
            {warnings.map((w, i) => (
              <li key={i}>⚠ {w}</li>
            ))}
          </ul>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800 print:hidden">
          <button
            type="button"
            onClick={() => downloadGoalJson(goal, subtasks)}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Icons.Download /> Export JSON
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Icons.Printer /> Print / PDF
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Delete "${goal.title}" and all its subtasks?`)) {
                onDeleteGoal(goal.id);
              }
            }}
            className="ml-auto flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          >
            <Icons.Trash /> Delete goal
          </button>
        </div>
      </section>

      {/* Subtasks */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">
            Subtasks <span className="text-sm font-normal text-slate-500">({subtasks.length})</span>
          </h3>
          <button
            type="button"
            onClick={() => onAddSubtask(goal.id)}
            className="flex items-center gap-1.5 rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-600 print:hidden"
          >
            <Icons.Plus /> Add subtask
          </button>
        </div>

        {subtasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No subtasks yet. Add one — the timeline updates automatically.
          </p>
        ) : (
          <div className="space-y-3">
            {subtasks.map((st, i) => {
              const entry = timeline.subtasks.find((e) => e.subtask.id === st.id);
              if (!entry) return null;
              return (
                <SubtaskCard
                  key={st.id}
                  index={i}
                  total={subtasks.length}
                  entry={entry}
                  onPatch={(p) => onUpdateSubtask(st.id, p)}
                  onDelete={() => onDeleteSubtask(st.id)}
                  onMove={(dir) => onMoveSubtask(st.id, dir)}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}