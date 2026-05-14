import { ChevronLeft, Flag, Pause, Play, RotateCcw } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "../../components/GlassCard";
import { useAppearance } from "../../hooks/useAppearance";
import { useColors } from "../../hooks/useColors";
import { useScale } from "../../hooks/useScale";

interface LapEntry {
  index: number;
  split: number;
  total: number;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatCs(cs: number) {
  const mins = Math.floor(cs / 6000);
  const secs = Math.floor((cs % 6000) / 100);
  const cents = cs % 100;
  return { mins: pad2(mins), secs: pad2(secs), cents: pad2(cents) };
}

export default function StopwatchScreen() {
  const colors = useColors();
  const scheme = useAppearance();
  const isDark = scheme === "dark";
  const insets = useSafeAreaInsets();
  const { ms, s } = useScale();

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<LapEntry[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);
  const baseRef = useRef(0);

  const haptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style).catch(() => {});
    }
  };

  const start = useCallback(() => {
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      setElapsed(baseRef.current + Math.floor((Date.now() - startRef.current) / 10));
    }, 16);
    setRunning(true);
    haptic(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    baseRef.current = elapsed;
    setRunning(false);
    haptic(Haptics.ImpactFeedbackStyle.Medium);
  }, [elapsed]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setElapsed(0);
    setLaps([]);
    baseRef.current = 0;
    haptic(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const lap = useCallback(() => {
    const lastTotal = laps.length > 0 ? laps[laps.length - 1].total : 0;
    setLaps((prev) => [
      { index: prev.length + 1, split: elapsed - lastTotal, total: elapsed },
      ...prev,
    ]);
    haptic(Haptics.ImpactFeedbackStyle.Light);
  }, [elapsed, laps]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const { mins, secs, cents } = formatCs(elapsed);
  const hasStarted = elapsed > 0;

  const bestLapIdx = laps.length >= 2
    ? laps.reduce((best, l, i) => (l.split < laps[best].split ? i : best), 0)
    : -1;
  const worstLapIdx = laps.length >= 2
    ? laps.reduce((worst, l, i) => (l.split > laps[worst].split ? i : worst), 0)
    : -1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={colors.gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={[styles.blob, { top: -80, right: -80, backgroundColor: colors.blobBlue, width: 240, height: 240, borderRadius: 120 }]} />
      <View style={[styles.blob, { bottom: 100, left: -80, backgroundColor: colors.blobPurple, width: 220, height: 220, borderRadius: 110 }]} />

      <View style={[styles.inner, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 8, paddingBottom: insets.bottom + 16 }]}>
        {/* Custom header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/")} style={[styles.backBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(61,142,255,0.08)" }]}>
            <ChevronLeft size={20} color={colors.text} />
          </Pressable>
          <Text style={[styles.screenTitle, { color: colors.text, fontSize: ms(17) }]}>Stopwatch</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Time display */}
        <GlassCard style={styles.timeCard} borderRadius={28} intensity={70}>
          <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>ELAPSED</Text>
          <View style={styles.timeRow}>
            <Text style={[styles.timeMain, { color: colors.text, fontSize: ms(58) }]}>{mins}:{secs}</Text>
            <Text style={[styles.timeCents, { color: colors.primary, fontSize: ms(32) }]}>.{cents}</Text>
          </View>
          {laps.length > 0 && (
            <View style={[styles.lapIndicator, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(61,142,255,0.06)" }]}>
              <Flag size={12} color={colors.mutedForeground} />
              <Text style={[styles.lapIndicatorText, { color: colors.mutedForeground }]}>
                {laps.length} lap{laps.length !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Control buttons */}
        <View style={styles.btnRow}>
          <Pressable
            onPress={running ? lap : reset}
            style={[
              styles.circleBtn,
              {
                width: s(100),
                height: s(100),
                borderRadius: s(50),
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.10)"
                  : "rgba(61,142,255,0.10)",
                borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(61,142,255,0.2)",
              },
            ]}
          >
            {running ? <Flag size={ms(18)} color={colors.mutedForeground} /> : <RotateCcw size={ms(18)} color={colors.mutedForeground} />}
            <Text style={[styles.circleBtnText, { color: colors.text, fontSize: ms(13) }]}>
              {running ? "Lap" : "Reset"}
            </Text>
          </Pressable>

          <Pressable
            onPress={running ? stop : start}
            style={[
              styles.circleBtn,
              styles.circleBtnPrimary,
              {
                width: s(100),
                height: s(100),
                borderRadius: s(50),
                backgroundColor: running ? "rgba(255,70,70,0.18)" : colors.primary,
                borderColor: running ? "rgba(255,70,70,0.35)" : colors.primary,
              },
            ]}
          >
            {running ? <Pause size={ms(20)} color="#FF5252" /> : <Play size={ms(20)} color="#fff" />}
            <Text style={[styles.circleBtnText, { color: running ? "#FF5252" : "#fff", fontFamily: "Inter_700Bold", fontSize: ms(13) }]}>
              {running ? "Stop" : hasStarted ? "Resume" : "Start"}
            </Text>
          </Pressable>
        </View>

        {/* Laps list */}
        {laps.length > 0 && (
          <GlassCard style={styles.lapsList} borderRadius={20}>
            <View style={[styles.lapsHeader, { borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]}>
              <Text style={[styles.lapsHeaderText, { color: colors.mutedForeground }]}>Lap</Text>
              <Text style={[styles.lapsHeaderText, { color: colors.mutedForeground }]}>Split</Text>
              <Text style={[styles.lapsHeaderText, { color: colors.mutedForeground }]}>Total</Text>
            </View>
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              {laps.map((lap, i) => {
                const isBest = i === bestLapIdx;
                const isWorst = i === worstLapIdx;
                const f = formatCs(lap.split);
                const ft = formatCs(lap.total);
                const accentColor = isBest ? "#22C55E" : isWorst ? "#EF4444" : colors.text;
                return (
                  <View
                    key={lap.index}
                    style={[
                      styles.lapRow,
                      i < laps.length - 1 && { borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", borderBottomWidth: 1 },
                    ]}
                  >
                    <Text style={[styles.lapNum, { color: accentColor, fontSize: ms(13) }]}>Lap {lap.index}</Text>
                    <Text style={[styles.lapTime, { color: accentColor, fontSize: ms(13) }]}>
                      {f.mins}:{f.secs}.{f.cents}
                    </Text>
                    <Text style={[styles.lapTotal, { color: colors.mutedForeground, fontSize: ms(12) }]}>
                      {ft.mins}:{ft.secs}.{ft.cents}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </GlassCard>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  blob: { position: "absolute", opacity: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
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
  timeCard: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 10,
  },
  timeLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  timeMain: {
    fontFamily: "Inter_700Bold",
    fontSize: 64,
    letterSpacing: -2,
    lineHeight: 72,
  },
  timeCents: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    letterSpacing: -1,
    lineHeight: 52,
    marginLeft: 2,
  },
  lapIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  lapIndicatorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 40,
    alignItems: "center",
  },
  circleBtn: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
  },
  circleBtnPrimary: {
    elevation: 8,
  },
  circleBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  lapsList: {
    flex: 1,
  },
  lapsHeader: {
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  lapsHeaderText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    flex: 1,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  lapRow: {
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: "center",
  },
  lapNum: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  lapTime: {
    flex: 1,
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    letterSpacing: -0.5,
  },
  lapTotal: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "right",
  },
});
