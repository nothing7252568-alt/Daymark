import React, { useEffect, useRef, useState } from "react";
import { createAudioPlayer, type AudioPlayer, type AudioSource } from "expo-audio";
import { Directory, File, Paths } from "expo-file-system";
import { Linking, Platform, Pressable, Share, StyleSheet, Switch, Text, View } from "react-native";
import { AppIcon, AppScreen, C, Card, InfoBanner, PrimaryButton, ScreenTitle } from "@/components/habits/ui";
import { ConfirmSheet } from "@/components/habits/confirm-sheet";
import { useHabitStore } from "@/lib/habits/context";
import { BUILT_IN_REMINDER_TONES, getReminderToneOption } from "@/lib/habits/tones";
import { syncReminderSchedules } from "@/lib/habits/notifications";
import { DaymarkToneModule } from "@/modules/daymark-tone";
import type { CustomReminderTone } from "@/lib/habits/types";

const MAX_TONE_SIZE = 10 * 1024 * 1024;
const TONE_MIME_TYPES: Record<string, string> = {
  wav: "audio/wav",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
};

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

async function cleanupRemovedTone(tone: CustomReminderTone): Promise<string> {
  let cleanupMessage = "";
  try {
    const localFile = new File(tone.uri);
    if (localFile.exists) localFile.delete();
  } catch {
    cleanupMessage = "The tune left your library, but its local preview file couldn’t be removed.";
  }
  if (tone.notificationUri) {
    if (DaymarkToneModule) {
      try {
        await DaymarkToneModule.deleteNotificationAudio(tone.notificationUri);
        await DaymarkToneModule.deleteToneNotificationChannel(`daymark-tone-${tone.id}`);
      } catch {
        cleanupMessage = "Removed the tune from Daymark. Android may keep its old sound channel until you remove it in device notification settings.";
      }
    } else {
      cleanupMessage = "Removed the tune from Daymark. This build cannot remove its former Android sound channel.";
    }
  }
  return cleanupMessage || `Removed “${tone.name}” from your tone library.`;
}

