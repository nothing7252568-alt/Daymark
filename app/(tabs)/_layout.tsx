import React from "react";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { AppIcon, C, type IconName } from "@/components/habits/ui";
import { Platform } from "react-native";

const tabIcons: Record<string, IconName> = {
  index: "sunny-outline",
  progress: "analytics-outline",
  habits: "leaf-outline",
  settings: "settings-outline",
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: C.lime,
        tabBarInactiveTintColor: C.dim,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: { paddingTop: 9, paddingBottom: bottomPadding, height: 60 + bottomPadding, backgroundColor: C.bg, borderTopColor: C.border, borderTopWidth: 1 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700", marginTop: 1 },
        tabBarIcon: ({ color, focused }) => <AppIcon name={focused && route.name === "index" ? "sunny" : tabIcons[route.name]} size={20} color={color} />,
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Today", tabBarAccessibilityLabel: "Today" }} />
      <Tabs.Screen name="progress" options={{ title: "Progress", tabBarAccessibilityLabel: "Progress and streaks" }} />
      <Tabs.Screen name="habits" options={{ title: "Habits", tabBarAccessibilityLabel: "Manage habits" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarAccessibilityLabel: "Settings" }} />
    </Tabs>
  );
}
