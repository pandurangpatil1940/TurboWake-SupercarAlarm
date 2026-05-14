import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "../../components/GlassCard";
import type { Theme } from "../../context/AlarmContext";
import { useAlarms } from "../../context/AlarmContext";
import { useColors } from "../../hooks/useColors";
import { selectionStore } from "../../services/selectionStore";
import { Check, ChevronLeft, Info } from "lucide-react-native";

const THEMES: { id: Theme; label: string; sub: string; image: ReturnType<typeof require> }[] = [
  {
    id: "blue_storm",
    label: "Blue Storm",
    sub: "Neon front strike",
    image: require("../../assets/images/car_blue_storm.png"),
  },
  {
    id: "violet_exhaust",
    label: "Violet Exhaust",
    sub: "Purple rear glow",
    image: require("../../assets/images/car_violet_exhaust.png"),
  },
  {
    id: "dark_knight",
    label: "Dark Knight",
    sub: "Phantom headlights",
    image: require("../../assets/images/car_dark_knight.png"),
  },
  {
    id: "red_inferno",
    label: "Red Inferno",
    sub: "Crimson exhausts",
    image: require("../../assets/images/car_red_inferno.png"),
  },
  {
    id: "m_power",
    label: "M Power",
    sub: "Track-ready stance",
    image: require("../../assets/images/car_m_power.png"),
  },
  {
    id: "m_drift",
    label: "M Drift",
    sub: "Rear exit glow",
    image: require("../../assets/images/car_m_drift.png"),
  },
  {
    id: "shadow_m",
    label: "Shadow M",
    sub: "Dark side approach",
    image: require("../../assets/images/car_shadow_m.png"),
  },
  {
    id: "night_exit",
    label: "Night Exit",
    sub: "Midnight departure",
    image: require("../../assets/images/car_night_exit.png"),
  },
];

function chunkPairs<T>(arr: T[]): T[][] {
  const pairs: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) {
    pairs.push(arr.slice(i, i + 2));
  }
  return pairs;
}

export default function ThemesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const GAP = 12;
  const H_PAD = 16;
  const CARD_W = (width - H_PAD * 2 - GAP) / 2;
  const { selectMode, currentTheme } = useLocalSearchParams<{
    selectMode?: string;
    currentTheme?: string;
  }>();
  const { settings, updateSettings } = useAlarms();

  const [selected, setSelected] = useState<Theme>(
    (currentTheme as Theme) ?? settings.defaultTheme
  );

  const goBack = () => router.canGoBack() ? router.back() : router.replace("/");

  const handleSelect = async (id: Theme) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setSelected(id);
    selectionStore.pendingTheme = id;
    updateSettings({ defaultTheme: id });
    if (selectMode === "1") {
      goBack();
    }
  };

  const pairs = chunkPairs(THEMES);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom header */}
      <View style={[styles.headerRow, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 8, backgroundColor: colors.background }]}>
        <Pressable onPress={goBack} style={[styles.backBtn, { backgroundColor: "rgba(61,142,255,0.08)" }]}>
          <ChevronLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Themes</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: H_PAD,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 24,
        }}
      >
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Choose your alarm visual experience
        </Text>

        {pairs.map((pair, rowIdx) => (
          <View key={rowIdx} style={[styles.row, { gap: GAP, marginBottom: GAP }]}>
            {pair.map((theme) => {
              const isSelected = selected === theme.id;
              return (
                <Pressable key={theme.id} onPress={() => handleSelect(theme.id)} style={{ width: CARD_W }}>
                  <GlassCard
                    style={[
                      styles.themeCard,
                      { width: CARD_W },
                      isSelected && { borderColor: "rgba(61,142,255,0.55)" },
                    ]}
                    borderRadius={20}
                  >
                    <Image
                      source={theme.image}
                      style={{ width: CARD_W, height: CARD_W * 1.35 }}
                      contentFit="cover"
                      contentPosition="center"
                    />
                    <View style={styles.themeInfo}>
                      <View style={styles.themeRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.themeLabel, { color: colors.text }]}>
                            {theme.label}
                          </Text>
                          <Text style={[styles.themeSub, { color: colors.mutedForeground }]}>
                            {theme.sub}
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                            <Check size={14} color="#fff" />
                          </View>
                        )}
                      </View>
                    </View>
                  </GlassCard>
                </Pressable>
              );
            })}
          </View>
        ))}

        <GlassCard style={styles.hint} borderRadius={16}>
          <Info size={16} color={colors.primary} />
          <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
            Tap a theme to select it. Use the preview button on your alarm to see
            the full ring experience.
          </Text>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    letterSpacing: -0.3,
  },
  row: { flexDirection: "row" },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  themeCard: {
    overflow: "hidden",
  },
  themeInfo: {
    padding: 10,
  },
  themeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  themeLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  themeSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    marginTop: 20,
  },
  hintText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
});
