import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { DaymarkToneModule } from "@/modules/daymark-tone";
import { dateFromKey, getReminderDatesInWindow, localDateKey } from "./dates";
import { completedInWeek } from "./streaks";
import { getReminderToneOption } from "./tones";
import type { AppSettings, CustomReminderTone, Habit } from "./types";

export type ReminderPermission = "unknown" | "granted" | "denied" | "unsupported";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
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
    if (Platform.OS === "android" && Number(Platform.Version) >= 26) {
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

async function ensureReminderChannel(toneId: string, customTones: CustomReminderTone[]): Promise<string | undefined> {
  if (Platform.OS !== "android" || Number(Platform.Version) < 26) return undefined;

  const tone = getReminderToneOption(toneId, customTones);
  if (tone.customTone?.notificationUri && Number(Platform.Version) >= 29 && DaymarkToneModule) {
    const channelId = `daymark-tone-${tone.id}`;
    await DaymarkToneModule.createToneNotificationChannel(channelId, `Daymark · ${tone.name}`, tone.customTone.notificationUri);
    return channelId;
  }

  const useDeviceDefault = !!tone.customTone;
  const channelId = `daymark-tone-${useDeviceDefault ? "device-default" : tone.id}`;
  await Notifications.setNotificationChannelAsync(channelId, {
    name: `Daymark · ${useDeviceDefault ? "Device default" : tone.name}`,
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 180],
    lightColor: "#D9F66F",
    ...(useDeviceDefault || !tone.resourceName ? {} : { sound: tone.resourceName }),
  });
  return channelId;
}

export async function syncReminderSchedules(
  habits: Habit[],
  settings: AppSettings,
  customTones: CustomReminderTone[] = [],
): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.remindersEnabled) return;
  const permission = await getReminderPermission();
  if (permission !== "granted") return;
  const today = localDateKey();
  const selectedTone = getReminderToneOption(settings.reminderToneId, customTones);
  const androidChannelId = await ensureReminderChannel(settings.reminderToneId, customTones);
  const apiLevel = Platform.OS === "android" ? Number(Platform.Version) : 0;
  const notificationSound = Platform.OS === "ios"
    ? selectedTone.customTone || !selectedTone.resourceName ? "default" : selectedTone.resourceName
    : Platform.OS === "android" && apiLevel < 26
      ? selectedTone.customTone ? undefined : selectedTone.resourceName ?? undefined
      : undefined;
  const soundContent = notificationSound ? { sound: notificationSound } : {};
  const androidChannel = androidChannelId ? { channelId: androidChannelId } : {};

  for (const habit of habits) {
    if (habit.status !== "active" || !habit.reminderEnabled) continue;
    const [hour, minute] = habit.reminderTime.split(":").map(Number);
    if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) continue;
    if (habit.frequency === "threePerWeek" && completedInWeek(habit, today, settings.weekStartsOnMonday) >= 3) continue;
    const content: Notifications.NotificationContentInput = {
      title: habit.name,
      body: "A small moment for the habit you chose.",
      ...soundContent,
      data: { habitId: habit.id },
    };
    if (habit.startDate > today) {
      for (const reminderDate of getReminderDatesInWindow(habit.startDate, habit.frequency)) {
        const at = dateFromKey(reminderDate);
        at.setHours(hour, minute, 0, 0);
        if (at.getTime() <= Date.now()) continue;
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, ...androidChannel },
        });
      }
      continue;
    }
    const days = habit.frequency === "daily" ? [null] : habit.frequency === "weekdays" ? [2, 3, 4, 5, 6] : [2, 4, 6];
    for (const weekday of days) {
      const trigger: Notifications.SchedulableNotificationTriggerInput = weekday === null
        ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, ...androidChannel }
        : { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour, minute, ...androidChannel };
      await Notifications.scheduleNotificationAsync({ content, trigger });
    }
  }
}
