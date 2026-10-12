import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Habit } from "@/lib/habits/types";
import { AppIcon, C, CircleButton } from "./ui";

export function HabitRow({ habit, checked, streak, onCheckIn, onEdit, onCheckInLabel, compact = false, pending = false }: {
  habit: Habit;
  checked: boolean;
  streak: number;
  onCheckIn?: () => void;
  onEdit?: () => void;
  onCheckInLabel?: string;
  compact?: boolean;
  pending?: boolean;
}) {
  const subtitle = habit.frequency === "daily" ? "Every day" : habit.frequency === "weekdays" ? "Weekdays" : "3× this week";
  return (
    <View style={[styles.card, compact && styles.compact]}>
      <View style={styles.leadingMark}>
        <AppIcon name={checked ? "checkmark" : "leaf-outline"} size={18} color={checked ? C.lime : C.sage} />
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={[styles.name, checked && styles.nameDone]}>{habit.name}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{subtitle}</Text>
          {streak > 0 ? <><Text style={styles.dot}>·</Text><AppIcon name="flame" size={12} color={C.orange} /><Text style={styles.streak}>{streak} {habit.frequency === "threePerWeek" ? "wk" : "d"}</Text></> : null}
        </View>
        {habit.notes && !compact ? <Text numberOfLines={1} style={styles.note}>{habit.notes}</Text> : null}
      </View>
      {onCheckIn ? (
        <CircleButton name={pending ? "hourglass-outline" : checked ? "checkmark" : "add"} onPress={onCheckIn} label={pending ? `Saving check-in for ${habit.name}` : onCheckInLabel ?? (checked ? `${habit.name}, checked in. Undo today's check-in` : `Check in for ${habit.name}`)} active={checked} disabled={pending} />
      ) : onEdit ? (
        <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel={`Edit ${habit.name}`} style={({ pressed }) => [styles.editButton, pressed && { opacity: 0.75 }]}>
          <AppIcon name="ellipsis-horizontal" size={20} color={C.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 82, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 19, backgroundColor: C.surface, borderColor: C.border, borderWidth: 1 },
  compact: { minHeight: 71, paddingVertical: 11 },
  leadingMark: { width: 38, height: 38, borderRadius: 13, backgroundColor: C.surfaceRaised, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, gap: 5, minWidth: 0 },
  name: { color: C.text, fontSize: 14, fontWeight: "700" },
  nameDone: { color: C.sage },
  meta: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: C.muted, fontSize: 10, fontWeight: "600" },
  dot: { color: C.dim, fontSize: 13 },
  streak: { color: C.orange, fontSize: 10, fontWeight: "700" },
  note: { color: C.dim, fontSize: 10, marginTop: 1 },
  editButton: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: C.surfaceRaised },
});
