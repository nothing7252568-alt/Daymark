import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type ColorValue, type PressableProps, type StyleProp, type TextProps, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export const C = {
  bg: "#0B0E0D",
  surface: "#141916",
  surfaceRaised: "#1B211D",
  surfaceSoft: "#202821",
  border: "#2A322D",
  text: "#EFF2E9",
  muted: "#929D94",
  dim: "#849188",
  lime: "#D9F66F",
  limeDeep: "#B4CE57",
  sage: "#99B5A0",
  orange: "#F1A56C",
  red: "#FF887D",
  white: "#FFFFFF",
};

export type IconName = React.ComponentProps<typeof Ionicons>["name"];

export function AppIcon({ name, size = 20, color = C.text }: { name: IconName; size?: number; color?: ColorValue }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessibilityLabel="Daymark mark">
      <Circle cx="20" cy="20" r="17" fill={C.surfaceRaised} stroke={C.border} strokeWidth="1" />
      <Path d="M8.5 23.5c.8-8 5.1-13 11.5-13s10.7 5 11.5 13" fill="none" stroke={C.lime} strokeWidth="2.3" strokeLinecap="round" />
      <Rect x="11" y="25" width="3.2" height="4.3" rx="1.2" fill={C.sage} />
      <Rect x="18.4" y="21.8" width="3.2" height="7.5" rx="1.2" fill={C.limeDeep} />
      <Rect x="25.8" y="18.2" width="3.2" height="11.1" rx="1.2" fill={C.lime} />
      <Circle cx="20" cy="16.5" r="1.7" fill={C.lime} />
    </Svg>
  );
}

export function BrandLockup({ small = false }: { small?: boolean }) {
  return (
    <View style={styles.lockup}>
      <BrandMark size={small ? 30 : 36} />
      <Text style={[styles.wordmark, small && styles.wordmarkSmall]}>DAYMARK</Text>
    </View>
  );
}

export function AppScreen({ children, style }: { children: React.ReactNode; style?: object }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(16, insets.top + 4) }, style]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.screenInner}>{children}</View>
      </ScrollView>
    </View>
  );
}

export function Label({ children, style, ...props }: TextProps) {
  return <Text {...props} style={[styles.label, style]}>{children}</Text>;
}

export function BodyText({ children, style, ...props }: TextProps) {
  return <Text {...props} style={[styles.body, style]}>{children}</Text>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function Tag({ children, accent = false, icon }: { children: React.ReactNode; accent?: boolean; icon?: IconName }) {
  return (
    <View style={[styles.tag, accent && styles.tagAccent]}>
      {icon ? <AppIcon name={icon} size={12} color={accent ? C.lime : C.muted} /> : null}
      <Text style={[styles.tagText, accent && styles.tagTextAccent]}>{children}</Text>
    </View>
  );
}

export function PrimaryButton({ children, onPress, icon, disabled, accessibilityLabel, style }: Omit<PressableProps, "style" | "children"> & { children: React.ReactNode; icon?: IconName; accessibilityLabel?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [styles.primaryButton, pressed && !disabled && styles.pressed, disabled && styles.disabled, style]}
    >
      {icon ? <AppIcon name={icon} size={18} color={C.bg} /> : null}
      <Text style={styles.primaryButtonText}>{children}</Text>
    </Pressable>
  );
}

export function QuietButton({ children, onPress, icon, accessibilityLabel, style }: Omit<PressableProps, "style" | "children"> & { children: React.ReactNode; icon?: IconName; accessibilityLabel?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.quietButton, pressed && styles.pressed, style]}
    >
      {icon ? <AppIcon name={icon} size={17} color={C.text} /> : null}
      <Text style={styles.quietButtonText}>{children}</Text>
    </Pressable>
  );
}

export function CircleButton({ name, onPress, label, active = false, disabled = false }: { name: IconName; onPress?: () => void; label: string; active?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled }}
      style={({ pressed }) => [styles.circleButton, active && styles.circleButtonActive, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      <AppIcon name={name} size={19} color={active ? C.bg : C.text} />
    </Pressable>
  );
}

export function InfoBanner({ tone = "normal", icon, title, children, action }: { tone?: "normal" | "warning" | "success"; icon: IconName; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  const color = tone === "warning" ? C.orange : tone === "success" ? C.lime : C.sage;
  return (
    <View style={[styles.banner, { borderColor: tone === "normal" ? C.border : `${color}55` }]}>
      <AppIcon name={icon} size={18} color={color} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.bannerTitle, { color }]}>{title}</Text>
        {children ? <Text style={styles.bannerText}>{children}</Text> : null}
        {action}
      </View>
    </View>
  );
}

