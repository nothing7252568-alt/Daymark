import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { AppIcon, AppScreen, BrandLockup, C, Card, InfoBanner, PrimaryButton, SectionHeading, StateCard, Tag } from "@/components/habits/ui";
import { HabitRow } from "@/components/habits/habit-row";
import { HabitForm } from "@/components/habits/habit-form";
import { ProgressRing } from "@/components/habits/progress-ring";
import { WeekStrip } from "@/components/habits/week-strip";
import { formatToday, localDateKey, startOfWeek } from "@/lib/habits/dates";
import { getStreakSummary, getTodayProgressSummary, isCheckedInToday, isCompleteForCurrentPeriod, strongestStreak } from "@/lib/habits/streaks";
import { useHabitStore } from "@/lib/habits/context";
import type { Habit, HabitDraft } from "@/lib/habits/types";

export default function TodayScreen() {
  const { state, hydrated, loadingError, saveError, isOffline, retryLoad, retrySave, toggleCheckIn, createHabit, updateHabit, clearError } = useHabitStore();
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [toast, setToast] = useState<{ habitId: string; name: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const today = localDateKey();
  const active = state.habits.filter((habit) => habit.status === "active" && habit.startDate <= today);
  const todaySummary = getTodayProgressSummary(active, today, state.settings.weekStartsOnMonday);
  const due = todaySummary.dueHabits;
  const completedCount = todaySummary.completedSteps;
  const progress = todaySummary.totalSteps ? completedCount / todaySummary.totalSteps : 0;
  const completedWeekly = active.filter((habit) => habit.frequency === "threePerWeek" && isCompleteForCurrentPeriod(habit, today, state.settings.weekStartsOnMonday));
  const currentBest = strongestStreak(active, today, state.settings.weekStartsOnMonday);
  const bestEver = strongestStreak(active, today, state.settings.weekStartsOnMonday, "best");
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const openNew = () => { setEditing(null); setFormVisible(true); };
  const saveDraft = (draft: HabitDraft) => editing ? updateHabit(editing.id, draft) : createHabit(draft);
  const onCheckIn = async (habit: Habit, date = today) => {
    if (busyId) return;
    setBusyId(habit.id);
    clearError();
    if (state.settings.hapticsEnabled) void Haptics.selectionAsync().catch(() => undefined);
    const wasChecked = habit.completedDates.includes(date);
    const ok = await toggleCheckIn(habit.id, date);
    setBusyId(null);
    if (ok) setToast(wasChecked ? null : { habitId: habit.id, name: habit.name });
  };
  const undo = async () => {
    if (!toast) return;
    const ok = await toggleCheckIn(toast.habitId);
    if (ok) setToast(null);
  };

  if (!hydrated) return <AppScreen><View style={styles.loading}><Text style={styles.loadingText}>Tending to your day…</Text></View></AppScreen>;
  if (loadingError) return <AppScreen><StateCard icon="cloud-offline-outline" title="Your day is still here" message={loadingError} action={<PrimaryButton onPress={() => void retryLoad()} icon="refresh">Try again</PrimaryButton>} /></AppScreen>;

  return (
    <>
      <AppScreen>
        <View style={styles.topline}>
          <BrandLockup small />
          <Tag icon={isOffline ? "cloud-offline-outline" : "phone-portrait-outline"} accent>{isOffline ? "OFFLINE · SAVED HERE" : "OFFLINE READY"}</Tag>
        </View>
        <View style={styles.heading}>
          <Text style={styles.date}>{formatToday().toUpperCase()}</Text>
          <Text style={styles.title}>Make today{"\n"}count.</Text>
          <Text style={styles.subtitle}>Keep it small. Keep it yours.</Text>
        </View>
        {saveError ? <InfoBanner tone="warning" icon="save-outline" title="Your last change didn’t save" action={<Pressable onPress={() => void retrySave()} accessibilityRole="button" style={styles.retry}><Text style={styles.retryText}>Retry save</Text></Pressable>}>{saveError}</InfoBanner> : null}

        <Card style={styles.focusCard}>
          <ProgressRing progress={progress} size={104} value={`${completedCount}/${todaySummary.totalSteps}`} caption="TODAY + WEEK" reducedMotion={state.settings.reducedMotion} />
          <View style={styles.focusCopy}>
            <Text style={styles.focusEyebrow}>{todaySummary.totalSteps === 0 ? "ROOM TO BEGIN" : todaySummary.remainingSteps === 0 ? "YOU SHOWED UP" : "YOUR PACE TODAY"}</Text>
            <Text style={styles.focusTitle}>{todaySummary.totalSteps === 0 ? "Make space for one thing." : todaySummary.remainingSteps === 0 ? "That’s your day, kept." : `${todaySummary.remainingSteps} small ${todaySummary.remainingSteps === 1 ? "step" : "steps"} left.`}</Text>
            <Text style={styles.focusSub}>{todaySummary.totalSteps === 0 ? "Choose a habit that feels doable." : "A little progress is still progress."}</Text>
            {currentBest.count > 0 ? <View style={styles.streakPill}><AppIcon name="flame" size={13} color={C.orange} /><Text style={styles.streakText}>{currentBest.count} {currentBest.unit}{currentBest.count === 1 ? "" : "s"} in rhythm</Text></View> : bestEver.count > 0 ? <Text style={styles.bestText}>Best so far: {bestEver.count} {bestEver.unit}{bestEver.count === 1 ? "" : "s"}</Text> : null}
          </View>
        </Card>

        <View style={styles.weekCard}>
          <SectionHeading title="Your week" subtitle="One day at a time" />
          <WeekStrip habits={active} today={today} weekStartsOnMonday={state.settings.weekStartsOnMonday} />
        </View>

        <View style={styles.habitsHeading}>
          <SectionHeading title="Today’s habits" subtitle={todaySummary.totalSteps ? `${completedCount} of ${todaySummary.totalSteps} check-ins kept` : "A gentle place to start"} />
          {state.habits.length > 0 ? <Pressable onPress={openNew} accessibilityRole="button" accessibilityLabel="Create a habit" style={styles.addSmall}><AppIcon name="add" size={19} color={C.bg} /></Pressable> : null}
        </View>

        {due.length === 0 ? (
          <StateCard icon="leaf-outline" title="Nothing to catch up on" message={state.habits.length > 0 ? "A quiet day can be a good day. Add another habit if it feels right." : "Choose one small thing you’d like to make room for. You can change it whenever you need."} action={<PrimaryButton onPress={openNew} icon="add">{state.habits.length > 0 ? "Add a habit" : "Create my first habit"}</PrimaryButton>} />
        ) : (
          <View style={styles.habitList}>
            {due.map((habit) => <HabitRow key={habit.id} habit={habit} checked={isCheckedInToday(habit, today)} pending={busyId === habit.id} streak={getStreakSummary(habit, today, state.settings.weekStartsOnMonday).current} onCheckIn={() => void onCheckIn(habit)} />)}
            <View style={styles.localNote}><AppIcon name="lock-closed-outline" size={12} color={C.dim} /><Text style={styles.localNoteText}>Saved on this device. Works offline.</Text></View>
          </View>
        )}
        {completedWeekly.length > 0 ? <View style={styles.weeklyDone}><SectionHeading title="This week, kept" subtitle="You’ve reached the 3-check-in goal. Undo the latest if you need to." />{completedWeekly.map((habit) => {
          const weekStart = startOfWeek(today, state.settings.weekStartsOnMonday);
          const recent = habit.completedDates.filter((date) => date >= weekStart && date <= today).sort().at(-1);
          const latest = recent ?? today;
          return <HabitRow key={habit.id} habit={habit} checked pending={busyId === habit.id} streak={getStreakSummary(habit, today, state.settings.weekStartsOnMonday).current} onCheckIn={() => void onCheckIn(habit, latest)} onCheckInLabel={`Undo this week’s latest check-in for ${habit.name}`} />;
        })}</View> : null}
        {state.habits.some((habit) => habit.status === "paused") ? <Text style={styles.pausedHint}>{state.habits.filter((habit) => habit.status === "paused").length} paused habit(s) · find them in Habits</Text> : null}
        {toast ? <View style={styles.toast} accessibilityLiveRegion="polite"><View style={styles.toastIcon}><AppIcon name="checkmark" size={14} color={C.bg} /></View><Text style={styles.toastText}>One small thing, kept.</Text><Pressable onPress={() => void undo()} accessibilityRole="button" accessibilityLabel={`Undo today's check-in for ${toast.name}`} style={styles.undo}><Text style={styles.undoText}>UNDO</Text></Pressable></View> : null}
      </AppScreen>
      {formVisible ? <HabitForm visible reducedMotion={state.settings.reducedMotion} initial={editing} onClose={() => setFormVisible(false)} onSave={saveDraft} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  topline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heading: { gap: 7, paddingTop: 1 },
  date: { color: C.limeDeep, fontSize: 10, fontWeight: "800", letterSpacing: 1.7 },
  title: { color: C.text, fontSize: 38, lineHeight: 42, fontWeight: "800", letterSpacing: -1.8 },
  subtitle: { color: C.muted, fontSize: 14 },
  focusCard: { flexDirection: "row", alignItems: "center", gap: 18, padding: 18, backgroundColor: "#171D17", borderColor: "#39442A" },
  focusCopy: { flex: 1, gap: 6 },
  focusEyebrow: { color: C.lime, fontSize: 9, fontWeight: "800", letterSpacing: 1.4 },
  focusTitle: { color: C.text, fontSize: 17, lineHeight: 22, fontWeight: "800", letterSpacing: -0.3 },
  focusSub: { color: C.muted, fontSize: 11, lineHeight: 16 },
  streakPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#2D2119", borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5, marginTop: 3 },
  streakText: { color: C.orange, fontSize: 10, fontWeight: "800" },
  bestText: { color: C.sage, fontSize: 10, fontWeight: "700" },
  weekCard: { gap: 17, padding: 17, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  habitsHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  addSmall: { width: 44, height: 44, borderRadius: 15, backgroundColor: C.lime, alignItems: "center", justifyContent: "center" },
  habitList: { gap: 10 },
  weeklyDone: { gap: 9 },
  localNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 3 },
  localNoteText: { color: C.dim, fontSize: 10 },
  pausedHint: { color: C.dim, fontSize: 11, textAlign: "center", marginTop: -8 },
  retry: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
  retryText: { color: C.orange, fontSize: 11, fontWeight: "800" },
  toast: { flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderColor: "#546136", backgroundColor: "#1E2717", borderRadius: 16, padding: 12 },
  toastIcon: { width: 23, height: 23, borderRadius: 12, backgroundColor: C.lime, alignItems: "center", justifyContent: "center" },
  toastText: { flex: 1, color: C.text, fontSize: 12, fontWeight: "700" },
  undo: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  undoText: { color: C.lime, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: C.muted, fontSize: 13 },
});
