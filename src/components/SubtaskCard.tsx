import { useState } from "react";
import type { Subtask } from "../types";
import type { ComputedSubtask } from "../lib/timeline";
import { formatDisplay } from "../lib/dates";
import { BORDER_COLORS } from "../lib/palette";
import { Icons } from "./icons";
import { LinksEditor } from "./LinksEditor";

interface Props {
  index: number;
  total: number;
  entry: ComputedSubtask;
  onPatch: (patch: Partial<Subtask>) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}

const inputClass =
  "rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

const labelClass =
  "text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400";

export function SubtaskCard({ index, total, entry, onPatch, onDelete, onMove }: Props) {
  const [open, setOpen] = useState(false);
  const st = entry.subtask;
  const unit = entry.units === 1 ? "day" : "days";

  return (
    <div
      className={`rounded-lg border border-l-4 bg-white shadow-sm dark:bg-slate-900 print-card print:break-inside-avoid ${
        BORDER_COLORS[index % BORDER_COLORS.length]
      } border-slate-200 dark:border-slate-800`}
    >
      <div className="flex items-center gap-2 p-3">
        <input
          type="checkbox"
          checked={st.done}
          onChange={(e) => onPatch({ done: e.target.checked })}
          className="h-4 w-4 shrink-0 accent-indigo-500"
          aria-label={`Mark "${st.title}" done`}
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={open}
        >
          <span className="shrink-0 text-slate-400 dark:text-slate-500">
            {open ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
          </span>
          <span
            className={`truncate font-medium ${
              st.done ? "text-slate-400 line-through dark:text-slate-500" : ""
            }`}
          >
            {st.title.trim() || "Untitled"}
          </span>
        </button>
        <input
          type="number"
          min={1}
          value={st.weight}
          onChange={(e) => onPatch({ weight: Math.max(1, parseInt(e.target.value || "1", 10) || 1) })}
          className={`${inputClass} w-16 text-center`}
          title="Weight (time share)"
          aria-label="Weight"
        />
        <select
          value={st.placement}
          onChange={(e) => onPatch({ placement: e.target.value as Subtask["placement"] })}
          className={`${inputClass} print:hidden`}
          aria-label="Placement"
          title="Sequential = runs in order; Parallel = spans the whole goal"
        >
          <option value="sequential">Sequential</option>
          <option value="parallel">Parallel</option>
        </select>
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 p-1 text-slate-400 hover:text-red-500 print:hidden"
          aria-label="Delete subtask"
        >
          <Icons.Trash />
        </button>
      </div>

      <div className="flex items-center gap-3 px-3 pb-3 text-xs text-slate-500 dark:text-slate-400">
        <span>
          {formatDisplay(entry.effective.start)} → {formatDisplay(entry.effective.end)} ·{" "}
          {entry.units} {unit}
        </span>
        <span className="hidden text-slate-400 sm:inline dark:text-slate-500">
          {st.placement === "parallel" ? "parallel" : `weight ${st.weight}`}
        </span>
        <div className="ml-auto flex gap-1 print:hidden">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 dark:hover:text-slate-200"
            aria-label="Move up"
          >
            <Icons.ArrowUp />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 dark:hover:text-slate-200"
            aria-label="Move down"
          >
            <Icons.ArrowDown />
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-3 border-t border-slate-100 p-3 dark:border-slate-800 print:border-slate-300">
          <div className="space-y-1">
            <span className={labelClass}>Notes</span>
            <textarea
              value={st.notes}
              onChange={(e) => onPatch({ notes: e.target.value })}
              rows={2}
              placeholder="Add notes…"
              className={`${inputClass} w-full`}
            />
          </div>

          <LinksEditor links={st.links} onChange={(links) => onPatch({ links })} />

          {st.placement === "sequential" && (
            <div className="grid grid-cols-2 gap-2 print:hidden">
              <label className="space-y-1 text-xs">
                <span className={labelClass}>Start override (optional)</span>
                <input
                  type="date"
                  value={st.startOverride ?? ""}
                  onChange={(e) => onPatch({ startOverride: e.target.value || undefined })}
                  className={`${inputClass} w-full`}
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className={labelClass}>End override (optional)</span>
                <input
                  type="date"
                  value={st.endOverride ?? ""}
                  onChange={(e) => onPatch({ endOverride: e.target.value || undefined })}
                  className={`${inputClass} w-full`}
                />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}