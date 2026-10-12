import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppIcon, AppScreen, BrandLockup, C, InfoBanner, PrimaryButton } from "@/components/habits/ui";
import { useHabitStore } from "@/lib/habits/context";

const pages = [
  {
    eyebrow: "ONE SMALL THING",
    title: "Small actions.\nStronger days.",
    copy: "Pick one thing you want to make room for. A single tap keeps your progress, right here on your phone.",
    icon: "sunny-outline" as const,
  },
  {
    eyebrow: "YOUR OWN RHYTHM",
    title: "A streak is a\ntrail, not a test.",
    copy: "See what you’ve kept, start again when life gets busy, and choose a gentle reminder only if it helps.",
    icon: "flame-outline" as const,
  },
];

export default function OnboardingScreen() {
  const [page, setPage] = useState(0);
  const [saving, setSaving] = useState(false);
  const { finishOnboarding, saveError, retrySave } = useHabitStore();
  const current = pages[page];
  const enter = async () => {
    setSaving(true);
    const saved = await finishOnboarding();
    setSaving(false);
    if (saved) router.replace("/(tabs)");
  };
  const recover = async () => {
    setSaving(true);
    const saved = await retrySave();
    setSaving(false);
    if (saved) router.replace("/(tabs)");
  };

  return (
    <AppScreen style={{ justifyContent: "space-between", minHeight: 660 }}>
      <View style={styles.top}><BrandLockup /><Pressable onPress={() => void enter()} disabled={saving} accessibilityRole="button" accessibilityLabel="Skip onboarding" style={styles.skip}><Text style={styles.skipText}>Skip</Text></Pressable></View>
      {saveError ? <InfoBanner tone="warning" icon="save-outline" title="We couldn’t save that yet" action={<Pressable onPress={() => void recover()} disabled={saving} accessibilityRole="button" style={styles.retry}><Text style={styles.retryText}>{saving ? "Trying…" : "Retry save"}</Text></Pressable>}>{saveError}</InfoBanner> : null}
      <View style={styles.hero}>
        <View style={styles.orbitArt}>
          <View style={styles.orbit} />
          <View style={styles.sun}><AppIcon name={current.icon} size={31} color={C.lime} /></View>
          <View style={styles.miniBars}>{[24, 36, 51, 69].map((height, i) => <View key={i} style={[styles.bar, { height, opacity: 0.36 + i * 0.2 }]} />)}</View>
          <View style={styles.spark}><View style={styles.sparkDot} /></View>
        </View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{current.eyebrow}</Text>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.body}>{current.copy}</Text>
        </View>
        <View style={styles.dots} accessibilityLabel={`Page ${page + 1} of ${pages.length}`}>
          {pages.map((item, i) => <View key={item.eyebrow} style={[styles.dot, i === page && styles.dotActive]} />)}
        </View>
      </View>
      <View style={styles.bottom}>
        <PrimaryButton onPress={page === 0 ? () => setPage(1) : () => void enter()} icon={page === 0 ? "arrow-forward" : "checkmark"} disabled={saving}>
          {saving ? "Saving…" : page === 0 ? "A little more" : "Make my first habit"}
        </PrimaryButton>
        <Text style={styles.privacy}>Your habits stay on this device. No account, no noise.</Text>
        {page === 1 ? <View style={styles.reminderHint}><AppIcon name="notifications-outline" size={15} color={C.muted} /><Text style={styles.reminderText}>Reminders are always optional and asked for later</Text></View> : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  skip: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  skipText: { color: C.muted, fontSize: 13, fontWeight: "700" },
  retry: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
  retryText: { color: C.lime, fontSize: 11, fontWeight: "800" },
  hero: { gap: 26, alignItems: "flex-start" },
  orbitArt: { width: 244, height: 220, alignSelf: "center", alignItems: "center", justifyContent: "center" },
  orbit: { position: "absolute", width: 178, height: 178, borderRadius: 100, borderWidth: 1, borderColor: C.border, borderTopColor: C.limeDeep, transform: [{ rotate: "-28deg" }] },
  sun: { width: 76, height: 76, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: "#21291B", borderWidth: 1, borderColor: "#596337", marginTop: -12 },
  miniBars: { position: "absolute", bottom: 15, flexDirection: "row", alignItems: "flex-end", gap: 7 },
  bar: { width: 8, borderRadius: 5, backgroundColor: C.lime },
  spark: { position: "absolute", top: 32, right: 33, width: 24, height: 24, borderRadius: 12, backgroundColor: C.surfaceRaised, alignItems: "center", justifyContent: "center" },
  sparkDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.lime },
  copy: { gap: 12, width: "100%" },
  eyebrow: { color: C.lime, fontSize: 10, fontWeight: "800", letterSpacing: 1.8 },
  title: { color: C.text, fontSize: 39, lineHeight: 44, letterSpacing: -1.6, fontWeight: "800" },
  body: { maxWidth: 390, color: C.muted, fontSize: 15, lineHeight: 23 },
  dots: { flexDirection: "row", gap: 7, paddingTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.border },
  dotActive: { width: 24, borderRadius: 5, backgroundColor: C.lime },
  bottom: { gap: 13, paddingBottom: 12 },
  privacy: { color: C.dim, textAlign: "center", fontSize: 11 },
  reminderHint: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, padding: 6 },
  reminderText: { color: C.muted, fontSize: 10 },
});
