import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_SETTINGS, EMPTY_APP_STATE, type AppSettings, type CustomReminderTone, type Habit, type PersistedAppState } from "./types";

const STORAGE_KEY = "@daymark/state-v1";
const MAX_CUSTOM_TONE_BYTES = 10 * 1024 * 1024;
const CUSTOM_TONE_MIME_TYPES = new Set(["audio/wav", "audio/mpeg", "audio/mp4", "audio/ogg"]);

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

function isCustomReminderTone(value: unknown): value is CustomReminderTone {
  if (!value || typeof value !== "object") return false;
  const tone = value as Partial<CustomReminderTone>;
  const safeNotificationUri = tone.notificationUri === undefined || (
    typeof tone.notificationUri === "string" && /^content:\/\/media\/external\/audio\/media\/\d+$/.test(tone.notificationUri)
  );
  return typeof tone.id === "string" && /^custom-[a-z0-9-]{2,64}$/.test(tone.id) &&
    typeof tone.name === "string" && tone.name.trim().length > 0 && tone.name.length <= 40 &&
    typeof tone.uri === "string" && tone.uri.startsWith("file://") &&
    typeof tone.mimeType === "string" && CUSTOM_TONE_MIME_TYPES.has(tone.mimeType) &&
    typeof tone.sizeBytes === "number" && Number.isInteger(tone.sizeBytes) && tone.sizeBytes > 0 && tone.sizeBytes <= MAX_CUSTOM_TONE_BYTES &&
    typeof tone.createdAt === "string" && Number.isFinite(Date.parse(tone.createdAt)) && safeNotificationUri;
}

export function validatePersistedState(raw: unknown): PersistedAppState {
  if (!raw || typeof raw !== "object") throw new Error("Saved data is not in a readable format.");
  const input = raw as Partial<PersistedAppState>;
  if (input.version !== 1 || !Array.isArray(input.habits) || !input.habits.every(isHabit)) {
    throw new Error("Saved data could not be safely opened. Your original data has been left untouched.");
  }
  const settings = (input.settings && typeof input.settings === "object" ? input.settings : DEFAULT_SETTINGS) as Partial<AppSettings>;
  const customTones = Array.isArray(input.customTones) ? input.customTones.filter(isCustomReminderTone) : [];
  const validToneIds = new Set(["device-default", "soft-rise", "bright-bell", "warm-bloom", ...customTones.map((tone) => tone.id)]);
  const reminderToneId = typeof settings.reminderToneId === "string" && validToneIds.has(settings.reminderToneId)
    ? settings.reminderToneId
    : DEFAULT_SETTINGS.reminderToneId;
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
      reminderToneId,
    },
    customTones,
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
