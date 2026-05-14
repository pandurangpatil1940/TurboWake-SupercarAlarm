import { Bell, ChevronLeft, ChevronRight, Play, StopCircle, Volume2, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScale } from "../../hooks/useScale";
import { GlassCard } from "../../components/GlassCard";
import { useAlarms } from "../../context/AlarmContext";
import { useAppearance } from "../../hooks/useAppearance";
import { useColors } from "../../hooks/useColors";
import { soundService, SOUND_NAMES } from "../../services/soundService";

const VISIBLE = 5;
function getItemH(width: number) {
  return Math.round(Math.max(44, Math.min(60, width * 0.144)));
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function buildList(n: number) {
  return Array.from({ length: n }, (_, i) => pad2(i));
}

const HOURS = buildList(24);
const MINUTES = buildList(60);
const SECONDS = buildList(60);

interface ColumnProps {
  items: string[];
  selectedIndex: number;
  onChange: (i: number) => void;
  textColor: string;
  colWidth?: number;
}

function DrumColumn({ items, selectedIndex, onChange, textColor, colWidth = 80 }: ColumnProps) {
  const { width } = useWindowDimensions();
  const ITEM_H = getItemH(width);
  const PICKER_H = ITEM_H * VISIBLE;
  const ref = useRef<ScrollView>(null);
  const [visualIndex, setVisualIndex] = useState(selectedIndex);
  const lastHapticIdx = useRef(selectedIndex);
  const webSnapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrolling = useRef(false);

  const scrollToIdx = useCallback((idx: number, animated = false) => {
    ref.current?.scrollTo({ y: idx * ITEM_H, animated });
  }, [ITEM_H]);

  useEffect(() => {
    const delay = Platform.OS === "web" ? 220 : 80;
    const t = setTimeout(() => scrollToIdx(selectedIndex), delay);
    return () => clearTimeout(t);
  }, []);

  // Only sync external selectedIndex when the column is not being actively scrolled
  useEffect(() => {
    if (!isScrolling.current) setVisualIndex(selectedIndex);
  }, [selectedIndex]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      isScrolling.current = true;
      const raw = e.nativeEvent.contentOffset.y;
      const idx = Math.max(0, Math.min(items.length - 1, Math.round(raw / ITEM_H)));
      if (idx !== lastHapticIdx.current) {
        lastHapticIdx.current = idx;
        setVisualIndex(idx);
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
      }
      if (Platform.OS === "web") {
        if (webSnapTimer.current) clearTimeout(webSnapTimer.current);
        webSnapTimer.current = setTimeout(() => {
          scrollToIdx(idx);
          onChange(idx);
        }, 120);
      }
    },
    [items.length, ITEM_H, onChange, scrollToIdx]
  );

  // Called only when scroll fully settles — do NOT call scrollTo here,
  // snapToInterval already handled snapping natively.
  const commitSnap = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      isScrolling.current = false;
      const raw = e.nativeEvent.contentOffset.y;
      const idx = Math.max(0, Math.min(items.length - 1, Math.round(raw / ITEM_H)));
      setVisualIndex(idx);
      lastHapticIdx.current = idx;
      onChange(idx);
    },
    [items.length, ITEM_H, onChange]
  );

  const pressItem = (i: number) => {
    if (webSnapTimer.current) clearTimeout(webSnapTimer.current);
    scrollToIdx(i, true);
    setVisualIndex(i);
    lastHapticIdx.current = i;
    onChange(i);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
  };

  return (
    <View style={{ width: colWidth, height: PICKER_H, overflow: "hidden" }}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate={Platform.OS === "ios" ? 0.994 : "fast"}
        scrollEventThrottle={32}
        contentContainerStyle={{ paddingVertical: ITEM_H * Math.floor(VISIBLE / 2) }}
        onScroll={handleScroll}
        onMomentumScrollEnd={commitSnap}
        onScrollEndDrag={commitSnap}
      >
        {items.map((val, i) => {
          const dist = Math.abs(i - visualIndex);
          return (
            <Pressable key={i} onPress={() => pressItem(i)} style={{ height: ITEM_H, alignItems: "center", justifyContent: "center" }}>
              <Text
                style={{
                  fontFamily: dist === 0 ? "Inter_700Bold" : "Inter_400Regular",
                  fontSize: dist === 0 ? 32 : dist === 1 ? 22 : 16,
                  color: textColor,
                  opacity: dist === 0 ? 1 : dist === 1 ? 0.4 : 0.15,
                  letterSpacing: dist === 0 ? -1 : 0,
                }}
              >
                {val}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

type Phase = "idle" | "running" | "done";

export default function TimerScreen() {
  const colors = useColors();
  const scheme = useAppearance();
  const isDark = scheme === "dark";
  const insets = useSafeAreaInsets();
  const { ms, width } = useScale();
  const ITEM_H = getItemH(width);
  const colW = Math.round(width * 0.18);
  const { settings } = useAlarms();

  const [hours, setHours] = useState(0);
  const [mins, setMins] = useState(0);
  const [secs, setSecs] = useState(30);
  const [phase, setPhase] = useState<Phase>("idle");
  const [remaining, setRemaining] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef(0);

  const totalSeconds = hours * 3600 + mins * 60 + secs;

  const haptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== "web") Haptics.impactAsync(style).catch(() => {});
  };

  const soundFiredRef = useRef(false);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startTimer = () => {
    if (totalSeconds === 0) return;
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    soundFiredRef.current = false;
    const endAt = Date.now() + totalSeconds * 1000;
    endTimeRef.current = endAt;
    setRemaining(totalSeconds);
    setPhase("running");
    intervalRef.current = setInterval(() => {
      const left = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0 && !soundFiredRef.current) {
        soundFiredRef.current = true;
        clearTimer();
        setPhase("done");
        soundService.playSound(settings.defaultSoundId, true, false).catch(() => {});
        haptic(Haptics.ImpactFeedbackStyle.Heavy);
      }
    }, 200);
  };

  const cancelTimer = () => {
    clearTimer();
    soundService.stopSound();
    setPhase("idle");
    setRemaining(0);
    haptic(Haptics.ImpactFeedbackStyle.Medium);
  };

  useEffect(() => () => { clearTimer(); soundService.stopSound(); }, []);

  const rh = Math.floor(remaining / 3600);
  const rm = Math.floor((remaining % 3600) / 60);
  const rs = remaining % 60;

  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const textColor = colors.text;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={colors.gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={[styles.blob, { top: -80, right: -80, backgroundColor: colors.blobBlue, width: 220, height: 220, borderRadius: 110 }]} />
      <View style={[styles.blob, { bottom: 60, left: -80, backgroundColor: colors.blobPurple, width: 240, height: 240, borderRadius: 120 }]} />

      {/* Header — in normal flow so back button is always tappable */}
      <View style={[styles.headerRow, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 8 }]}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/")} style={[styles.backBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(61,142,255,0.08)" }]}>
          <ChevronLeft size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.screenTitle, { color: colors.text, fontSize: ms(17) }]}>Timer</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={[styles.inner, { paddingBottom: insets.bottom + 20 }]}>
        {phase === "idle" && (
          <>
            {/* Picker */}
            <GlassCard style={styles.pickerCard} borderRadius={28} intensity={70}>
              <Text style={[styles.pickerTitle, { color: colors.mutedForeground }]}>SET TIMER</Text>

              {/* Drum row container — selBand is positioned relative to this, not the whole card */}
              <View style={styles.drumContainer}>
                {/* Selection band — aligned to center item of the drum columns */}
                <View
                  pointerEvents="none"
                  style={[
                    styles.selBand,
                    {
                      top: ITEM_H * Math.floor(VISIBLE / 2),
                      height: ITEM_H,
                      backgroundColor: isDark ? "rgba(61,142,255,0.12)" : "rgba(61,142,255,0.10)",
                      borderColor: colors.primary + "44",
                    },
                  ]}
                />
                <View style={styles.pickerRow}>
                  <DrumColumn items={HOURS} selectedIndex={hours} onChange={setHours} textColor={textColor} colWidth={colW} />
                  <Text style={[styles.colonLabel, { color: colors.mutedForeground, fontSize: ms(14) }]}>h</Text>
                  <DrumColumn items={MINUTES} selectedIndex={mins} onChange={setMins} textColor={textColor} colWidth={colW} />
                  <Text style={[styles.colonLabel, { color: colors.mutedForeground, fontSize: ms(14) }]}>m</Text>
                  <DrumColumn items={SECONDS} selectedIndex={secs} onChange={setSecs} textColor={textColor} colWidth={colW} />
                  <Text style={[styles.colonLabel, { color: colors.mutedForeground, fontSize: ms(14) }]}>s</Text>
                </View>
              </View>
            </GlassCard>

            {/* Sound selector — tappable to change */}
            <Pressable
              onPress={() => router.push({ pathname: "/sounds", params: { selectMode: "1", currentId: String(settings.defaultSoundId) } })}
            >
              <GlassCard style={styles.soundRow} borderRadius={16}>
                <Volume2 size={16} color={colors.primary} />
                <Text style={[styles.soundLabel, { color: colors.text }]}>When Timer Ends</Text>
                <Text style={[styles.soundName, { color: colors.primary }]}>
                  {SOUND_NAMES[settings.defaultSoundId] ?? "Engine Sound"}
                </Text>
                <ChevronRight size={14} color={colors.mutedForeground} />
              </GlassCard>
            </Pressable>

            {/* Start button */}
            <Pressable
              onPress={startTimer}
              style={[
                styles.startBtn,
                {
                  backgroundColor: totalSeconds === 0 ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(61,142,255,0.12)") : colors.primary,
                  opacity: totalSeconds === 0 ? 0.5 : 1,
                },
              ]}
            >
              <Play size={20} color={totalSeconds === 0 ? colors.mutedForeground : "#fff"} />
              <Text style={[styles.startBtnText, { color: totalSeconds === 0 ? colors.mutedForeground : "#fff" }]}>
                Start Timer
              </Text>
            </Pressable>
          </>
        )}

        {phase === "running" && (
          <>
            <GlassCard style={styles.countdownCard} borderRadius={28} intensity={70}>
              <Text style={[styles.countdownLabel, { color: colors.mutedForeground }]}>TIME REMAINING</Text>
              <Text style={[styles.countdownText, { color: colors.text, fontSize: ms(66) }]}>
                {pad2(rh)}:{pad2(rm)}:{pad2(rs)}
              </Text>

              <View style={[styles.progressTrack, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(61,142,255,0.08)" }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.round(progress * 100)}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressPct, { color: colors.mutedForeground }]}>
                {Math.round(progress * 100)}% remaining
              </Text>
            </GlassCard>

            <Pressable onPress={cancelTimer} style={[styles.cancelBtn, { borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(61,142,255,0.2)" }]}>
              <X size={18} color={colors.mutedForeground} />
              <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel Timer</Text>
            </Pressable>
          </>
        )}

        {phase === "done" && (
          <>
            <GlassCard style={styles.doneCard} borderRadius={28} intensity={70}>
              <View style={[styles.doneIcon, { backgroundColor: "rgba(61,142,255,0.15)" }]}>
                <Bell size={36} color={colors.primary} />
              </View>
              <Text style={[styles.doneTitle, { color: colors.text }]}>Time's Up!</Text>
              <Text style={[styles.doneSubtitle, { color: colors.mutedForeground }]}>
                {SOUND_NAMES[settings.defaultSoundId]} is playing
              </Text>
            </GlassCard>

            <Pressable
              onPress={cancelTimer}
              style={[styles.startBtn, { backgroundColor: colors.primary }]}
            >
              <StopCircle size={20} color="#fff" />
              <Text style={[styles.startBtnText, { color: "#fff" }]}>Stop & Reset</Text>
            </Pressable>
          </>
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
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
    zIndex: 10,
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
  pickerCard: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 0,
  },
  pickerTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  drumContainer: {
    position: "relative",
    alignItems: "center",
  },
  selBand: {
    position: "absolute",
    left: 0,
    right: 0,
    borderRadius: 14,
    borderWidth: 1,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  colonLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    width: 18,
    textAlign: "center",
  },
  soundRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  soundLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    flex: 1,
  },
  soundName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 18,
    elevation: 6,
  },
  startBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  countdownCard: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 16,
  },
  countdownLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  countdownText: {
    fontFamily: "Inter_700Bold",
    fontSize: 72,
    letterSpacing: -3,
    lineHeight: 80,
  },
  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  progressPct: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: -4,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  cancelBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  doneCard: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 14,
  },
  doneIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  doneTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    letterSpacing: -1,
  },
  doneSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
});
