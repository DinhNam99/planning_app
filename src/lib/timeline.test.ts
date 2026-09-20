import { describe, expect, it } from "vitest";
import type { Goal, Subtask } from "../types";
import { allocateUnits, computeTimeline, goalTotalUnits, goalWarnings } from "./timeline";

function baseGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "g1",
    title: "Test goal",
    startDate: "2026-09-21", // a Monday
    durationMode: "days",
    duration: 10,
    hoursPerDay: 8,
    calendarKind: "workdays",
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

function subtask(overrides: Partial<Subtask> = {}): Subtask {
  return {
    id: "s" + Math.random().toString(36).slice(2),
    goalId: "g1",
    title: "Task",
    weight: 1,
    placement: "sequential",
    done: false,
    links: [],
    notes: "",
    orderIndex: 0,
    ...overrides,
  };
}

describe("allocateUnits", () => {
  it("allocates largest remainder and sums exactly", () => {
    expect(allocateUnits([7.5, 2.5], 10)).toEqual([8, 2]);
    const shares = allocateUnits([1.5, 3.5, 5], 10);
    expect(shares).toEqual([2, 3, 5]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(10);
  });

  it("guarantees at least 1 unit per positive share", () => {
    // total 1 day, two subtasks → both must get at least a day (plan overruns)
    const result = allocateUnits([0.5, 0.5], 1);
    expect(result[0]).toBeGreaterThanOrEqual(1);
    expect(result[1]).toBeGreaterThanOrEqual(1);
  });
});

describe("goalTotalUnits", () => {
  it("converts hours to day units using hoursPerDay", () => {
    const g = baseGoal({ durationMode: "hours", duration: 40, hoursPerDay: 8 });
    expect(goalTotalUnits(g)).toBe(5);
  });

  it("uses raw days in days mode", () => {
    expect(goalTotalUnits(baseGoal({ duration: 10 }))).toBe(10);
  });
});

describe("computeTimeline — sequential allocation, 10 working days", () => {
  const goal = baseGoal();
  const t1 = subtask({ title: "Heavy", weight: 3, orderIndex: 0 });
  const t2 = subtask({ title: "Light", weight: 1, orderIndex: 1 });
  const t3 = subtask({ title: "QA", weight: 2, placement: "parallel", orderIndex: 2 });

  const tl = computeTimeline(goal, [t1, t2, t3]);

  it("splits weight 3:1 into 8:2 working days", () => {
    const seq = tl.subtasks.filter((e) => e.subtask.placement === "sequential");
    expect(seq[0].units).toBe(8);
    expect(seq[1].units).toBe(2);
  });

  it("chains sequential dates: Sep 21–30 then Oct 1–2", () => {
    expect(tl.subtasks[0].effective.start).toBe("2026-09-21");
    expect(tl.subtasks[0].effective.end).toBe("2026-09-30");
    expect(tl.subtasks[1].effective.start).toBe("2026-10-01");
    expect(tl.subtasks[1].effective.end).toBe("2026-10-02");
  });

  it("places parallel subtasks across the full goal span", () => {
    const p = tl.subtasks.find((e) => e.subtask.placement === "parallel");
    expect(p?.effective.start).toBe("2026-09-21");
    expect(p?.effective.end).toBe("2026-10-02");
    expect(p?.units).toBe(10);
  });

  it("sets goalEnd to the end of the chain", () => {
    expect(tl.goalEnd).toBe("2026-10-02");
  });

  it("computes weight-weighted progress", () => {
    const done = subtask({ id: "sd", title: "done", weight: 3, done: true, orderIndex: 0 });
    const notDone = subtask({ id: "sn", title: "todo", weight: 1, orderIndex: 1 });
    expect(computeTimeline(goal, [done, notDone]).progress).toBeCloseTo(0.75);
  });
});

describe("computeTimeline — calendar days", () => {
  it("spans calendar days without skipping weekends", () => {
    const goal = baseGoal({ calendarKind: "calendar", duration: 10 });
    const t1 = subtask({ weight: 1, orderIndex: 0 });
    const tl = computeTimeline(goal, [t1]);
    // Mon Sep 21 + 9 calendar days = Wed Sep 30
    expect(tl.goalEnd).toBe("2026-09-30");
    expect(tl.subtasks[0].effective.start).toBe("2026-09-21");
    expect(tl.subtasks[0].effective.end).toBe("2026-09-30");
  });
});

describe("computeTimeline — parallel only", () => {
  it("derives goal end from total units when there are no sequential tasks", () => {
    const goal = baseGoal({ calendarKind: "workdays", duration: 5 });
    const p = subtask({ placement: "parallel", orderIndex: 0 });
    const tl = computeTimeline(goal, [p]);
    expect(tl.goalStart).toBe("2026-09-21");
    expect(tl.goalEnd).toBe("2026-09-25"); // Mon–Fri
    expect(tl.subtasks[0].effective.start).toBe("2026-09-21");
    expect(tl.subtasks[0].effective.end).toBe("2026-09-25");
  });
});

describe("computeTimeline — overrides", () => {
  it("applies overrides and clamps them inside the goal span", () => {
    const goal = baseGoal();
    const t1 = subtask({ weight: 1, orderIndex: 0, startOverride: "2026-09-22", endOverride: "2026-09-24" });
    const tl = computeTimeline(goal, [t1]);
    expect(tl.subtasks[0].effective.start).toBe("2026-09-22");
    expect(tl.subtasks[0].effective.end).toBe("2026-09-24");
  });

  it("clamps override outside the goal span", () => {
    const goal = baseGoal({ duration: 5 }); // Mon Sep 21 → Fri Sep 25
    const t1 = subtask({ weight: 1, orderIndex: 0, startOverride: "2026-09-10", endOverride: "2026-10-20" });
    const tl = computeTimeline(goal, [t1]);
    expect(tl.subtasks[0].effective.start).toBe("2026-09-21");
    expect(tl.subtasks[0].effective.end).toBe("2026-09-25");
  });
});

describe("goalWarnings", () => {
  it("warns when the goal is shorter than the number of sequential subtasks", () => {
    const goal = baseGoal({ durationMode: "days", duration: 2 });
    const tasks = [
      subtask({ orderIndex: 0 }),
      subtask({ orderIndex: 1 }),
      subtask({ orderIndex: 2 }),
    ];
    expect(goalWarnings(goal, tasks).length).toBeGreaterThan(0);
  });

  it("returns no warnings for a healthy goal", () => {
    const goal = baseGoal();
    const tasks = [subtask({ orderIndex: 0 }), subtask({ orderIndex: 1 })];
    expect(goalWarnings(goal, tasks)).toEqual([]);
  });
});