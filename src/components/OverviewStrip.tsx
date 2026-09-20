import type { ComputedTimeline } from "../lib/timeline";
import { formatDisplay } from "../lib/dates";
import { SEGMENT_COLORS } from "../lib/palette";

export function OverviewStrip({ timeline }: { timeline: ComputedTimeline }) {
  const seq = timeline.subtasks.filter((e) => e.subtask.placement === "sequential");
  const par = timeline.subtasks.filter((e) => e.subtask.placement === "parallel");
  const seqUnits = seq.reduce((a, e) => a + e.units, 0);

  return (
    <div className="space-y-1.5">
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        {seq.map((e, i) => (
          <div
            key={e.subtask.id}
            title={`${e.subtask.title}: ${formatDisplay(e.effective.start)} – ${formatDisplay(e.effective.end)}`}
            className={`h-full ${SEGMENT_COLORS[i % SEGMENT_COLORS.length]}`}
            style={{ width: `${(e.units / Math.max(1, seqUnits)) * 100}%` }}
          />
        ))}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {formatDisplay(timeline.goalStart)} → {formatDisplay(timeline.goalEnd)}
        {par.length > 0 && ` · ${par.length} parallel subtask${par.length === 1 ? "" : "s"} span the full goal`}
      </p>
    </div>
  );
}