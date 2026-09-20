import type { Goal, Subtask } from "../types";
import { addDays, addWorkdays, countWorkdaysInclusive, daysBetween, type DateStr } from "./dates";

export interface ComputedRange {
  start: DateStr;
  end: DateStr; // inclusive
}

export interface ComputedSubtask {
  subtask: Subtask;
  /** Range from the pure scheduling algorithm (chain/parallel), ignoring overrides. */
  computed: ComputedRange;
  /** Range actually displayed: overrides applied, clamped to the goal span. */
  effective: ComputedRange;
  /** Number of units (working days or calendar days) in the effective range. */
  units: number;
}

export interface ComputedTimeline {
  goalStart: DateStr;
  goalEnd: DateStr; // inclusive
  /** Sequential chain first, then parallel tasks — each with its computed + effective range. */
  subtasks: ComputedSubtask[];
  /** Total units the goal spans (whole days). */
  totalUnits: number;
  /** Units consumed by the sequential chain. */
  seqUnits: number;
  /** Weight-weighted progress, 0..1. */
  progress: number;
  unitsDescription: string;
}

function unitWord(goal: Goal): string {
  return goal.calendarKind === "workdays" ? "working days" : "days";
}

/** Convert the goal duration into a whole number of day "units". */
export function goalTotalUnits(goal: Goal): number {
  if (goal.durationMode === "days") {
    return Math.max(1, Math.round(goal.duration));
  }
  const hpd = goal.hoursPerDay >= 1 ? goal.hoursPerDay : 8;
  return Math.max(1, Math.round(goal.duration / hpd));
}

/** Date of the last unit when consuming `units` starting from the goal start date. */
export function unitsToEnd(goal: Goal, units: number): DateStr {
  const n = Math.max(1, units);
  if (goal.calendarKind === "workdays") {
    return addWorkdays(goal.startDate, n - 1);
  }
  return addDays(goal.startDate, n - 1);
}

/** Number of units inside an inclusive range, honoring the goal's calendar kind. */
export function unitsInRange(goal: Goal, start: DateStr, end: DateStr): number {
  if (end < start) return 0;
  return goal.calendarKind === "workdays"
    ? countWorkdaysInclusive(start, end)
    : daysBetween(start, end) + 1;
}

/**
 * Convert fractional shares into whole units that sum exactly to `total`.
 * Largest-remainder method; every positive share gets at least 1 unit
 * (which can make the sum exceed `total` when the goal is shorter than the
 * number of sequential subtasks — the UI warns about that case).
 */
export function allocateUnits(shares: number[], total: number): number[] {
  const n = shares.length;
  const floors = shares.map((s) => Math.floor(s));
  let remainder = total - floors.reduce((a, b) => a + b, 0);
  const order = shares
    .map((s, i) => ({ i, frac: s - Math.floor(s) }))
    .sort((a, b) => b.frac - a.frac);
  const result = [...floors];
  let k = 0;
  while (remainder > 0) {
    result[order[k % n].i] += 1;
    remainder -= 1;
    k += 1;
  }
  // Guarantee every positive share has at least 1 unit.
  const missing: boolean[] = shares.map((s, i) => s > 0 && result[i] === 0);
  const missingCount = missing.filter(Boolean).length;
  if (missingCount > 0) {
    for (let i = 0; i < n; i++) if (missing[i]) result[i] = 1;
    let toDeduct = missingCount;
    const desc = result
      .map((v, i) => ({ i, v }))
      .filter((o) => !missing[o.i])
      .sort((a, b) => b.v - a.v);
    let j = 0;
    while (toDeduct > 0 && desc.length > 0 && j < desc.length * 4) {
      const o = desc[j % desc.length];
      if (result[o.i] > 1) {
        result[o.i] -= 1;
        toDeduct -= 1;
      }
      j += 1;
    }
  }
  return result;
}

function clampDate(d: string, lo: string, hi: string): string {
  if (d < lo) return lo;
  if (d > hi) return hi;
  return d;
}

function effectiveRange(goal: Goal, computed: ComputedRange, s: Subtask, goalEnd: DateStr): ComputedRange {
  let start = computed.start;
  let end = computed.end;
  if (s.startOverride) start = clampDate(s.startOverride, goal.startDate, goalEnd);
  if (s.endOverride) end = clampDate(s.endOverride, goal.startDate, goalEnd);
  if (end < start) end = start;
  return { start, end };
}

