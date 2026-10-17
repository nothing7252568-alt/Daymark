import type { HabitFrequency } from "./types";

const pad = (value: number) => String(value).padStart(2, "0");

export function localDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dateFromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 12, 0, 0, 0);
}

export function addDays(key: string, amount: number): string {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + amount);
  return localDateKey(date);
}

export const FUTURE_REMINDER_WINDOW_DAYS = 7;

export function getReminderDatesInWindow(
  startDate: string,
  frequency: HabitFrequency,
  windowDays = FUTURE_REMINDER_WINDOW_DAYS,
): string[] {
  if (!isValidDateKey(startDate) || !Number.isInteger(windowDays) || windowDays < 1) return [];
  const reminderDays = frequency === "weekdays" ? new Set([1, 2, 3, 4, 5])
    : frequency === "threePerWeek" ? new Set([1, 3, 5])
      : null;
  return Array.from({ length: windowDays }, (_, offset) => addDays(startDate, offset))
    .filter((key) => reminderDays === null || reminderDays.has(dateFromKey(key).getDay()));
}

export function startOfWeek(key: string, weekStartsOnMonday = true): string {
  const date = dateFromKey(key);
  const offset = weekStartsOnMonday ? (date.getDay() + 6) % 7 : date.getDay();
  date.setDate(date.getDate() - offset);
  return localDateKey(date);
}

export function formatToday(date: Date = new Date()): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(date);
}

export function formatShortDate(key: string): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(dateFromKey(key));
}

export function isDueOn(frequency: HabitFrequency, key: string, weekStartsOnMonday = true): boolean {
  if (frequency === "daily" || frequency === "threePerWeek") return true;
  const day = dateFromKey(key).getDay();
  return day !== 0 && day !== 6;
}

export function datesInWeek(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return localDateKey(dateFromKey(value)) === value;
}
