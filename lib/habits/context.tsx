import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { localDateKey } from "./dates";
import { getReminderPermission, requestReminderPermission, syncReminderSchedules, type ReminderPermission } from "./notifications";
import { readAppState, writeAppState } from "./storage";
import { EMPTY_APP_STATE, type AppSettings, type CustomReminderTone, type Habit, type HabitDraft, type HabitStatus, type PersistedAppState } from "./types";

type StateChange = (previous: PersistedAppState) => PersistedAppState;
interface HabitStoreValue {
  state: PersistedAppState;
  hydrated: boolean;
  loadingError: string | null;
  saveError: string | null;
  isOffline: boolean;
  notificationPermission: ReminderPermission;
  retryLoad: () => Promise<void>;
  retrySave: () => Promise<boolean>;
  askForReminderPermission: () => Promise<ReminderPermission>;
  refreshReminderPermission: () => Promise<ReminderPermission>;
  finishOnboarding: () => Promise<boolean>;
  createHabit: (draft: HabitDraft) => Promise<boolean>;
  updateHabit: (id: string, draft: HabitDraft) => Promise<boolean>;
  toggleCheckIn: (id: string, date?: string) => Promise<boolean>;
  setHabitStatus: (id: string, status: HabitStatus) => Promise<boolean>;
  deleteHabit: (id: string) => Promise<boolean>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<boolean>;
  addCustomTone: (tone: CustomReminderTone) => Promise<boolean>;
  removeCustomTone: (id: string) => Promise<boolean>;
  resetProgress: () => Promise<boolean>;
  clearError: () => void;
  exportJson: () => string;
}

