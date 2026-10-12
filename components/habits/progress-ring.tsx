import React, { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { C } from "./ui";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ProgressRing({ progress, size = 104, value, caption, reducedMotion = false }: { progress: number; size?: number; value: string; caption: string; reducedMotion?: boolean }) {
  const stroke = Math.max(6, Math.round(size * 0.075));
  const radius = (size - stroke) / 2;
  const circumference = Math.PI * radius * 2;
  const clamped = Math.max(0, Math.min(1, progress));
  const [animatedValue] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reducedMotion) {
      animatedValue.setValue(clamped);
      return;
    }
    const animation = Animated.timing(animatedValue, {
      toValue: clamped,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [animatedValue, clamped, reducedMotion]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }} accessibilityLabel={`${Math.round(clamped * 100)} percent complete`}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={C.border} strokeWidth={stroke} />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={C.lime} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={strokeDashoffset} rotation={-90} origin={`${size / 2}, ${size / 2}`} />
      </Svg>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  value: { color: C.text, fontSize: 25, fontWeight: "800", letterSpacing: -1, lineHeight: 28 },
  caption: { color: C.muted, fontSize: 9, fontWeight: "700", letterSpacing: 0.7, marginTop: 2 },
});
