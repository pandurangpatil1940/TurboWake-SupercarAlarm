import { ChevronLeft, Pause, Play } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "../../components/GlassCard";
import { useAlarms } from "../../context/AlarmContext";
import { useColors } from "../../hooks/useColors";
import { useScale } from "../../hooks/useScale";
import { selectionStore } from "../../services/selectionStore";
import { soundService, SOUND_NAMES } from "../../services/soundService";

const SOUNDS = Array.from({ length: 19 }, (_, i) => i + 1);

const goBack = () => router.canGoBack() ? router.back() : router.replace("/");

export default function SoundsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { ms } = useScale();
  const { selectMode, currentId } = useLocalSearchParams<{
    selectMode?: string;
    currentId?: string;
  }>();
  const { settings, updateSettings } = useAlarms();

  const [playing, setPlaying] = useState<number | null>(null);
  const [selected, setSelected] = useState<number>(
    parseInt(currentId ?? "0") || settings.defaultSoundId
  );
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressRef = useRef(0);

  useEffect(() => {
    return () => {
      soundService.stopSound();
    };
  }, []);

  const handlePreview = useCallback(
    async (id: number) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      if (playing === id) {
        await soundService.stopSound();
        setPlaying(null);
        progressAnim.setValue(0);
      } else {
        progressAnim.setValue(0);
        progressRef.current = 0;
        setPlaying(id);
        await soundService.playSound(
          id,
          false,
          false,
          () => {
            setPlaying((p) => (p === id ? null : p));
            progressAnim.setValue(0);
          },
          (position, duration) => {
            const ratio = duration > 0 ? position / duration : 0;
            progressRef.current = ratio;
            progressAnim.setValue(ratio);
          },
        );
      }
    },
    [playing]
  );

  const handleSelect = async (id: number) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    setSelected(id);
    selectionStore.pendingSoundId = id;
    updateSettings({ defaultSoundId: id });
    if (selectMode === "1") {
      await soundService.stopSound();
      goBack();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom header */}
      <View style={[styles.headerRow, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 8, backgroundColor: colors.background }]}>
        <Pressable onPress={goBack} style={[styles.backBtn, { backgroundColor: "rgba(61,142,255,0.08)" }]}>
          <ChevronLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Sounds</Text>
        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={SOUNDS}
        keyExtractor={(item) => item.toString()}
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom:
              insets.bottom + (Platform.OS === "web" ? 34 : 0) + 24,
          },
        ]}
        renderItem={({ item: id }) => {
          const isSelected = selected === id;
          const isPlaying = playing === id;

          return (
            <GlassCard
              style={[
                styles.card,
                isSelected && {
                  borderColor: "rgba(61,142,255,0.50)",
                },
              ]}
              borderRadius={18}
            >
              <Pressable
                style={styles.row}
                onPress={() => handleSelect(id)}
                android_ripple={{ color: "rgba(61,142,255,0.1)" }}
              >
                <View
                  style={[
                    styles.num,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : "rgba(61,142,255,0.10)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.numText,
                      { color: isSelected ? "#fff" : colors.primary, fontSize: ms(14) },
                    ]}
                  >
                    {id}
                  </Text>
                </View>

                <View style={styles.info}>
                  <Text style={[styles.soundName, { color: colors.text, fontSize: ms(15) }]}>
                    {SOUND_NAMES[id]}
                  </Text>
                  {isSelected && !isPlaying && (
                    <Text
                      style={[
                        styles.selectedLabel,
                        { color: colors.primary, fontSize: ms(12) },
                      ]}
                    >
                      Selected
                    </Text>
                  )}
                </View>

                <Pressable
                  style={[
                    styles.playBtn,
                    {
                      backgroundColor: isPlaying
                        ? "rgba(155,93,229,0.15)"
                        : "rgba(61,142,255,0.10)",
                    },
                  ]}
                  onPress={() => handlePreview(id)}
                  hitSlop={8}
                >
                  {isPlaying
                    ? <Pause size={ms(18)} color={colors.accent} />
                    : <Play size={ms(18)} color={colors.primary} />}
                </Pressable>
              </Pressable>

              {isPlaying && (
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: colors.accent,
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0%", "100%"],
                          extrapolate: "clamp",
                        }),
                      },
                    ]}
                  />
                </View>
              )}
            </GlassCard>
          );
        }}
      />
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
  screenTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    letterSpacing: -0.3,
  },
  list: { padding: 16, gap: 10 },
  card: {},
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  num: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  numText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  info: { flex: 1, gap: 2 },
  soundName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  selectedLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    height: 3,
    backgroundColor: "rgba(155,93,229,0.15)",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
});