const HabitStoreContext = createContext<HabitStoreValue | null>(null);
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
const newHabit = (draft: HabitDraft): Habit => ({
  ...draft,
  id: uid(),
  status: "active",
  completedDates: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export function HabitStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedAppState>(EMPTY_APP_STATE);
  const stateRef = useRef(EMPTY_APP_STATE);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const pending = useRef<PersistedAppState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<ReminderPermission>(Platform.OS === "web" ? "unsupported" : "unknown");

  useEffect(() => {
    let mounted = true;
    readAppState().then((loaded) => {
      if (!mounted) return;
      stateRef.current = loaded;
      setState(loaded);
    }).catch((error: unknown) => {
      if (!mounted) return;
      setLoadingError(error instanceof Error ? error.message : "Your saved habits could not be opened.");
    }).finally(() => {
      if (mounted) setHydrated(true);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    let mounted = true;
    const updateOnlineState = () => { if (mounted) setIsOffline(window.navigator.onLine === false); };
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    Promise.resolve().then(updateOnlineState);
    return () => {
      mounted = false;
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    getReminderPermission().then((permission) => {
      if (mounted) setNotificationPermission(permission);
    });
    return () => { mounted = false; };
  }, []);

  const retryLoad = useCallback(async () => {
    setLoadingError(null);
    setHydrated(false);
    try {
      const loaded = await readAppState();
      stateRef.current = loaded;
      setState(loaded);
    } catch (error) {
      setLoadingError(error instanceof Error ? error.message : "Your saved habits could not be opened.");
    } finally {
      setHydrated(true);
    }
  }, []);

  const commit = useCallback((change: StateChange): Promise<boolean> => {
    const run = queueRef.current.then(async () => {
      if (pending.current) {
        setSaveError("Retry the last save before making another change.");
        return false;
      }
      const next = change(stateRef.current);
      try {
        await writeAppState(next);
        stateRef.current = next;
        setState(next);
        setSaveError(null);
        return true;
      } catch {
        pending.current = next;
        setSaveError("Couldn’t save that change. Your last saved version is still here.");
        return false;
      }
    });
    queueRef.current = run.catch(() => undefined);
    return run;
  }, []);

  const retrySave = useCallback((): Promise<boolean> => {
    const run = queueRef.current.then(async () => {
      const next = pending.current;
      if (!next) {
        try {
          if (notificationPermission === "granted") {
            const current = stateRef.current;
            await syncReminderSchedules(current.habits, current.settings, current.customTones);
          }
          setSaveError(null);
          return true;
        } catch {
          setSaveError("Still couldn’t update reminder times. Try again when notifications are available.");
          return false;
        }
      }
      try {
        await writeAppState(next);
        stateRef.current = next;
        setState(next);
        pending.current = null;
        setSaveError(null);
        return true;
      } catch {
        setSaveError("Still couldn’t save. Your changes are waiting here; try again.");
        return false;
      }
    });
    queueRef.current = run.catch(() => undefined);
    return run;
  }, [notificationPermission]);

  const refreshReminderPermission = useCallback(async () => {
    const permission = await getReminderPermission();
    setNotificationPermission(permission);
    return permission;
  }, []);
  const askForReminderPermission = useCallback(async () => {
    const permission = await requestReminderPermission();
    setNotificationPermission(permission);
    return permission;
  }, []);

  useEffect(() => {
    if (!hydrated || notificationPermission !== "granted") return;
    void syncReminderSchedules(state.habits, state.settings, state.customTones).catch(() => {
      setSaveError("Your habits are saved, but reminder times couldn’t be updated.");
    });
  }, [hydrated, notificationPermission, state.habits, state.settings, state.customTones]);

  useEffect(() => {
    if (Platform.OS === "web" || !hydrated) return;
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return;
      void getReminderPermission().then(async (permission) => {
        setNotificationPermission(permission);
        if (permission === "granted") {
          const current = stateRef.current;
          await syncReminderSchedules(current.habits, current.settings, current.customTones);
        }
      }).catch(() => setSaveError("Your reminder permission could not be checked. Open Settings to try again."));
    });
    return () => subscription.remove();
  }, [hydrated]);

  const finishOnboarding = useCallback(() => commit((previous) => ({ ...previous, onboardingComplete: true })), [commit]);
  const createHabit = useCallback((draft: HabitDraft) => commit((previous) => ({ ...previous, habits: [...previous.habits, newHabit(draft)] })), [commit]);
  const updateHabit = useCallback((id: string, draft: HabitDraft) => commit((previous) => ({
    ...previous,
    habits: previous.habits.map((habit) => habit.id === id ? { ...habit, ...draft, updatedAt: new Date().toISOString() } : habit),
  })), [commit]);
  const toggleCheckIn = useCallback((id: string, date = localDateKey()) => commit((previous) => ({
    ...previous,
    habits: previous.habits.map((habit) => {
      if (habit.id !== id) return habit;
      const completedDates = habit.completedDates.includes(date)
        ? habit.completedDates.filter((value) => value !== date)
        : [...habit.completedDates, date].sort();
      return { ...habit, completedDates, updatedAt: new Date().toISOString() };
    }),
  })), [commit]);
  const setHabitStatus = useCallback((id: string, status: HabitStatus) => commit((previous) => ({
    ...previous,
    habits: previous.habits.map((habit) => habit.id === id ? { ...habit, status, updatedAt: new Date().toISOString() } : habit),
  })), [commit]);
  const deleteHabit = useCallback((id: string) => commit((previous) => ({ ...previous, habits: previous.habits.filter((habit) => habit.id !== id) })), [commit]);
  const updateSettings = useCallback((settings: Partial<AppSettings>) => commit((previous) => ({ ...previous, settings: { ...previous.settings, ...settings } })), [commit]);
  const addCustomTone = useCallback((tone: CustomReminderTone) => commit((previous) => ({
    ...previous,
    customTones: [...previous.customTones.filter((item) => item.id !== tone.id), tone],
    settings: { ...previous.settings, reminderToneId: tone.id },
  })), [commit]);
  const removeCustomTone = useCallback((id: string) => commit((previous) => ({
    ...previous,
    customTones: previous.customTones.filter((tone) => tone.id !== id),
    settings: previous.settings.reminderToneId === id
      ? { ...previous.settings, reminderToneId: "device-default" }
      : previous.settings,
  })), [commit]);
  const resetProgress = useCallback(() => commit((previous) => ({
    ...previous,
    habits: previous.habits.map((habit) => ({ ...habit, completedDates: [], updatedAt: new Date().toISOString() })),
  })), [commit]);
  const clearError = useCallback(() => setSaveError(null), []);
  const exportJson = useCallback(() => JSON.stringify({
    ...state,
    customTones: state.customTones.map(({ uri, notificationUri, ...tone }) => ({ ...tone, audioStoredOnThisDevice: true })),
    exportedAt: new Date().toISOString(),
  }, null, 2), [state]);

  const value = useMemo<HabitStoreValue>(() => ({
    state, hydrated, loadingError, saveError, isOffline, notificationPermission,
    retryLoad, retrySave, askForReminderPermission, refreshReminderPermission,
    finishOnboarding, createHabit, updateHabit, toggleCheckIn, setHabitStatus,
    deleteHabit, updateSettings, addCustomTone, removeCustomTone, resetProgress, clearError, exportJson,
  }), [state, hydrated, loadingError, saveError, isOffline, notificationPermission, retryLoad, retrySave, askForReminderPermission, refreshReminderPermission, finishOnboarding, createHabit, updateHabit, toggleCheckIn, setHabitStatus, deleteHabit, updateSettings, addCustomTone, removeCustomTone, resetProgress, clearError, exportJson]);

  return <HabitStoreContext.Provider value={value}>{children}</HabitStoreContext.Provider>;
}

export function useHabitStore(): HabitStoreValue {
  const value = useContext(HabitStoreContext);
  if (!value) throw new Error("useHabitStore must be used inside HabitStoreProvider");
  return value;
}
