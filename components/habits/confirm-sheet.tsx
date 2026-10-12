import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { AppIcon, C, PrimaryButton, QuietButton } from "./ui";

export function ConfirmSheet({ visible, title, message, confirmLabel = "Confirm", destructive = false, reducedMotion = false, onConfirm, onCancel }: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  reducedMotion?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType={reducedMotion ? "none" : "fade"} onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancel confirmation" />
        <View style={styles.panel} accessibilityViewIsModal>
          <View style={[styles.icon, destructive && { backgroundColor: "#3B211F" }]}><AppIcon name={destructive ? "trash-outline" : "help-circle-outline"} size={22} color={destructive ? C.red : C.lime} /></View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <QuietButton onPress={onCancel} style={{ flex: 1 }}>Keep it</QuietButton>
            {destructive ? (
              <Pressable onPress={onConfirm} accessibilityRole="button" style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.8 }]}>
                <Text style={styles.deleteText}>{confirmLabel}</Text>
              </Pressable>
            ) : <View style={{ flex: 1 }}><PrimaryButton onPress={onConfirm}>{confirmLabel}</PrimaryButton></View>}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, alignItems: "center", justifyContent: "center", padding: 22, backgroundColor: "rgba(3,6,4,0.74)" },
  panel: { width: "100%", maxWidth: 440, padding: 22, borderRadius: 24, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, alignItems: "center" },
  icon: { width: 50, height: 50, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#272F1C", marginBottom: 15 },
  title: { color: C.text, textAlign: "center", fontSize: 20, fontWeight: "800" },
  message: { color: C.muted, textAlign: "center", fontSize: 13, lineHeight: 20, marginTop: 8 },
  actions: { flexDirection: "row", alignItems: "center", gap: 10, width: "100%", marginTop: 22 },
  deleteButton: { flex: 1, minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#8E3F39" },
  deleteText: { color: C.white, fontSize: 13, fontWeight: "800" },
});
