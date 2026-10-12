import React, { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import type { Habit, HabitDraft, HabitFrequency } from "@/lib/habits/types";
import { isValidDateKey, localDateKey } from "@/lib/habits/dates";
import { ConfirmSheet } from "./confirm-sheet";
import { AppIcon, C, FieldLabel, PrimaryButton, QuietButton, textInputStyle } from "./ui";

const EMPTY_DRAFT = (): HabitDraft => ({ name: "", frequency: "daily", startDate: localDateKey(), notes: "", reminderEnabled: false, reminderTime: "20:00" });
const asDraft = (initial?: Habit | null): HabitDraft => initial ? {
  name: initial.name,
  frequency: initial.frequency,
  startDate: initial.startDate,
  notes: initial.notes,
  reminderEnabled: initial.reminderEnabled,
  reminderTime: initial.reminderTime,
} : EMPTY_DRAFT();

export function HabitForm({ visible, onClose, onSave, initial, reducedMotion = false }: {
  visible: boolean;
  onClose: () => void;
  onSave: (draft: HabitDraft) => Promise<boolean>;
  initial?: Habit | null;
  reducedMotion?: boolean;
}) {
  const [initialSnapshot] = useState(() => {
    const draft = asDraft(initial);
    return { draft, fingerprint: JSON.stringify(draft) };
  });
  const [draft, setDraft] = useState<HabitDraft>(() => initialSnapshot.draft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const isDirty = JSON.stringify(draft) !== initialSnapshot.fingerprint;
  const set = <K extends keyof HabitDraft>(key: K, value: HabitDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const requestClose = () => {
    if (busy) return;
    if (isDirty) setConfirmDiscard(true);
    else onClose();
  };
  const save = async () => {
    const name = draft.name.trim();
    if (!name) return setError("Give this habit a name first.");
    if (!isValidDateKey(draft.startDate)) return setError("Use a real start date in YYYY-MM-DD format.");
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.reminderTime)) return setError("Set the reminder time as 24-hour HH:MM.");
    setBusy(true);
    setError("");
    const ok = await onSave({ ...draft, name });
    setBusy(false);
    if (ok) onClose();
    else setError("Your change could not be saved. Try again when storage is available.");
  };

  return (
    <>
    <Modal visible={visible} transparent animationType={reducedMotion ? "none" : "slide"} onRequestClose={requestClose} statusBarTranslucent>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} accessibilityLabel="Close habit form" accessibilityRole="button" />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
          <View style={styles.sheet} accessibilityViewIsModal>
            <View style={styles.grabber} />
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>{initial ? "TUNE YOUR ROUTINE" : "A SMALL PROMISE"}</Text>
                <Text style={styles.title}>{initial ? "Edit habit" : "New habit"}</Text>
              </View>
              <Pressable onPress={requestClose} accessibilityLabel="Close" accessibilityRole="button" style={styles.close}><AppIcon name="close" size={20} color={C.muted} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View>
                <FieldLabel>HABIT NAME</FieldLabel>
                <TextInput value={draft.name} onChangeText={(value) => set("name", value)} placeholder="e.g. Read for ten minutes" placeholderTextColor={C.dim} maxLength={54} returnKeyType="done" accessibilityLabel="Habit name" style={textInputStyle()} />
              </View>
              <View>
                <FieldLabel>HOW OFTEN?</FieldLabel>
                <View style={styles.optionRow}>
                  {([["daily", "Every day"], ["weekdays", "Weekdays"], ["threePerWeek", "3× / week"]] as [HabitFrequency, string][]).map(([value, label]) => {
                    const selected = draft.frequency === value;
                    return <Pressable key={value} onPress={() => set("frequency", value)} accessibilityRole="radio" accessibilityState={{ checked: selected }} style={[styles.option, selected && styles.optionSelected]}><Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text></Pressable>;
                  })}
                </View>
              </View>
              <View>
                <FieldLabel>START DATE</FieldLabel>
                <TextInput value={draft.startDate} onChangeText={(value) => set("startDate", value)} placeholder="YYYY-MM-DD" placeholderTextColor={C.dim} keyboardType="numbers-and-punctuation" maxLength={10} accessibilityLabel="Habit start date, year month day" style={textInputStyle()} />
              </View>
              <View>
                <View style={styles.switchRow}>
                  <View style={styles.reminderTitle}><AppIcon name="notifications-outline" size={18} color={C.lime} /><View style={{ gap: 3 }}><Text style={styles.switchTitle}>A gentle nudge</Text><Text style={styles.switchSub}>Remind me at the same time</Text></View></View>
                  <Switch value={draft.reminderEnabled} onValueChange={(value) => set("reminderEnabled", value)} trackColor={{ false: C.border, true: "#53622C" }} thumbColor={draft.reminderEnabled ? C.lime : "#BBC4BA"} accessibilityLabel="Enable a reminder for this habit" />
                </View>
                {draft.reminderEnabled ? <View style={{ marginTop: 12 }}><TextInput value={draft.reminderTime} onChangeText={(value) => set("reminderTime", value)} keyboardType="numbers-and-punctuation" maxLength={5} placeholder="20:00" placeholderTextColor={C.dim} accessibilityLabel="Reminder time in 24-hour format" style={[textInputStyle(), { width: 120 }]} /><Text style={styles.helper}>24-hour time, like 08:30 or 20:00.</Text></View> : null}
              </View>
              <View>
                <FieldLabel>NOTES · OPTIONAL</FieldLabel>
                <TextInput value={draft.notes} onChangeText={(value) => set("notes", value)} placeholder="Make it easy to begin…" placeholderTextColor={C.dim} maxLength={160} multiline accessibilityLabel="Optional habit notes" style={[textInputStyle(), styles.notes]} />
              </View>
              {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
              <View style={styles.actions}><QuietButton onPress={requestClose}>Not now</QuietButton><View style={{ flex: 1 }}><PrimaryButton onPress={save} disabled={busy}>{busy ? "Saving…" : initial ? "Save changes" : "Create habit"}</PrimaryButton></View></View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
    <ConfirmSheet visible={confirmDiscard} title="Discard unsaved changes?" message="Your edits haven’t been saved. Keep editing, or discard them and close this form." confirmLabel="Discard changes" reducedMotion={reducedMotion} onConfirm={() => { setConfirmDiscard(false); onClose(); }} onCancel={() => setConfirmDiscard(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(3,6,4,0.72)" },
  keyboard: { width: "100%", alignItems: "center", justifyContent: "flex-end" },
  sheet: { width: "100%", maxWidth: 560, maxHeight: "94%", backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderColor: C.border, borderWidth: 1, paddingHorizontal: 21, paddingTop: 10, paddingBottom: 16 },
  grabber: { width: 38, height: 4, borderRadius: 4, backgroundColor: C.dim, alignSelf: "center", marginBottom: 17 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  eyebrow: { color: C.lime, fontSize: 9, fontWeight: "800", letterSpacing: 1.7 },
  title: { color: C.text, fontSize: 25, fontWeight: "800", letterSpacing: -0.8, marginTop: 4 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surfaceRaised, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border },
  form: { gap: 17, paddingBottom: 14 },
  optionRow: { flexDirection: "row", gap: 8 },
  option: { flex: 1, minHeight: 45, alignItems: "center", justifyContent: "center", paddingHorizontal: 7, borderRadius: 13, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  optionSelected: { backgroundColor: "#232B19", borderColor: C.limeDeep },
  optionText: { color: C.muted, fontSize: 11, fontWeight: "700" },
  optionTextSelected: { color: C.lime },
  switchRow: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 12, borderRadius: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  reminderTitle: { flexDirection: "row", alignItems: "center", gap: 10 },
  switchTitle: { color: C.text, fontSize: 13, fontWeight: "700" },
  switchSub: { color: C.muted, fontSize: 11 },
  helper: { color: C.dim, fontSize: 11, marginTop: 7 },
  notes: { minHeight: 86, textAlignVertical: "top", paddingTop: 13 },
  error: { color: C.red, fontSize: 12, lineHeight: 18 },
  actions: { flexDirection: "row", gap: 10, alignItems: "center", marginTop: 2 },
});
