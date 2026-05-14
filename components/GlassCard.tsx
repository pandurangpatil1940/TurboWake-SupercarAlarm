import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useAppearance } from "../hooks/useAppearance";

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  borderRadius?: number;
}

export function GlassCard({
  children,
  style,
  intensity: _intensity,
  borderRadius = 16,
}: GlassCardProps) {
  const scheme = useAppearance();
  const isDark = scheme === "dark";

  return (
    <View
      style={[
        styles.base,
        {
          borderRadius,
          backgroundColor: isDark ? "#131D38" : "#FFFFFF",
          borderColor: isDark ? "#1E2D52" : "#DDE4F8",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
  },
});
