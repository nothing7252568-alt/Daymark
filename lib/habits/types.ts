export type HabitFrequency = "daily" | "weekdays" | "threePerWeek";
export type HabitStatus = "active" | "paused" | "archived";

export interface Habit {
  id: string;
  name: string;
  frequency: HabitFrequency;
  startDate: string;
  notes: string;
  reminderEnabled: boolean;
  reminderTime: string;
  status: HabitStatus;
  completedDates: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  hapticsEnabled: boolean;
  reducedMotion: boolean;
  weekStartsOnMonday: boolean;
  remindersEnabled: boolean;
}

export interface PersistedAppState {
  version: 1;
  onboardingComplete: boolean;
  habits: Habit[];
  settings: AppSettings;
}

export interface HabitDraft {
  name: string;
  frequency: HabitFrequency;
  startDate: string;
  notes: string;
  reminderEnabled: boolean;
  reminderTime: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  hapticsEnabled: true,
  reducedMotion: false,
  weekStartsOnMonday: true,
  remindersEnabled: true,
};

export const EMPTY_APP_STATE: PersistedAppState = {
  version: 1,
  onboardingComplete: false,
  habits: [],
  settings: DEFAULT_SETTINGS,
};