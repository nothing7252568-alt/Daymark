import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { datesInWeek, startOfWeek } from "@/lib/habits/dates";
import { isHabitDueOnDate } from "@/lib/habits/streaks";
import type { Habit } from "@/lib/habits/types";
import { AppIcon, C } from "./ui";

export function WeekStrip({ habits, today, weekStartsOnMonday = true, detailed = false }: { habits: Habit[]; today: string; weekStartsOnMonday?: boolean; detailed?: boolean }) {
  const days = datesInWeek(startOfWeek(today, weekStartsOnMonday));
  const labels = weekStartsOnMonday ? ["M", "T", "W", "T", "F", "S", "S"] : ["S", "M", "T", "W", "T", "F", "S"];
  return (
    <View style={styles.row}>
      {days.map((date, index) => {
        const dueHabits = habits.filter((habit) => isHabitDueOnDate(habit, date, weekStartsOnMonday));
        const complete = dueHabits.filter((habit) => habit.completedDates.includes(date)).length;
        const due = dueHabits.length;
        const isToday = date === today;
        const hasWin = complete > 0;
        return (
          <View key={date} style={styles.day} accessible accessibilityLabel={`${date}, ${complete} of ${due} complete${isToday ? ", today" : ""}`}>
            <Text style={[styles.label, isToday && styles.todayText]}>{labels[index]}</Text>
            <View style={[styles.circle, isToday && styles.todayCircle, hasWin && !isToday && styles.doneCircle]}>
              {hasWin && !isToday ? <AppIcon name="checkmark" size={11} color={C.lime} /> : <Text style={[styles.number, isToday && styles.todayNumber]}>{Number(date.slice(-2))}</Text>}
            </View>
            {detailed ? <Text style={styles.count}>{complete}/{due}</Text> : <View style={[styles.tick, hasWin && styles.tickOn]} />}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  day: { alignItems: "center", gap: 7, minWidth: 28 },
  label: { color: C.dim, fontSize: 9, fontWeight: "700" },
  todayText: { color: C.lime },
  circle: { width: 31, height: 31, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: C.surfaceRaised, borderWidth: 1, borderColor: C.border },
  todayCircle: { backgroundColor: C.lime, borderColor: C.lime },
  doneCircle: { backgroundColor: "#222A1C", borderColor: "#4C5835" },
  number: { color: C.muted, fontSize: 10, fontWeight: "700" },
  todayNumber: { color: C.bg, fontWeight: "900" },
  tick: { width: 4, height: 4, borderRadius: 2, backgroundColor: "transparent" },
  tickOn: { backgroundColor: C.lime },
  count: { color: C.dim, fontSize: 8 },
});