export function LoadingState({ title = "Getting your day ready…" }: { title?: string }) {
  return (
    <View style={styles.centerState} accessibilityRole="progressbar" accessibilityLabel={title}>
      <ActivityIndicator size="small" color={C.lime} />
      <Text style={styles.sectionSubtitle}>{title}</Text>
    </View>
  );
}

export function StateCard({ icon, title, message, action }: { icon: IconName; title: string; message: string; action?: React.ReactNode }) {
  return (
    <View style={styles.stateCard}>
      <View style={styles.stateIcon}><AppIcon name={icon} size={24} color={C.lime} /></View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateMessage}>{message}</Text>
      {action ? <View style={{ marginTop: 20 }}>{action}</View> : null}
    </View>
  );
}

export function Hairline() {
  return <View style={styles.hairline} />;
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

export function ScreenTitle({ eyebrow, title, subtitle, right }: { eyebrow?: string; title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.screenTitleRow}>
      <View style={{ flex: 1, gap: 5 }}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text accessibilityRole="header" style={styles.screenTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 28, alignItems: "center" },
  screenInner: { width: "100%", maxWidth: 520, gap: 23 },
  lockup: { flexDirection: "row", alignItems: "center", gap: 9 },
  wordmark: { color: C.text, fontSize: 12, fontWeight: "800", letterSpacing: 2.4 },
  wordmarkSmall: { fontSize: 10, letterSpacing: 2 },
  label: { color: C.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1.6 },
  body: { color: C.text, fontSize: 14, lineHeight: 21 },
  card: { backgroundColor: C.surface, borderColor: C.border, borderWidth: 1, borderRadius: 22, padding: 18 },
  sectionHeading: { flexDirection: "row", alignItems: "center", gap: 12 },
  sectionTitle: { color: C.text, fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
  sectionSubtitle: { color: C.muted, fontSize: 12, lineHeight: 18 },
  tag: { minHeight: 27, flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 5, paddingHorizontal: 9, borderRadius: 20, backgroundColor: C.surfaceRaised, borderWidth: 1, borderColor: C.border },
  tagAccent: { backgroundColor: "#252D1A", borderColor: "#596337" },
  tagText: { color: C.muted, fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },
  tagTextAccent: { color: C.lime },
  primaryButton: { minHeight: 52, borderRadius: 16, backgroundColor: C.lime, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9, paddingHorizontal: 18 },
  primaryButtonText: { color: C.bg, fontSize: 14, fontWeight: "800", letterSpacing: 0.1 },
  quietButton: { minHeight: 46, borderRadius: 14, backgroundColor: C.surfaceRaised, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, paddingHorizontal: 15, borderWidth: 1, borderColor: C.border },
  quietButtonText: { color: C.text, fontSize: 13, fontWeight: "700" },
  circleButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.surfaceRaised, borderColor: C.border, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  circleButtonActive: { backgroundColor: C.lime, borderColor: C.lime },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.48 },
  banner: { flexDirection: "row", alignItems: "flex-start", gap: 11, padding: 14, borderRadius: 16, backgroundColor: C.surface, borderWidth: 1 },
  bannerTitle: { fontSize: 12, fontWeight: "700" },
  bannerText: { color: C.muted, fontSize: 12, lineHeight: 18 },
  centerState: { flex: 1, minHeight: 240, alignItems: "center", justifyContent: "center", gap: 12 },
  stateCard: { alignItems: "center", paddingHorizontal: 20, paddingVertical: 28, borderRadius: 23, backgroundColor: C.surface, borderColor: C.border, borderWidth: 1 },
  stateIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: C.surfaceRaised, alignItems: "center", justifyContent: "center", marginBottom: 15 },
  stateTitle: { color: C.text, fontSize: 17, fontWeight: "700", textAlign: "center" },
  stateMessage: { color: C.muted, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 8, maxWidth: 290 },
  hairline: { height: 1, backgroundColor: C.border, width: "100%" },
  fieldLabel: { color: C.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 9 },
  screenTitleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  eyebrow: { color: C.lime, fontSize: 10, fontWeight: "800", letterSpacing: 1.7, textTransform: "uppercase" },
  screenTitle: { color: C.text, fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: -1.2 },
  input: { minHeight: 50, color: C.text, backgroundColor: C.surfaceRaised, borderColor: C.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 15 },
});

export function textInputStyle() {
  return styles.input;
}

export const commonStyles = styles;
