import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { addDays, dateFromKey, localDateKey } from "./dates";
import { completedInWeek } from "./streaks";
import type { Habit, AppSettings } from "./types";

export type ReminderPermission = "unknown" | "granted" | "denied" | "unsupported";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function getReminderPermission(): Promise<ReminderPermission> {
  if (Platform.OS === "web") return "unsupported";
  try {
    const result = await Notifications.getPermissionsAsync();
    return result.granted ? "granted" : result.canAskAgain ? "unknown" : "denied";
  } catch {
    return "unsupported";
  }
}

export async function requestReminderPermission(): Promise<ReminderPermission> {
  if (Platform.OS === "web") return "unsupported";
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("daymark-reminders", {
        name: "Habit reminders",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 180],
        lightColor: "#D9F66F",
      });
    }
    const existing = await Notifications.getPermissionsAsync();
    const result = existing.granted ? existing : await Notifications.requestPermissionsAsync();
    return result.granted ? "granted" : "denied";
  } catch {
    return "unsupported";
  }
}

export async function syncReminderSchedules(habits: Habit[], settings: AppSettings): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.remindersEnabled) return;
  const permission = await getReminderPermission();
  if (permission !== "granted") return;
  const today = localDateKey();

  for (const habit of habits) {
    if (habit.status !== "active" || !habit.reminderEnabled) continue;
    const [hour, minute] = habit.reminderTime.split(":").map(Number);
    if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) continue;
    if (habit.frequency === "threePerWeek" && completedInWeek(habit, today, settings.weekStartsOnMonday) >= 3) continue;
    const content = {
      title: habit.name,
      body: "A small moment for the habit you chose.",
      sound: false,
      data: { habitId: habit.id },
    };
    if (habit.startDate > today) {
      const dueDays = habit.frequency === "weekdays" ? new Set([1, 2, 3, 4, 5]) : habit.frequency === "threePerWeek" ? new Set([1, 3, 5]) : null;
      let firstDate = habit.startDate;
      for (let offset = 0; offset < 7; offset += 1) {
        const candidate = addDays(habit.startDate, offset);
        const day = dateFromKey(candidate).getDay();
        if (dueDays === null || dueDays.has(day)) { firstDate = candidate; break; }
      }
      const at = dateFromKey(firstDate);
      at.setHours(hour, minute, 0, 0);
      if (at.getTime() > Date.now()) {
        await Notifications.scheduleNotificationAsync({ content, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: "daymark-reminders" } });
      }
      continue;
    }
    const days = habit.frequency === "daily" ? [null] : habit.frequency === "weekdays" ? [2, 3, 4, 5, 6] : [2, 4, 6];
    for (const weekday of days) {
      const trigger: Notifications.SchedulableNotificationTriggerInput = weekday === null
        ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: "daymark-reminders" }
        : { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour, minute, channelId: "daymark-reminders" };
      await Notifications.scheduleNotificationAsync({
        content,
        trigger,
      });
    }
  }
}
