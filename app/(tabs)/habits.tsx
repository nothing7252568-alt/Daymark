import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AppIcon, AppScreen, C, Card, CircleButton, InfoBanner, PrimaryButton, ScreenTitle } from "@/components/habits/ui";
import { HabitRow } from "@/components/habits/habit-row";
import { HabitForm } from "@/components/habits/habit-form";
import { ConfirmSheet } from "@/components/habits/confirm-sheet";
import { localDateKey } from "@/lib/habits/dates";
import { getStreakSummary, isCheckedInToday, isCompleteForCurrentPeriod } from "@/lib/habits/streaks";
import { useHabitStore } from "@/lib/habits/context";
import type { Habit, HabitDraft, HabitFrequency, HabitStatus } from "@/lib/habits/types";

type StatusFilter = "all" | HabitStatus;
type CompletionFilter = "all" | "done" | "notDone";

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: selected }} style={[styles.filterChip, selected && styles.filterChipOn]}><Text style={[styles.filterText, selected && styles.filterTextOn]}>{label}</Text></Pressable>;
}

function ActionPill({ label, icon, onPress, danger = false }: { label: string; icon: "pause-outline" | "play-outline" | "archive-outline" | "refresh-outline" | "trash-outline"; onPress: () => void; danger?: boolean }) {
  return <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.actionPill, danger && styles.actionPillDanger, pressed && { opacity: 0.75 }]}><AppIcon name={icon} size={13} color={danger ? C.red : C.muted} /><Text style={[styles.actionText, danger && { color: C.red }]}>{label}</Text></Pressable>;
}