function ToneRow({
  name,
  description,
  selected,
  playing,
  canPreview,
  onSelect,
  onPreview,
  onRemove,
}: {
  name: string;
  description: string;
  selected: boolean;
  playing: boolean;
  canPreview: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onRemove?: () => void;
}) {
  return (
    <View style={[styles.toneRow, selected && styles.toneRowSelected]}>
      <Pressable
        onPress={onSelect}
        accessibilityRole="radio"
        accessibilityLabel={`${name}. ${description}`}
        accessibilityState={{ checked: selected }}
        style={styles.toneChoice}
      >
        <AppIcon name={selected ? "radio-button-on" : "radio-button-off"} size={20} color={selected ? C.lime : C.muted} />
        <View style={styles.prefCopy}>
          <Text style={styles.prefTitle}>{name}</Text>
          <Text style={styles.prefSub} numberOfLines={2}>{description}</Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onPreview}
        disabled={!canPreview}
        accessibilityRole="button"
        accessibilityLabel={`${playing ? "Stop" : "Preview"} ${name}`}
        accessibilityState={{ disabled: !canPreview }}
        style={({ pressed }) => [styles.toneControl, !canPreview && styles.toneControlDisabled, pressed && canPreview && { opacity: 0.7 }]}
      >
        <AppIcon name={playing ? "stop" : "play"} size={17} color={canPreview ? C.lime : C.dim} />
      </Pressable>
      {onRemove ? (
        <Pressable onPress={onRemove} accessibilityRole="button" accessibilityLabel={`Remove ${name}`} style={styles.toneControl}>
          <AppIcon name="trash-outline" size={17} color={C.red} />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function SettingsScreen() {
  const {
    state,
    saveError,
    retrySave,
    notificationPermission,
    askForReminderPermission,
    refreshReminderPermission,
    updateSettings,
    addCustomTone,
    removeCustomTone,
    resetProgress,
    exportJson,
  } = useHabitStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [toneToRemove, setToneToRemove] = useState<CustomReminderTone | null>(null);
  const [message, setMessage] = useState("");
  const [toneError, setToneError] = useState("");
  const [toneBusy, setToneBusy] = useState(false);
  const [pendingToneCleanup, setPendingToneCleanup] = useState<CustomReminderTone | null>(null);
  const [openingSettings, setOpeningSettings] = useState(false);
  const [previewingTone, setPreviewingTone] = useState<string | null>(null);
  const previewPlayer = useRef<AudioPlayer | null>(null);
  const toneCleanupInFlight = useRef(new Set<string>());
  const customNotificationTonesAvailable = Platform.OS === "android"
    && Number(Platform.Version) >= 29
    && DaymarkToneModule !== null;

  useEffect(() => () => {
    previewPlayer.current?.remove();
    previewPlayer.current = null;
  }, []);

  useEffect(() => {
    if (!pendingToneCleanup || state.customTones.some((item) => item.id === pendingToneCleanup.id) || toneCleanupInFlight.current.has(pendingToneCleanup.id)) return;
    const tone = pendingToneCleanup;
    toneCleanupInFlight.current.add(tone.id);
    void cleanupRemovedTone(tone).then(setMessage).finally(() => {
      toneCleanupInFlight.current.delete(tone.id);
      setPendingToneCleanup((current) => current?.id === tone.id ? null : current);
    });
  }, [pendingToneCleanup, state.customTones]);

  const playPreview = (id: string, source: AudioSource | null) => {
    if (!source) return;
    if (previewingTone === id && previewPlayer.current) {
      previewPlayer.current.pause();
      previewPlayer.current.remove();
      previewPlayer.current = null;
      setPreviewingTone(null);
      return;
    }
    try {
      previewPlayer.current?.remove();
      const player = createAudioPlayer(source, { updateInterval: 150 });
      player.volume = 0.58;
      previewPlayer.current = player;
      setPreviewingTone(id);
      const subscription = player.addListener("playbackStatusUpdate", (status) => {
        if (status.didJustFinish || status.error) {
          subscription.remove();
          player.remove();
          if (previewPlayer.current === player) previewPlayer.current = null;
          setPreviewingTone(null);
        }
      });
      player.play();
    } catch {
      setToneError("This audio could not be previewed. Try another file.");
      setPreviewingTone(null);
    }
  };

  const selectTone = async (toneId: string) => {
    setToneError("");
    setMessage("");
    const success = await updateSettings({ reminderToneId: toneId });
    if (!success) {
      setToneError("That sound choice couldn’t be saved. Retry the save before choosing another tone.");
      return;
    }
    const tone = getReminderToneOption(toneId, state.customTones);
    const customToneCanPlayInReminders = !!tone.customTone?.notificationUri && customNotificationTonesAvailable;
    if (tone.customTone && !customToneCanPlayInReminders) {
      setMessage("Tune selected for previews. Reminders will use the device default on this build; uploaded alert sounds need Android 10+ and a native Daymark install.");
    } else {
      setMessage(`${tone.name} is selected for your reminders.`);
    }
  };

  const uploadTone = async () => {
    setToneError("");
    setMessage("");
    setToneBusy(true);
    let localCopy: File | null = null;
    let notificationUri: string | undefined;
    try {
      const picked = await File.pickFileAsync({ mimeTypes: ["audio/*"] });
      if (picked.canceled) return;
      const source = picked.result;
      const extension = source.name.split(".").pop()?.toLowerCase() ?? "";
      const supportedFormat = extension in TONE_MIME_TYPES && !(Platform.OS === "ios" && extension === "ogg");
      if (!supportedFormat) {
        throw new Error(Platform.OS === "android" ? "Choose an MP3, WAV, M4A, or OGG audio file." : "Choose an MP3, WAV, or M4A audio file.");
      }
      const sizeBytes = source.info().size ?? 0;
      if (sizeBytes <= 0) throw new Error("This audio file is empty or can’t be read.");
      if (sizeBytes > MAX_TONE_SIZE) throw new Error("Choose an audio file smaller than 10 MB.");

      const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const directory = new Directory(Paths.document, "daymark-tones");
      directory.create({ idempotent: true, intermediates: true });
      localCopy = new File(directory, `${id}.${extension}`);
      await source.copy(localCopy);
      if (customNotificationTonesAvailable && DaymarkToneModule) {
        notificationUri = await DaymarkToneModule.registerNotificationAudio(localCopy.uri, localCopy.name);
      }

      const name = source.name.replace(/\.[^.]+$/, "").trim().slice(0, 40) || "My tune";
      const customTone: CustomReminderTone = {
        id,
        name,
        uri: localCopy.uri,
        mimeType: TONE_MIME_TYPES[extension],
        sizeBytes,
        createdAt: new Date().toISOString(),
        ...(notificationUri ? { notificationUri } : {}),
      };
      const success = await addCustomTone(customTone);
      if (!success) {
        if (notificationUri) await DaymarkToneModule?.deleteNotificationAudio(notificationUri);
        if (localCopy.exists) localCopy.delete();
        setToneError("The tune is on your device, but Daymark couldn’t save it to your library. Retry the save and upload it again.");
        return;
      }
      setMessage(notificationUri
        ? `Added “${name}” and selected it for reminders.`
        : `Added “${name}” for previews. This build will use your device default for reminders.`);
    } catch (error) {
      if (notificationUri) {
        try { await DaymarkToneModule?.deleteNotificationAudio(notificationUri); } catch { /* keep the user-facing import error */ }
      }
      if (localCopy?.exists) {
        try { localCopy.delete(); } catch { /* the import error remains visible */ }
      }
      setToneError(error instanceof Error ? error.message : "The tune could not be added. Try another file.");
    } finally {
      setToneBusy(false);
    }
  };

  const removeTone = async () => {
    const tone = toneToRemove;
    if (!tone) return;
    setToneError("");
    setMessage("");
    const selectedToneId = state.settings.reminderToneId === tone.id ? "device-default" : state.settings.reminderToneId;
    const remainingTones = state.customTones.filter((item) => item.id !== tone.id);
    try {
      await syncReminderSchedules(state.habits, { ...state.settings, reminderToneId: selectedToneId }, remainingTones);
    } catch {
      setToneError("Daymark couldn’t refresh reminder sounds, so the tune is still in your library. Retry this removal when reminders are available.");
      return;
    }

    const success = await removeCustomTone(tone.id);
    setToneToRemove(null);
    setPendingToneCleanup(tone);
    if (!success) {
      setToneError("The tune is still in your library because its removal could not be saved. Retry the save first; its reminder schedule has been refreshed.");
      return;
    }
  };

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
      setMessage("A copy of your Daymark data is ready. Imported audio files stay on this device.");
    } catch {
      setMessage("We couldn’t make the export. Your saved habits are unchanged.");
    }
  };

  const clearHistory = async () => {
    const success = await resetProgress();
    setConfirmReset(false);
    setMessage(success ? "Check-in history cleared. Your habits are still here." : "History wasn’t cleared. Retry the save to keep your data safe.");
  };

  const platformSoundNote = Platform.OS === "android"
    ? customNotificationTonesAvailable
      ? "Uploaded tones can play in this Android build. Each sound uses its own channel; Android keeps channel controls in device settings."
      : "Uploads can be previewed here. Using one for notifications needs Android 10+ and a native Daymark build; otherwise reminders use your device default."
    : Platform.OS === "ios"
      ? "Uploads stay on this device for previews. iOS background notifications can only use sounds bundled in the app, so your uploaded tune uses the device default."
      : "Sound previews work here. Native notification sounds and audio uploads require the mobile app.";

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
            <InfoBanner tone="success" icon="notifications-outline" title="Reminders are ready">Each reminder follows the schedule, time, and sound saved on your habits and device.</InfoBanner>
          ) : (
            <InfoBanner tone="normal" icon="notifications-outline" title="Only when you ask">Daymark asks for permission only when you choose to turn reminders on.</InfoBanner>
          )}
          <PreferenceRow icon="notifications-outline" title="Habit reminders" subtitle={state.settings.remindersEnabled ? "Let each habit set its own time" : "All reminders are paused"} value={state.settings.remindersEnabled} onValueChange={(value) => { void updateSettings({ remindersEnabled: value }); if (value && notificationPermission !== "granted") void enableNotifications(); }} />
          {notificationPermission !== "granted" && state.settings.remindersEnabled ? <Pressable onPress={() => void enableNotifications()} accessibilityRole="button" style={styles.permissionButton}><AppIcon name="notifications" size={15} color={C.lime} /><Text style={styles.permissionButtonText}>{notificationPermission === "denied" ? "Try notification permission again" : "Allow reminders on this device"}</Text></Pressable> : null}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Reminder sound</Text>
          <Text style={styles.sectionHint}>Choose a sound that feels right. Preview any built-in tone, or add a short MP3, WAV, M4A, or OGG file (up to 10 MB).</Text>
          {BUILT_IN_REMINDER_TONES.map((tone) => (
            <ToneRow
              key={tone.id}
              name={tone.name}
              description={tone.description}
              selected={state.settings.reminderToneId === tone.id}
              playing={previewingTone === tone.id}
              canPreview={tone.source !== null}
              onSelect={() => void selectTone(tone.id)}
              onPreview={() => playPreview(tone.id, tone.source)}
            />
          ))}
          {state.customTones.length > 0 ? (
            <>
              <Text style={styles.subheading}>YOUR UPLOADS</Text>
              {state.customTones.map((tone) => (
                <ToneRow
                  key={tone.id}
                  name={tone.name}
                  description="Stored on this device"
                  selected={state.settings.reminderToneId === tone.id}
                  playing={previewingTone === tone.id}
                  canPreview
                  onSelect={() => void selectTone(tone.id)}
                  onPreview={() => playPreview(tone.id, tone.uri)}
                  onRemove={() => setToneToRemove(tone)}
                />
              ))}
            </>
          ) : null}
          {Platform.OS === "web" ? (
            <InfoBanner icon="information-circle-outline" title="Upload on your phone">Open Daymark on Android or iPhone to add a tune from your device.</InfoBanner>
          ) : (
            <PrimaryButton icon="cloud-upload-outline" disabled={toneBusy} onPress={() => void uploadTone()}>
              {toneBusy ? "Adding tune…" : "Add your own tune"}
            </PrimaryButton>
          )}
          {toneError ? <InfoBanner tone="warning" icon="alert-circle-outline" title="Couldn’t update the tone">{toneError}</InfoBanner> : null}
          {message ? <InfoBanner tone="success" icon="checkmark-circle-outline" title={message} /> : null}
          <InfoBanner icon="information-circle-outline" title="Notification sound behavior">{platformSoundNote}</InfoBanner>
          {saveError ? <InfoBanner tone="warning" icon="save-outline" title="A change is waiting to save" action={<Pressable onPress={() => void retrySave()} accessibilityRole="button" style={styles.inlineButton}><Text style={styles.inlineButtonText}>Retry save</Text></Pressable>}>{saveError}</InfoBanner> : null}
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
          <SettingAction icon="share-outline" title="Export a copy" subtitle="Habits and check-ins as JSON; audio stays on this device" onPress={() => void exportData()} />
          <View style={styles.divider} />
          <SettingAction icon="trash-outline" title="Clear check-in history" subtitle="Keep your habits, reset every streak" danger onPress={() => setConfirmReset(true)} />
        </Card>

        {saveError ? <InfoBanner tone="warning" icon="save-outline" title="A change is waiting to save" action={<Pressable onPress={() => void retrySave()} accessibilityRole="button" style={styles.inlineButton}><Text style={styles.inlineButtonText}>Retry save</Text></Pressable>}>{saveError}</InfoBanner> : null}
        <Text style={styles.version}>DAYMARK · A QUIETER WAY TO KEEP GOING</Text>
      </AppScreen>
      <ConfirmSheet visible={confirmReset} title="Clear check-in history?" message="All completion dates and streaks will be removed. Your habits and settings will stay. This can’t be undone." confirmLabel="Clear history" destructive reducedMotion={state.settings.reducedMotion} onConfirm={() => void clearHistory()} onCancel={() => setConfirmReset(false)} />
      <ConfirmSheet visible={!!toneToRemove} title={`Remove ${toneToRemove?.name ?? "this tune"}?`} message="It will be removed from Daymark and any reminder using it will switch to your device default. You can upload it again later." confirmLabel="Remove tune" destructive reducedMotion={state.settings.reducedMotion} onConfirm={() => void removeTone()} onCancel={() => setToneToRemove(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandText: { color: C.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 },
  brandSlash: { color: C.lime, fontWeight: "500" },
  section: { gap: 14, padding: 15 },
  sectionTitle: { color: C.text, fontSize: 15, fontWeight: "800", marginBottom: 2 },
  sectionHint: { color: C.muted, fontSize: 11, lineHeight: 17 },
  subheading: { color: C.dim, fontSize: 9, fontWeight: "800", letterSpacing: 1.4, marginTop: 4 },
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
  toneRow: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 7, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.surfaceRaised },
  toneRowSelected: { borderColor: "#768742", backgroundColor: "#1D2418" },
  toneChoice: { flex: 1, minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 },
  toneControl: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  toneControlDisabled: { opacity: 0.45 },
  version: { color: C.dim, textAlign: "center", fontSize: 9, fontWeight: "700", letterSpacing: 1.4, marginBottom: 8 },
});