export function computeTimeline(goal: Goal, subtasks: Subtask[]): ComputedTimeline {
  const seq = subtasks
    .filter((s) => s.placement === "sequential")
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const par = subtasks
    .filter((s) => s.placement === "parallel")
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const totalUnits = goalTotalUnits(goal);
  const totalWeight = seq.reduce((acc, s) => acc + s.weight, 0);

  let goalEnd: DateStr;
  const seqComputed: ComputedRange[] = [];

  if (seq.length === 0) {
    goalEnd = unitsToEnd(goal, totalUnits);
  } else {
    const shares = seq.map((s) => totalUnits * (s.weight / totalWeight));
    const unitsByIndex = allocateUnits(shares, totalUnits);
    let cursor = goal.startDate;
    for (let i = 0; i < seq.length; i++) {
      const units = unitsByIndex[i];
      const end =
        goal.calendarKind === "workdays"
          ? addWorkdays(cursor, units - 1)
          : addDays(cursor, units - 1);
      seqComputed.push({ start: cursor, end });
      cursor =
        goal.calendarKind === "workdays" ? addWorkdays(end, 1) : addDays(end, 1);
    }
    goalEnd = seqComputed[seqComputed.length - 1].end;
  }

  const computedList: ComputedSubtask[] = [];

  seq.forEach((s, i) => {
    const effective = effectiveRange(goal, seqComputed[i], s, goalEnd);
    computedList.push({
      subtask: s,
      computed: seqComputed[i],
      effective,
      units: unitsInRange(goal, effective.start, effective.end),
    });
  });

  par.forEach((s) => {
    const computed: ComputedRange = { start: goal.startDate, end: goalEnd };
    const effective = effectiveRange(goal, computed, s, goalEnd);
    computedList.push({
      subtask: s,
      computed,
      effective,
      units: unitsInRange(goal, effective.start, effective.end),
    });
  });

  const seqUnits = seqComputed.reduce((a, r) => a + unitsInRange(goal, r.start, r.end), 0);

  const doneWeight = subtasks.filter((s) => s.done).reduce((a, s) => a + s.weight, 0);
  const totalWeightAll = subtasks.reduce((a, s) => a + s.weight, 0);
  const progress = totalWeightAll > 0 ? doneWeight / totalWeightAll : 0;

  const unitsDescription =
    goal.durationMode === "days"
      ? `${goal.duration} ${unitWord(goal)}`
      : `${goal.duration}h → ${totalUnits} ${unitWord(goal)} (${goal.hoursPerDay}h/day)`;

  return {
    goalStart: goal.startDate,
    goalEnd,
    subtasks: computedList,
    totalUnits,
    seqUnits,
    progress,
    unitsDescription,
  };
}

export function goalWarnings(goal: Goal, subtasks: Subtask[]): string[] {
  const warnings: string[] = [];
  const word = unitWord(goal);

  if (!goal.title.trim()) warnings.push("Goal has no title.");

  if (goal.durationMode === "days" && goal.duration < 1) {
    warnings.push("Duration must be at least 1 day.");
  }
  if (goal.durationMode === "hours" && goal.duration < 1) {
    warnings.push("Duration must be at least 1 hour.");
  }
  if (goal.durationMode === "hours" && goal.hoursPerDay < 1) {
    warnings.push("Hours per day must be at least 1.");
  }

  const seqCount = subtasks.filter((s) => s.placement === "sequential").length;
  const total = goalTotalUnits(goal);
  if (seqCount > total) {
    warnings.push(
      `${seqCount} sequential subtasks need at least ${seqCount} ${word}, but only ${total} are planned. The plan will extend past the target end date.`
    );
  }

  subtasks.forEach((s) => {
    const name = s.title.trim() || "A subtask";
    if (s.weight < 1) {
      warnings.push(`"${name}" has weight ${s.weight}; weight should be at least 1.`);
    }
    if (s.startOverride && s.endOverride && s.endOverride < s.startOverride) {
      warnings.push(`"${name}": end date is before its start date.`);
    }
  });

  return warnings;
}