import React, { useState } from "react";
import { Linking, Platform, Pressable, Share, StyleSheet, Switch, Text, View } from "react-native";
import { AppIcon, AppScreen, C, Card, InfoBanner, ScreenTitle } from "@/components/habits/ui";
import { ConfirmSheet } from "@/components/habits/confirm-sheet";
import { useHabitStore } from "@/lib/habits/context";

function PreferenceRow({ icon, title, subtitle, value, onValueChange }: { icon: "phone-portrait-outline" | "sparkles-outline" | "eye-outline" | "calendar-outline" | "notifications-outline"; title: string; subtitle: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={styles.prefRow}>
      <View style={styles.prefIcon}><AppIcon name={icon} size={17} color={C.lime} /></View>
      <View style={styles.prefCopy}><Text style={styles.prefTitle}>{title}</Text><Text style={styles.prefSub}>{subtitle}</Text></View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: C.border, true: "#53622C" }} thumbColor={value ? C.lime : "#BBC4BA"} accessibilityLabel={title} />
    </View>
  );
}

function SettingAction({ icon, title, subtitle, onPress, danger = false }: { icon: "share-outline" | "trash-outline" | "information-circle-outline"; title: string; subtitle: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.78 }]}>
      <View style={[styles.prefIcon, danger && { backgroundColor: "#321F1E" }]}><AppIcon name={icon} size={17} color={danger ? C.red : C.lime} /></View>
      <View style={styles.prefCopy}><Text style={[styles.prefTitle, danger && { color: C.red }]}>{title}</Text><Text style={styles.prefSub}>{subtitle}</Text></View>
      <AppIcon name="chevron-forward" size={16} color={C.dim} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { state, saveError, retrySave, notificationPermission, askForReminderPermission, refreshReminderPermission, updateSettings, resetProgress, exportJson } = useHabitStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState("");
  const [openingSettings, setOpeningSettings] = useState(false);

  const enableNotifications = async () => {
    const result = await askForReminderPermission();
    await refreshReminderPermission();
    if (result === "granted") setMessage("Reminders are ready. Set a time on any habit.");
    else if (result === "denied") setMessage("Notifications are off. You can allow them in your device settings whenever you’re ready.");
    else setMessage("Reminders are available on a supported mobile device, not in this preview.");
  };

  const openDeviceSettings = async () => {
    setOpeningSettings(true);
    try { await Linking.openSettings(); }
    catch { setMessage("Open Settings on your device, then choose Notifications → Daymark."); }
    setOpeningSettings(false);
  };

  const exportData = async () => {
    try {
      const payload = exportJson();
      if (Platform.OS === "web") {
        const blob = new Blob([payload], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "daymark-habits.json";
        anchor.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({ title: "Daymark habit data", message: payload });
      }
      setMessage("A copy of your Daymark data is ready.");
    } catch {
      setMessage("We couldn’t make the export. Your saved habits are unchanged.");
    }
  };

  const clearHistory = async () => {
    const success = await resetProgress();
    setConfirmReset(false);
    setMessage(success ? "Check-in history cleared. Your habits are still here." : "History wasn’t cleared. Retry the save to keep your data safe.");
  };

  return (
    <>
      <AppScreen>
        <View style={styles.brand}><Text style={styles.brandText}>DAYMARK <Text style={styles.brandSlash}>/</Text> SETTINGS</Text><AppIcon name="moon-outline" size={18} color={C.lime} /></View>
        <ScreenTitle eyebrow="MAKE IT YOURS" title="The quiet bits." subtitle="A few small choices, all yours." />

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Reminders</Text>
          {notificationPermission === "unsupported" ? (
            <InfoBanner tone="normal" icon="phone-portrait-outline" title="Ready on your phone">Notification permissions are available in a native mobile build. Your habits still work offline here.</InfoBanner>
          ) : notificationPermission === "denied" ? (
            <InfoBanner tone="warning" icon="notifications-off-outline" title="Notifications are turned off" action={<Pressable onPress={() => void openDeviceSettings()} accessibilityRole="button" style={styles.inlineButton}><Text style={styles.inlineButtonText}>{openingSettings ? "Opening…" : "Open device settings"}</Text></Pressable>}>Allow Daymark notifications in your device settings. Your habits and streaks work either way.</InfoBanner>
          ) : notificationPermission === "granted" ? (
            <InfoBanner tone="success" icon="notifications-outline" title="Reminders are ready">Each reminder follows the schedule and time saved on its habit.</InfoBanner>
          ) : (
            <InfoBanner tone="normal" icon="notifications-outline" title="Only when you ask">Daymark asks for permission only when you choose to turn reminders on.</InfoBanner>
          )}
          <PreferenceRow icon="notifications-outline" title="Habit reminders" subtitle={state.settings.remindersEnabled ? "Let each habit set its own time" : "All reminders are paused"} value={state.settings.remindersEnabled} onValueChange={(value) => { void updateSettings({ remindersEnabled: value }); if (value && notificationPermission !== "granted") void enableNotifications(); }} />
          {notificationPermission !== "granted" && state.settings.remindersEnabled ? <Pressable onPress={() => void enableNotifications()} accessibilityRole="button" style={styles.permissionButton}><AppIcon name="notifications" size={15} color={C.lime} /><Text style={styles.permissionButtonText}>{notificationPermission === "denied" ? "Try notification permission again" : "Allow reminders on this device"}</Text></Pressable> : null}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Your rhythm</Text>
          <PreferenceRow icon="sparkles-outline" title="Haptic feedback" subtitle="A small tap when you check in" value={state.settings.hapticsEnabled} onValueChange={(value) => void updateSettings({ hapticsEnabled: value })} />
          <View style={styles.divider} />
          <PreferenceRow icon="eye-outline" title="Reduced motion" subtitle="Keep transitions still and simple" value={state.settings.reducedMotion} onValueChange={(value) => void updateSettings({ reducedMotion: value })} />
          <View style={styles.divider} />
          <PreferenceRow icon="calendar-outline" title="Week starts Monday" subtitle="Choose the first day in your progress view" value={state.settings.weekStartsOnMonday} onValueChange={(value) => void updateSettings({ weekStartsOnMonday: value })} />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Your data</Text>
          <SettingAction icon="information-circle-outline" title="Saved on this device" subtitle={`${state.habits.length} habits · no account or network required`} onPress={() => setMessage("Your habits and check-ins are private to this device. They remain available offline.")} />
          <View style={styles.divider} />
          <SettingAction icon="share-outline" title="Export a copy" subtitle="Save your habits and check-in history as JSON" onPress={() => void exportData()} />
          <View style={styles.divider} />
          <SettingAction icon="trash-outline" title="Clear check-in history" subtitle="Keep your habits, reset every streak" danger onPress={() => setConfirmReset(true)} />
        </Card>

        {saveError ? <InfoBanner tone="warning" icon="save-outline" title="A change is waiting to save" action={<Pressable onPress={() => void retrySave()} accessibilityRole="button"><Text style={styles.inlineButtonText}>Retry save</Text></Pressable>}>{saveError}</InfoBanner> : null}
        {message ? <InfoBanner tone="success" icon="checkmark-circle-outline" title={message}><Text style={{ color: C.muted, fontSize: 10 }}>Your settings are always yours to change.</Text></InfoBanner> : null}
        <Text style={styles.version}>DAYMARK · A QUIETER WAY TO KEEP GOING</Text>
      </AppScreen>
      <ConfirmSheet visible={confirmReset} title="Clear check-in history?" message="All completion dates and streaks will be removed. Your habits and settings will stay. This can’t be undone." confirmLabel="Clear history" destructive reducedMotion={state.settings.reducedMotion} onConfirm={() => void clearHistory()} onCancel={() => setConfirmReset(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandText: { color: C.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 },
  brandSlash: { color: C.lime, fontWeight: "500" },
  section: { gap: 14, padding: 15 },
  sectionTitle: { color: C.text, fontSize: 15, fontWeight: "800", marginBottom: 2 },
  prefRow: { minHeight: 61, flexDirection: "row", alignItems: "center", gap: 11 },
  prefCopy: { flex: 1, gap: 3 },
  prefIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#252D1C" },
  prefTitle: { color: C.text, fontSize: 12, fontWeight: "700" },
  prefSub: { color: C.muted, fontSize: 10, lineHeight: 15 },
  divider: { height: 1, backgroundColor: C.border, marginLeft: 45 },
  actionRow: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 11 },
  inlineButton: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center", paddingHorizontal: 2 },
  inlineButtonText: { color: C.lime, fontSize: 11, fontWeight: "800" },
  permissionButton: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, backgroundColor: "#252D1C", borderWidth: 1, borderColor: "#596337" },
  permissionButtonText: { color: C.lime, fontSize: 11, fontWeight: "800" },
  version: { color: C.dim, textAlign: "center", fontSize: 9, fontWeight: "700", letterSpacing: 1.4, marginBottom: 8 },
});
