import { describe, expect, it } from "vitest";
import {
  addDays,
  addWorkdays,
  countWorkdaysInclusive,
  daysBetween,
  formatDisplay,
  isWeekend,
} from "./dates";

describe("addDays", () => {
  it("adds across month boundaries", () => {
    expect(addDays("2026-09-28", 1)).toBe("2026-09-29");
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("supports negative values", () => {
    expect(addDays("2026-09-20", -10)).toBe("2026-09-10");
  });
});

describe("isWeekend / addWorkdays", () => {
  it("detects weekends", () => {
    expect(isWeekend("2026-09-26")).toBe(true); // Saturday
    expect(isWeekend("2026-09-27")).toBe(true); // Sunday
    expect(isWeekend("2026-09-25")).toBe(false); // Friday
    expect(isWeekend("2026-09-21")).toBe(false); // Monday
  });

  it("skips weekends when adding working days", () => {
    // Friday + 1 working day = Monday
    expect(addWorkdays("2026-09-25", 1)).toBe("2026-09-28");
    // Monday + 7 working days = next Wednesday
    expect(addWorkdays("2026-09-21", 7)).toBe("2026-09-30");
    // zero is a no-op
    expect(addWorkdays("2026-09-21", 0)).toBe("2026-09-21");
  });
});

describe("daysBetween / countWorkdaysInclusive", () => {
  it("computes calendar day differences", () => {
    expect(daysBetween("2026-09-20", "2026-09-10")).toBe(-10);
    expect(daysBetween("2026-09-21", "2026-09-30")).toBe(9);
  });

  it("counts working days in an inclusive range", () => {
    // Mon Sep 21 → Wed Sep 30 contains 8 working days
    expect(countWorkdaysInclusive("2026-09-21", "2026-09-30")).toBe(8);
    // Fri → Mon = 2 working days
    expect(countWorkdaysInclusive("2026-09-25", "2026-09-28")).toBe(2);
  });
});

describe("formatDisplay", () => {
  it("formats readable dates", () => {
    expect(formatDisplay("2026-09-21")).toBe("Sep 21, 2026");
  });
});