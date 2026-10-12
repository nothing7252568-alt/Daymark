import { describe, expect, it } from "vitest";
import { addDays, isDueOn, localDateKey, startOfWeek } from "../lib/habits/dates";
import { completionRateThisWeek, getStreakSummary, getTodayProgressSummary, isCompleteForCurrentPeriod, isHabitDueOnDate, isHabitDueToday } from "../lib/habits/streaks";
import type { Habit } from "../lib/habits/types";

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    name: "Read",
    frequency: "daily",
    startDate: "2026-10-01",
    notes: "",
    reminderEnabled: false,
    reminderTime: "20:00",
    status: "active",
    completedDates: [],
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("local habit calendar logic", () => {
  it("uses local calendar keys and starts weeks on Monday by default", () => {
    expect(localDateKey(new Date(2026, 9, 12, 11))).toBe("2026-10-12");
    expect(startOfWeek("2026-10-14")).toBe("2026-10-12");
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
  });

  it("skips weekends for a weekday habit", () => {
    expect(isDueOn("weekdays", "2026-10-12")).toBe(true);
    expect(isDueOn("weekdays", "2026-10-17")).toBe(false);
  });

  it("keeps an unfinished daily streak alive during today and resets after a missed due day", () => {
    const steady = habit({ completedDates: ["2026-10-10", "2026-10-11"] });
    expect(getStreakSummary(steady, "2026-10-12").current).toBe(2);
    const broken = habit({ completedDates: ["2026-10-10"] });
    expect(getStreakSummary(broken, "2026-10-12").current).toBe(0);
  });

  it("counts consecutive complete three-per-week goals as weekly streaks", () => {
    const weekly = habit({ frequency: "threePerWeek", startDate: "2026-09-28", completedDates: ["2026-09-28", "2026-09-30", "2026-10-02", "2026-10-05", "2026-10-07", "2026-10-09"] });
    expect(getStreakSummary(weekly, "2026-10-10").current).toBe(2);
    expect(getStreakSummary(weekly, "2026-10-10").best).toBe(2);
  });

  it("keeps the prior weekly streak intact through Sunday until the next week starts", () => {
    const weekly = habit({ frequency: "threePerWeek", startDate: "2026-09-28", completedDates: ["2026-10-05", "2026-10-07", "2026-10-09"] });
    expect(getStreakSummary(weekly, "2026-10-11").current).toBe(1);
    expect(getStreakSummary(weekly, "2026-10-12").current).toBe(1);
  });

  it("counts a three-per-week goal as three weekly check-ins and reports remaining actions", () => {
    const weekly = habit({ frequency: "threePerWeek", startDate: "2026-10-12", completedDates: ["2026-10-12"] });
    const summary = getTodayProgressSummary([weekly], "2026-10-14");
    expect(summary.totalSteps).toBe(3);
    expect(summary.completedSteps).toBe(1);
    expect(summary.remainingSteps).toBe(2);
    expect(summary.dueHabits).toHaveLength(1);
  });

  it("counts a three-per-week goal complete after three distinct check-ins and removes its open task", () => {
    const weekly = habit({ frequency: "threePerWeek", startDate: "2026-10-12", completedDates: ["2026-10-12", "2026-10-14", "2026-10-16"] });
    expect(isCompleteForCurrentPeriod(weekly, "2026-10-17")).toBe(true);
    expect(isHabitDueToday(weekly, "2026-10-17")).toBe(false);
    expect(isHabitDueOnDate(weekly, "2026-10-16")).toBe(true);
    expect(isHabitDueOnDate(weekly, "2026-10-17")).toBe(false);
    const summary = getTodayProgressSummary([weekly], "2026-10-17");
    expect(summary.totalSteps).toBe(3);
    expect(summary.completedSteps).toBe(3);
    expect(summary.remainingSteps).toBe(0);
    expect(summary.dueHabits).toHaveLength(0);
  });

  it("keeps an unfulfilled three-per-week target as an open habit", () => {
    const weekly = habit({ frequency: "threePerWeek", startDate: "2026-10-12", completedDates: ["2026-10-12", "2026-10-14"] });
    expect(isCompleteForCurrentPeriod(weekly, "2026-10-16")).toBe(false);
    expect(isHabitDueToday(weekly, "2026-10-16")).toBe(true);
  });

  it("returns zero for an empty progress week", () => {
    expect(completionRateThisWeek([habit()], "2026-10-12")).toBe(0);
  });
});
