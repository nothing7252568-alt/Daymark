import { addDays, dateFromKey, isDueOn, localDateKey, startOfWeek } from "./dates";
import type { Habit } from "./types";

export interface StreakSummary {
  current: number;
  best: number;
  unit: "day" | "week";
  completedThisWeek: number;
  goalThisWeek: number;
}
export interface StreakMetric { count: number; unit: "day" | "week" }
export interface TodayProgressSummary { dueHabits: Habit[]; totalSteps: number; completedSteps: number; remainingSteps: number }

function uniqueCompleted(habit: Habit, today: string): Set<string> {
  return new Set(habit.completedDates.filter((key) => key >= habit.startDate && key <= today));
}

export function completedInWeek(habit: Habit, today = localDateKey(), weekStartsOnMonday = true): number {
  const start = startOfWeek(today, weekStartsOnMonday);
  return new Set(habit.completedDates.filter((key) => key >= start && key <= today && key >= habit.startDate)).size;
}

export function isCompleteForCurrentPeriod(habit: Habit, today = localDateKey(), weekStartsOnMonday = true): boolean {
  return habit.frequency === "threePerWeek"
    ? completedInWeek(habit, today, weekStartsOnMonday) >= 3
    : habit.completedDates.includes(today);
}

/** Was this habit a legitimate open opportunity on this calendar date? */
export function isHabitDueOnDate(habit: Habit, date: string, weekStartsOnMonday = true): boolean {
  if (habit.status !== "active" || habit.startDate > date) return false;
  if (habit.frequency !== "threePerWeek") return isDueOn(habit.frequency, date, weekStartsOnMonday);
  const start = startOfWeek(date, weekStartsOnMonday);
  const completedBeforeDate = new Set(habit.completedDates.filter((key) => key >= start && key < date && key >= habit.startDate)).size;
  return completedBeforeDate < 3;
}

export function isHabitDueToday(habit: Habit, today = localDateKey(), weekStartsOnMonday = true): boolean {
  if (habit.frequency === "threePerWeek" && isCompleteForCurrentPeriod(habit, today, weekStartsOnMonday)) return false;
  return isHabitDueOnDate(habit, today, weekStartsOnMonday);
}

export function getTodayProgressSummary(habits: Habit[], today = localDateKey(), weekStartsOnMonday = true): TodayProgressSummary {
  const active = habits.filter((habit) => habit.status === "active" && habit.startDate <= today);
  const dueHabits = active.filter((habit) => isHabitDueToday(habit, today, weekStartsOnMonday));
  let totalSteps = 0;
  let completedSteps = 0;
  for (const habit of active) {
    if (habit.frequency === "threePerWeek") {
      totalSteps += 3;
      completedSteps += Math.min(3, completedInWeek(habit, today, weekStartsOnMonday));
    } else if (isDueOn(habit.frequency, today, weekStartsOnMonday)) {
      totalSteps += 1;
      if (habit.completedDates.includes(today)) completedSteps += 1;
    }
  }
  return { dueHabits, totalSteps, completedSteps, remainingSteps: Math.max(0, totalSteps - completedSteps) };
}

export function getStreakSummary(
  habit: Habit,
  today = localDateKey(),
  weekStartsOnMonday = true,
): StreakSummary {
  const completed = uniqueCompleted(habit, today);
  const currentWeekStart = startOfWeek(today, weekStartsOnMonday);
  const thisWeekDates = Array.from({ length: 7 }, (_, index) => addDays(currentWeekStart, index));
  const completedThisWeek = thisWeekDates.filter((key) => key <= today && completed.has(key)).length;

  if (habit.frequency === "threePerWeek") {
    const weekCount = (weekStart: string) =>
      Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)).filter(
        (key) => key >= habit.startDate && key <= today && completed.has(key),
      ).length;
    let current = 0;
    let cursor = currentWeekStart;
    // Date-only streaks cannot know when Sunday has ended, so an incomplete week remains open until next week.
    if (weekCount(cursor) < 3) cursor = addDays(cursor, -7);
    while (cursor >= startOfWeek(habit.startDate, weekStartsOnMonday) && weekCount(cursor) >= 3) {
      current += 1;
      cursor = addDays(cursor, -7);
    }
    let best = 0;
    let run = 0;
    const firstWeek = startOfWeek(habit.startDate, weekStartsOnMonday);
    for (let week = firstWeek; week <= currentWeekStart; week = addDays(week, 7)) {
      if (weekCount(week) >= 3) {
        run += 1;
        best = Math.max(best, run);
      } else {
        run = 0;
      }
    }
    return { current, best, unit: "week", completedThisWeek, goalThisWeek: 3 };
  }

  let anchor = completed.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (anchor >= habit.startDate) {
    if (!isDueOn(habit.frequency, anchor, weekStartsOnMonday)) {
      anchor = addDays(anchor, -1);
      continue;
    }
    if (!completed.has(anchor)) break;
    current += 1;
    anchor = addDays(anchor, -1);
  }

  let best = 0;
  let run = 0;
  for (let key = habit.startDate; key <= today; key = addDays(key, 1)) {
    if (!isDueOn(habit.frequency, key, weekStartsOnMonday)) continue;
    if (completed.has(key)) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return { current, best, unit: "day", completedThisWeek, goalThisWeek: 5 };
}

export function strongestStreak(habits: Habit[], today = localDateKey(), weekStartsOnMonday = true, metric: "current" | "best" = "current"): StreakMetric {
  return habits.reduce<StreakMetric>((strongest, habit) => {
    const summary = getStreakSummary(habit, today, weekStartsOnMonday);
    const candidate: StreakMetric = { count: summary[metric], unit: summary.unit };
    const weight = (value: StreakMetric) => value.count * (value.unit === "week" ? 7 : 1);
    return weight(candidate) > weight(strongest) ? candidate : strongest;
  }, { count: 0, unit: "day" });
}

export function isCheckedInToday(habit: Habit, today = localDateKey()): boolean {
  return habit.completedDates.includes(today);
}

export function completionRateThisWeek(
  habits: Habit[],
  today = localDateKey(),
  weekStartsOnMonday = true,
): number {
  let due = 0;
  let completed = 0;
  const weekStart = startOfWeek(today, weekStartsOnMonday);
  const end = dateFromKey(today);
  const lastKey = localDateKey(end);
  for (const habit of habits) {
    if (habit.status !== "active") continue;
    for (let key = weekStart; key <= lastKey; key = addDays(key, 1)) {
      if (key < habit.startDate || !isDueOn(habit.frequency, key, weekStartsOnMonday)) continue;
      if (habit.frequency === "threePerWeek") continue;
      due += 1;
      if (habit.completedDates.includes(key)) completed += 1;
    }
    if (habit.frequency === "threePerWeek") {
      due += 3;
      completed += Math.min(
        3,
        habit.completedDates.filter((key) => key >= weekStart && key <= lastKey && key >= habit.startDate).length,
      );
    }
  }
  return due === 0 ? 0 : Math.round((completed / due) * 100);
}
