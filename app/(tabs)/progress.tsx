import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppIcon, AppScreen, C, Card, Label, ScreenTitle, SectionHeading } from "@/components/habits/ui";
import { ProgressRing } from "@/components/habits/progress-ring";
import { WeekStrip } from "@/components/habits/week-strip";
import { addDays, formatShortDate, localDateKey } from "@/lib/habits/dates";
import { completionRateThisWeek, strongestStreak } from "@/lib/habits/streaks";
import { useHabitStore } from "@/lib/habits/context";

export default function ProgressScreen() {
  const { state } = useHabitStore();
  const today = localDateKey();
  const active = state.habits.filter((habit) => habit.status === "active");
  const current = strongestStreak(active, today, state.settings.weekStartsOnMonday);
  const best = strongestStreak(state.habits, today, state.settings.weekStartsOnMonday, "best");
  const rate = completionRateThisWeek(active, today, state.settings.weekStartsOnMonday);
  const days = Array.from({ length: 28 }, (_, i) => addDays(today, i - 27));
  const daysCompleted = state.habits.reduce((count, habit) => count + habit.completedDates.filter((key) => key >= days[0] && key <= today).length, 0);
  const allCheckIns = state.habits.reduce((sum, habit) => sum + habit.completedDates.length, 0);

  return (
    <AppScreen>
      <View style={styles.brand}><Text style={styles.brandText}>DAYMARK <Text style={styles.brandSlash}>/</Text> PROGRESS</Text><AppIcon name="sparkles-outline" size={18} color={C.lime} /></View>
      <ScreenTitle eyebrow="THE LONG VIEW" title="Your rhythm." subtitle="Notice what’s already working." />
      <Card style={styles.hero}>
        <View style={{ flex: 1, gap: 6 }}>
          <Label>CURRENT RUN</Label>
          <Text style={styles.heroNumber}>{current.count}<Text style={styles.heroUnit}> {unitLabel(current.unit, current.count)}</Text></Text>
          <Text style={styles.heroSub}>{current.count ? "A lovely rhythm to be in." : "Every rhythm begins with one day."}</Text>
        </View>
        <ProgressRing progress={rate / 100} size={92} value={`${rate}%`} caption="THIS WEEK" reducedMotion={state.settings.reducedMotion} />
      </Card>
      <View style={styles.statsRow}>
        <View style={styles.statCard}><View style={styles.statIcon}><AppIcon name="trophy-outline" size={16} color={C.lime} /></View><Text style={styles.statValue}>{best.count}</Text><Text style={styles.statLabel}>BEST {unitLabel(best.unit, best.count).toUpperCase()}</Text></View>
        <View style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: "#2D2119" }]}><AppIcon name="checkmark-done-outline" size={16} color={C.orange} /></View><Text style={styles.statValue}>{allCheckIns}</Text><Text style={styles.statLabel}>CHECK-INS KEPT</Text></View>
      </View>

      <View style={styles.sectionCard}>
        <SectionHeading title="This week" subtitle={rate === 100 ? "You showed up for every plan." : "Each mark is a moment you kept."} />
        {active.length ? <WeekStrip habits={active} today={today} weekStartsOnMonday={state.settings.weekStartsOnMonday} detailed /> : <Text style={styles.emptyNote}>Add a habit to see your weekly rhythm here.</Text>}
      </View>

      <View style={styles.sectionCard}>
        <SectionHeading title="A month of moments" subtitle="The last 28 days, with today at the end." />
        <View style={styles.heatLabels}><Text style={styles.heatLegend}>LESS</Text>{[0, 1, 2, 3, 4].map((n) => <View key={n} style={[styles.legendBlock, { backgroundColor: heatColor(n) }]} />)}<Text style={styles.heatLegend}>MORE</Text></View>
        <View style={styles.heatGrid} accessibilityLabel="Habit check-in history for the last twenty-eight days">
          {days.map((date) => {
            const count = state.habits.filter((habit) => habit.completedDates.includes(date)).length;
            const hasData = state.habits.some((habit) => habit.startDate <= date);
            return <View key={date} accessible accessibilityLabel={`${formatShortDate(date)}: ${count} habits checked in`} style={[styles.heatCell, { backgroundColor: hasData ? heatColor(count) : C.surfaceRaised }, date === today && styles.heatToday]} />;
          })}
        </View>
        <Text style={styles.heatCaption}>{daysCompleted} check-ins this month across {state.habits.length} tracked {state.habits.length === 1 ? "habit" : "habits"}.</Text>
      </View>
      <Text style={styles.footer}><AppIcon name="heart-outline" size={13} color={C.dim} />  Progress, not perfection.</Text>
    </AppScreen>
  );
}

function unitLabel(unit: "day" | "week", count: number) {
  const label = unit === "week" ? "week" : "day";
  return `${label}${count === 1 ? "" : "s"}`;
}

function heatColor(count: number) {
  if (count >= 4) return "#D9F66F";
  if (count === 3) return "#A9C454";
  if (count === 2) return "#6F8744";
  if (count === 1) return "#39472B";
  return "#202821";
}

const styles = StyleSheet.create({
  brand: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 2 },
  brandText: { color: C.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 },
  brandSlash: { color: C.lime, fontWeight: "500" },
  hero: { flexDirection: "row", alignItems: "center", padding: 19, gap: 12, backgroundColor: "#171D17", borderColor: "#39442A" },
  heroNumber: { color: C.text, fontSize: 44, fontWeight: "800", letterSpacing: -2, lineHeight: 48 },
  heroUnit: { fontSize: 16, color: C.muted, letterSpacing: 0, fontWeight: "600" },
  heroSub: { color: C.muted, fontSize: 11, lineHeight: 16, maxWidth: 155 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, minHeight: 126, padding: 14, borderRadius: 19, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, gap: 4 },
  statIcon: { width: 31, height: 31, borderRadius: 11, backgroundColor: "#252D1C", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  statValue: { color: C.text, fontSize: 25, fontWeight: "800", letterSpacing: -1 },
  statLabel: { color: C.dim, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  sectionCard: { gap: 19, padding: 17, borderRadius: 21, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  emptyNote: { color: C.muted, fontSize: 12, lineHeight: 18 },
  heatLabels: { flexDirection: "row", alignItems: "center", gap: 5, justifyContent: "flex-end" },
  heatLegend: { color: C.dim, fontSize: 8, fontWeight: "700", marginHorizontal: 2 },
  legendBlock: { width: 11, height: 11, borderRadius: 3 },
  heatGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignSelf: "center", maxWidth: 315, justifyContent: "center" },
  heatCell: { width: 32, height: 32, borderRadius: 9, borderWidth: 1, borderColor: "#303A30" },
  heatToday: { borderColor: C.text, borderWidth: 2 },
  heatCaption: { color: C.muted, fontSize: 11, lineHeight: 17 },
  footer: { color: C.dim, fontSize: 11, textAlign: "center", marginTop: -5 },
});
