import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_SETTINGS, EMPTY_APP_STATE, type Habit, type PersistedAppState } from "./types";

const STORAGE_KEY = "@daymark/state-v1";

function isHabit(value: unknown): value is Habit {
  if (!value || typeof value !== "object") return false;
  const habit = value as Partial<Habit>;
  return (
    typeof habit.id === "string" &&
    typeof habit.name === "string" &&
    ["daily", "weekdays", "threePerWeek"].includes(String(habit.frequency)) &&
    typeof habit.startDate === "string" &&
    ["active", "paused", "archived"].includes(String(habit.status)) &&
    Array.isArray(habit.completedDates)
  );
}

export function validatePersistedState(raw: unknown): PersistedAppState {
  if (!raw || typeof raw !== "object") throw new Error("Saved data is not in a readable format.");
  const input = raw as Partial<PersistedAppState>;
  if (input.version !== 1 || !Array.isArray(input.habits) || !input.habits.every(isHabit)) {
    throw new Error("Saved data could not be safely opened. Your original data has been left untouched.");
  }
  const settings = input.settings && typeof input.settings === "object" ? input.settings : DEFAULT_SETTINGS;
  return {
    version: 1,
    onboardingComplete: input.onboardingComplete === true,
    habits: input.habits.map((habit) => ({
      ...habit,
      notes: habit.notes ?? "",
      reminderEnabled: habit.reminderEnabled === true,
      reminderTime: habit.reminderTime ?? "20:00",
      completedDates: [...new Set(habit.completedDates)],
      createdAt: habit.createdAt ?? new Date().toISOString(),
      updatedAt: habit.updatedAt ?? new Date().toISOString(),
    })),
    settings: {
      hapticsEnabled: settings.hapticsEnabled !== false,
      reducedMotion: settings.reducedMotion === true,
      weekStartsOnMonday: settings.weekStartsOnMonday !== false,
      remindersEnabled: settings.remindersEnabled !== false,
    },
  };
}

export async function readAppState(): Promise<PersistedAppState> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  if (!value) return EMPTY_APP_STATE;
  try {
    return validatePersistedState(JSON.parse(value));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Saved data appears incomplete. Your original data was left untouched.");
    }
    throw error;
  }
}

export async function writeAppState(state: PersistedAppState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearAppState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