export default function HabitsScreen() {
  const { state, saveError, retrySave, createHabit, updateHabit, setHabitStatus, deleteHabit } = useHabitStore();
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [frequencyFilter, setFrequencyFilter] = useState<"all" | HabitFrequency>("all");
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>("all");
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Habit | null>(null);
  const today = localDateKey();
  const filtered = useMemo(() => state.habits.filter((habit) => {
    if (statusFilter !== "all" && habit.status !== statusFilter) return false;
    if (frequencyFilter !== "all" && habit.frequency !== frequencyFilter) return false;
    const complete = isCompleteForCurrentPeriod(habit, today, state.settings.weekStartsOnMonday);
    if (completionFilter === "done" && !complete) return false;
    if (completionFilter === "notDone" && complete) return false;
    return habit.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [state.habits, state.settings.weekStartsOnMonday, statusFilter, frequencyFilter, completionFilter, today, query]);

  const openNew = () => { setEditing(null); setFormVisible(true); };
  const openEdit = (habit: Habit) => { setEditing(habit); setFormVisible(true); };
  const saveDraft = (draft: HabitDraft) => editing ? updateHabit(editing.id, draft) : createHabit(draft);
  const changeStatus = (habit: Habit, status: HabitStatus) => void setHabitStatus(habit.id, status);

  return (
    <>
      <AppScreen>
        <View style={styles.headRow}><View style={{ flex: 1 }}><ScreenTitle eyebrow="YOUR ROUTINES" title="The little things." subtitle={`${state.habits.length} ${state.habits.length === 1 ? "habit" : "habits"} in your orbit`} /></View><CircleButton name="add" onPress={openNew} label="Create a new habit" active /></View>
        {saveError ? <InfoBanner tone="warning" icon="save-outline" title="A change is waiting to save" action={<Pressable onPress={() => void retrySave()} accessibilityRole="button"><Text style={styles.retry}>Retry save</Text></Pressable>}>{saveError}</InfoBanner> : null}

        <View style={[styles.searchBox, searchFocused && styles.searchFocus]}>
          <AppIcon name="search" size={18} color={C.dim} />
          <TextInput value={query} onChangeText={setQuery} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} placeholder="Find a habit" placeholderTextColor={C.dim} accessibilityLabel="Search habits by name" style={styles.searchInput} returnKeyType="search" />
          {query ? <Pressable onPress={() => setQuery("")} accessibilityRole="button" accessibilityLabel="Clear search"><AppIcon name="close-circle" size={18} color={C.muted} /></Pressable> : null}
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>SHOW</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {(["active", "paused", "archived", "all"] as StatusFilter[]).map((value) => <FilterChip key={value} label={value === "all" ? "All" : value[0].toUpperCase() + value.slice(1)} selected={statusFilter === value} onPress={() => setStatusFilter(value)} />)}
          </ScrollView>
        </View>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>SCHEDULE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {(["all", "daily", "weekdays", "threePerWeek"] as ("all" | HabitFrequency)[]).map((value) => <FilterChip key={value} label={value === "all" ? "Any" : value === "daily" ? "Daily" : value === "weekdays" ? "Weekdays" : "3× / week"} selected={frequencyFilter === value} onPress={() => setFrequencyFilter(value)} />)}
          </ScrollView>
        </View>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>TODAY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {(["all", "done", "notDone"] as CompletionFilter[]).map((value) => <FilterChip key={value} label={value === "all" ? "All" : value === "done" ? "Done this period" : "Still open"} selected={completionFilter === value} onPress={() => setCompletionFilter(value)} />)}
          </ScrollView>
        </View>

        {filtered.length ? (
          <View style={styles.list}>
            {filtered.map((habit) => {
              const streak = getStreakSummary(habit, today, state.settings.weekStartsOnMonday).current;
              const checked = isCheckedInToday(habit, today);
              const schedule = habit.frequency === "daily" ? "Every day" : habit.frequency === "weekdays" ? "Weekdays" : "3× per week";
              return (
                <Card key={habit.id} style={styles.habitCard}>
                  <HabitRow habit={habit} checked={checked} streak={streak} compact onEdit={() => openEdit(habit)} />
                  <View style={styles.metaRow}><Text style={styles.schedule}>{schedule} · Started {habit.startDate}</Text>{habit.reminderEnabled ? <View style={styles.reminder}><AppIcon name="notifications-outline" size={12} color={C.lime} /><Text style={styles.reminderText}>{habit.reminderTime}</Text></View> : null}</View>
                  <View style={styles.actions}>
                    {habit.status === "active" ? <ActionPill label="Pause" icon="pause-outline" onPress={() => changeStatus(habit, "paused")} /> : null}
                    {habit.status === "paused" ? <ActionPill label="Resume" icon="play-outline" onPress={() => changeStatus(habit, "active")} /> : null}
                    {habit.status === "archived" ? <ActionPill label="Restore" icon="refresh-outline" onPress={() => changeStatus(habit, "active")} /> : <ActionPill label="Archive" icon="archive-outline" onPress={() => changeStatus(habit, "archived")} />}
                    <ActionPill label="Delete" icon="trash-outline" danger onPress={() => setDeleteTarget(habit)} />
                  </View>
                </Card>
              );
            })}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIcon}><AppIcon name={state.habits.length ? "search-outline" : "leaf-outline"} size={23} color={C.lime} /></View>
            <Text style={styles.emptyTitle}>{state.habits.length ? "No matches in this orbit" : "Start with one small thing"}</Text>
            <Text style={styles.emptyBody}>{state.habits.length ? "Try another search or clear one of your filters." : "Choose an easy beginning. You can change your routine whenever life changes."}</Text>
            <PrimaryButton onPress={state.habits.length ? () => { setQuery(""); setStatusFilter("all"); setFrequencyFilter("all"); setCompletionFilter("all"); } : openNew} icon={state.habits.length ? "refresh" : "add"}>{state.habits.length ? "Clear filters" : "Create a habit"}</PrimaryButton>
          </Card>
        )}
        <Text style={styles.localNote}><AppIcon name="phone-portrait-outline" size={12} color={C.dim} />  Private to this device, even offline.</Text>
      </AppScreen>

      {formVisible ? <HabitForm visible reducedMotion={state.settings.reducedMotion} initial={editing} onClose={() => setFormVisible(false)} onSave={saveDraft} /> : null}
      <ConfirmSheet visible={!!deleteTarget} title="Delete this habit?" message={deleteTarget ? `“${deleteTarget.name}” and its check-in history will be removed from this device. This can’t be undone.` : ""} confirmLabel="Delete permanently" destructive reducedMotion={state.settings.reducedMotion} onConfirm={() => { if (deleteTarget) void deleteHabit(deleteTarget.id); setDeleteTarget(null); }} onCancel={() => setDeleteTarget(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  searchBox: { minHeight: 52, paddingHorizontal: 14, flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 16 },
  searchFocus: { borderColor: C.lime, borderWidth: 2 },
  searchInput: { flex: 1, color: C.text, fontSize: 14, paddingVertical: 12 },
  filterGroup: { gap: 8 },
  filterLabel: { color: C.dim, fontSize: 9, fontWeight: "800", letterSpacing: 1.4 },
  chips: { gap: 7, paddingRight: 10 },
  filterChip: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12, borderRadius: 22, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  filterChipOn: { backgroundColor: "#252D1C", borderColor: C.limeDeep },
  filterText: { color: C.muted, fontSize: 10, fontWeight: "700" },
  filterTextOn: { color: C.lime },
  list: { gap: 11 },
  habitCard: { padding: 10, gap: 9 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 7, paddingHorizontal: 3 },
  schedule: { color: C.dim, fontSize: 10, flex: 1 },
  reminder: { flexDirection: "row", alignItems: "center", gap: 4 },
  reminderText: { color: C.muted, fontSize: 10 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 7, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 9, marginTop: 1 },
  actionPill: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: 12, borderRadius: 12, backgroundColor: C.surfaceRaised },
  actionPillDanger: { backgroundColor: "#321F1E" },
  actionText: { color: C.muted, fontSize: 10, fontWeight: "700" },
  emptyCard: { alignItems: "center", gap: 12, padding: 22 },
  emptyIcon: { width: 52, height: 52, borderRadius: 17, backgroundColor: "#252D1C", alignItems: "center", justifyContent: "center" },
  emptyTitle: { color: C.text, fontSize: 17, fontWeight: "800", textAlign: "center" },
  emptyBody: { color: C.muted, fontSize: 12, lineHeight: 18, textAlign: "center", marginBottom: 4 },
  localNote: { color: C.dim, fontSize: 10, textAlign: "center", marginTop: -4 },
  retry: { color: C.orange, fontSize: 11, fontWeight: "800", paddingTop: 6 },
});
