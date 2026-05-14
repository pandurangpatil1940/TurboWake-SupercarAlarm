import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface RPMDisplayProps {
  rpm: Animated.SharedValue<number>;
  size?: "small" | "large";
  color?: string;
  glowColor?: string;
}

export function RPMDisplay({
  rpm,
  size = "large",
  color = "#0F1B35",
  glowColor = "rgba(61,142,255,0.3)",
}: RPMDisplayProps) {
  const fontSize = size === "large" ? 52 : 28;
  const labelSize = size === "large" ? 14 : 11;

  const animatedStyle = useAnimatedStyle(() => {
    const intensity = rpm.value / 8000;
    return {
      textShadowRadius: 8 + intensity * 20,
      opacity: 0.8 + intensity * 0.2,
    };
  });

  const formattedRpm = useDerivedValue(() => {
    const val = Math.round(rpm.value / 10) * 10;
    return val.toLocaleString();
  });

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.rpmNumber,
          animatedStyle,
          {
            fontSize,
            color,
            textShadowColor: glowColor,
          },
        ]}
      >
        {formattedRpm.value}
      </Animated.Text>
      <Text style={[styles.label, { fontSize: labelSize, color }]}>RPM</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  rpmNumber: {
    fontFamily: "Inter_700Bold",
    letterSpacing: -2,
    textShadowOffset: { width: 0, height: 0 },
  },
  label: {
    fontFamily: "Inter_500Medium",
    letterSpacing: 3,
    marginTop: -4,
    opacity: 0.6,
  },
});
