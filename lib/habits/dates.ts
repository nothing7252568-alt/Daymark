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
