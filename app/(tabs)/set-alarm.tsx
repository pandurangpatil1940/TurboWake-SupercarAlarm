import { Check, ChevronDown, ChevronRight, Minus, Plus, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScale } from "../../hooks/useScale";
import { GlassCard } from "../../components/GlassCard";
import type { RepeatDay, Theme } from "../../context/AlarmContext";
import { useAlarms } from "../../context/AlarmContext";
import { useToast } from "../../context/ToastContext";
import { useColors } from "../../hooks/useColors";
import { cancelAlarm, scheduleAlarm } from "../../services/alarmScheduler";
import { selectionStore } from "../../services/selectionStore";
import { SOUND_NAMES } from "../../services/soundService";

// ─── Drum Roll constants ────────────────────────────────────────────────────
const VISIBLE = 5;
function getItemH(width: number) {
  return Math.round(Math.max(44, Math.min(62, width * 0.144)));
}
const DAYS: RepeatDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const AMPM = ["AM", "PM"];

// ─── Drum Roll Column ───────────────────────────────────────────────────────
interface DrumRollProps {
  items: string[];
  selectedIndex: number;
  onChange: (i: number) => void;
  colWidth?: number;
  bigSize?: number;
  textColor?: string;
}

function DrumRollColumn({
  items,
  selectedIndex,
  onChange,
  colWidth = 78,
  bigSize = 36,
  textColor = "#0F1B35",
}: DrumRollProps) {
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
        scrollEventThrottle={16}
        nestedScrollEnabled
        contentContainerStyle={{ paddingVertical: ITEM_H * Math.floor(VISIBLE / 2) }}
        onScroll={handleScroll}
        onMomentumScrollEnd={commitSnap}
        onScrollEndDrag={commitSnap}
      >
        {items.map((val, i) => {
          const dist = Math.abs(i - visualIndex);
          return (
            <Pressable
              key={`${val}-${i}`}
              onPress={() => pressItem(i)}
              style={{ height: ITEM_H, alignItems: "center", justifyContent: "center" }}
            >
              <Text
                style={{
                  fontFamily: dist === 0 ? "Inter_700Bold" : "Inter_400Regular",
                  fontSize:
                    dist === 0 ? bigSize : dist === 1 ? bigSize * 0.7 : bigSize * 0.52,
                  color: textColor,
                  opacity: dist === 0 ? 1 : dist === 1 ? 0.42 : 0.18,
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

// ─── Helpers ────────────────────────────────────────────────────────────────
function repeatLabel(repeat: RepeatDay[]): string {
  if (!repeat || repeat.length === 0) return "Never";
  if (repeat.length === 7) return "Every day";
  if (repeat.length === 5 && !repeat.includes("Sat") && !repeat.includes("Sun"))
    return "Weekdays";
  if (repeat.length === 2 && repeat.includes("Sat") && repeat.includes("Sun"))
    return "Weekends";
  if (repeat.length === 1) return `Every ${repeat[0]}`;
  return repeat.join(", ");
}

// ─── Main screen ────────────────────────────────────────────────────────────
export default function SetAlarmScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width, ms } = useScale();
  const ITEM_H = getItemH(width);
  const colW = Math.round(width * 0.21);
  const bigSz = Math.round(ms(34));
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { alarms, addAlarm, updateAlarm, settings } = useAlarms();
  const { showToast } = useToast();

  const existing = id ? alarms.find((a) => a.id === id) : null;

  const [hour, setHour] = useState(existing?.hour ?? 7);
  const [minute, setMinute] = useState(existing?.minute ?? 0);
  const [ampm, setAmpm] = useState<"AM" | "PM">(existing?.ampm ?? "AM");
  const [label, setLabel] = useState(existing?.label ?? "");
  const [repeat, setRepeat] = useState<RepeatDay[]>(existing?.repeat ?? []);
  const [snoozeOn, setSnoozeOn] = useState(true);
  const [snooze, setSnooze] = useState(
    existing?.snoozeMinutes ?? settings.defaultSnooze
  );
  const [soundId, setSoundId] = useState(
    existing?.soundId ?? settings.defaultSoundId
  );
  const [theme, setTheme] = useState<Theme>(
    existing?.theme ?? settings.defaultTheme
  );
  const [vibration, setVibration] = useState(
    existing?.vibration ?? settings.defaultVibration
  );
  const [showDays, setShowDays] = useState(false);

  // Sync sound/theme after returning from sub-screens using synchronous store
  useFocusEffect(
    useCallback(() => {
      if (selectionStore.pendingSoundId !== null) {
        setSoundId(selectionStore.pendingSoundId);
        selectionStore.pendingSoundId = null;
      }
      if (selectionStore.pendingTheme !== null) {
        setTheme(selectionStore.pendingTheme as Theme);
        selectionStore.pendingTheme = null;
      }
    }, [])
  );

  const toggleDay = (day: RepeatDay) => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    setRepeat((p) => (p.includes(day) ? p.filter((d) => d !== day) : [...p, day]));
  };

  const buildCountdownMsg = (h: number, m: number, ap: "AM" | "PM", rep: RepeatDay[]): string => {
    const DAY_IDX = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    let h24 = h;
    if (ap === "PM" && h !== 12) h24 += 12;
    if (ap === "AM" && h === 12) h24 = 0;
    const alarmMin = h24 * 60 + m;

    let diff: number;
    if (rep.length === 0) {
      diff = alarmMin > nowMin ? alarmMin - nowMin : 24 * 60 - nowMin + alarmMin;
    } else {
      diff = 0;
      let found = false;
      for (let d = 0; d <= 7; d++) {
        const dayName = DAY_IDX[(now.getDay() + d) % 7] as RepeatDay;
        if (!rep.includes(dayName)) continue;
        if (d === 0 && alarmMin <= nowMin) continue;
        diff = d * 24 * 60 + alarmMin - nowMin;
        found = true;
        break;
      }
      if (!found) return "";
    }

    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hrs === 0) return `Alarm will go off in ${mins}m`;
    if (mins === 0) return `Alarm will go off in ${hrs}h`;
    return `Alarm will go off in ${hrs}h ${mins}m`;
  };

  const handleSave = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );
    }
    const data = {
      hour,
      minute,
      ampm,
      label,
      enabled: true,
      repeat,
      snoozeMinutes: snoozeOn ? snooze : 0,
      soundId,
      theme,
      vibration,
    };
    if (existing) {
      const updated = { ...data, id: existing.id };
      updateAlarm(updated);
      await cancelAlarm(existing.id);
      await scheduleAlarm(updated);
    } else {
      const newAlarm = {
        ...data,
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      };
      addAlarm(data);
      await scheduleAlarm(newAlarm);
    }

    const msg = buildCountdownMsg(hour, minute, ampm, repeat);
    if (msg) showToast(msg);

    router.canGoBack() ? router.back() : router.replace("/");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Hide the default stack header — we provide our own */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Custom header ── */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 6 },
        ]}
      >
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/")} style={styles.headerCircle}>
          <X size={18} color={colors.text} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {existing ? "Edit Alarm" : "Add Alarm"}
        </Text>

        <Pressable
          onPress={handleSave}
          style={[styles.headerCircle, { backgroundColor: colors.primary }]}
        >
          <Check size={18} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom:
              insets.bottom + (Platform.OS === "web" ? 34 : 0) + 40,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {/* ── Drum Roll Picker ── */}
        <GlassCard style={styles.pickerCard} borderRadius={24}>
          {/* Centered selection band */}
          <View
            style={[
              styles.selBand,
              {
                top: ITEM_H * Math.floor(VISIBLE / 2),
                height: ITEM_H,
                backgroundColor: "rgba(61,142,255,0.09)",
              },
            ]}
            pointerEvents="none"
          />
          <View style={styles.pickerRow}>
            <DrumRollColumn
              items={HOURS}
              selectedIndex={hour - 1}
              onChange={(i) => setHour(i + 1)}
              colWidth={colW}
              bigSize={bigSz}
              textColor={colors.text}
            />
            <Text style={[styles.colon, { color: colors.text, fontSize: ms(30) }]}>:</Text>
            <DrumRollColumn
              items={MINUTES}
              selectedIndex={minute}
              onChange={setMinute}
              colWidth={colW}
              bigSize={bigSz}
              textColor={colors.text}
            />
            <DrumRollColumn
              items={AMPM}
              selectedIndex={ampm === "AM" ? 0 : 1}
              onChange={(i) => setAmpm(i === 0 ? "AM" : "PM")}
              colWidth={Math.round(colW * 0.75)}
              bigSize={Math.round(bigSz * 0.62)}
              textColor={colors.text}
            />
          </View>
        </GlassCard>

        {/* ── Settings rows ── */}
        <GlassCard style={styles.settingsCard} borderRadius={24}>
          {/* Repeat */}
          <Pressable
            style={styles.row}
            onPress={() => setShowDays((v) => !v)}
          >
            <Text style={[styles.rowLabel, { color: colors.text }]}>Repeat</Text>
            <View style={styles.rowRight}>
              <Text style={[styles.rowVal, { color: colors.primary }]}>
                {repeatLabel(repeat)}
              </Text>
              {showDays
                ? <ChevronDown size={15} color={colors.mutedForeground} />
                : <ChevronRight size={15} color={colors.mutedForeground} />}
            </View>
          </Pressable>

          {showDays && (
            <View style={styles.daysWrap}>
              {DAYS.map((d) => (
                <Pressable
                  key={d}
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor: repeat.includes(d)
                        ? colors.primary
                        : "rgba(61,142,255,0.09)",
                    },
                  ]}
                  onPress={() => toggleDay(d)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: repeat.includes(d) ? "#fff" : colors.mutedForeground,
                      },
                    ]}
                  >
                    {d[0]}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={[styles.div, { backgroundColor: colors.border }]} />

          {/* Label */}
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Label</Text>
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="Add label"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.labelInput, { color: colors.primary }]}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              blurOnSubmit
            />
          </View>

          <View style={[styles.div, { backgroundColor: colors.border }]} />

          {/* Sound */}
          <Pressable
            style={styles.row}
            onPress={() =>
              router.push({
                pathname: "/sounds",
                params: { selectMode: "1", currentId: soundId },
              })
            }
          >
            <Text style={[styles.rowLabel, { color: colors.text }]}>Sound</Text>
            <View style={styles.rowRight}>
              <Text style={[styles.rowVal, { color: colors.primary }]}>
                {SOUND_NAMES[soundId] ?? `Sound ${soundId}`}
              </Text>
              <ChevronRight size={15} color={colors.mutedForeground} />
            </View>
          </Pressable>

          <View style={[styles.div, { backgroundColor: colors.border }]} />

          {/* Theme */}
          <Pressable
            style={styles.row}
            onPress={() =>
              router.push({
                pathname: "/themes",
                params: { selectMode: "1", currentTheme: theme },
              })
            }
          >
            <Text style={[styles.rowLabel, { color: colors.text }]}>Theme</Text>
            <View style={styles.rowRight}>
              <Text style={[styles.rowVal, { color: colors.primary }]}>
                {({
                  blue_storm: "Blue Storm",
                  violet_exhaust: "Violet Exhaust",
                  dark_knight: "Dark Knight",
                  red_inferno: "Red Inferno",
                  m_power: "M Power",
                  m_drift: "M Drift",
                  shadow_m: "Shadow M",
                  night_exit: "Night Exit",
                } as Record<string, string>)[theme] ?? "Blue Storm"}
              </Text>
              <ChevronRight size={15} color={colors.mutedForeground} />
            </View>
          </Pressable>

          <View style={[styles.div, { backgroundColor: colors.border }]} />

          {/* Snooze toggle */}
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Snooze</Text>
            <Switch
              value={snoozeOn}
              onValueChange={setSnoozeOn}
              trackColor={{
                false: "rgba(107,122,154,0.2)",
                true: "rgba(61,142,255,0.4)",
              }}
              thumbColor={snoozeOn ? colors.primary : "#fff"}
            />
          </View>

          {snoozeOn && (
            <>
              <View style={[styles.div, { backgroundColor: colors.border }]} />
              {/* Snooze duration */}
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>
                  Snooze Duration
                </Text>
                <View style={styles.stepper}>
                  <Pressable
                    onPress={() => setSnooze((s) => Math.max(1, s - 1))}
                    style={styles.stepBtn}
                  >
                    <Minus size={13} color={colors.primary} />
                  </Pressable>
                  <Text style={[styles.stepVal, { color: colors.primary }]}>
                    {snooze} min
                  </Text>
                  <Pressable
                    onPress={() => setSnooze((s) => Math.min(30, s + 1))}
                    style={styles.stepBtn}
                  >
                    <Plus size={13} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(107,122,154,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    letterSpacing: -0.3,
  },

  // Picker
  scroll: { padding: 16, gap: 14 },
  pickerCard: { overflow: "hidden" },
  selBand: {
    position: "absolute",
    left: 12,
    right: 12,
    height: 54,
    borderRadius: 12,
    zIndex: 0,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  colon: {
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    marginBottom: 6,
    marginHorizontal: 0,
    opacity: 0.6,
  },

  // Settings card
  settingsCard: { overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    minHeight: 52,
  },
  rowLabel: { fontFamily: "Inter_500Medium", fontSize: 15 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 5 },
  rowVal: { fontFamily: "Inter_400Regular", fontSize: 15 },
  labelInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    flex: 1,
    textAlign: "right",
    paddingLeft: 16,
  },
  div: { height: StyleSheet.hairlineWidth, marginHorizontal: 20 },
  daysWrap: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 14,
    justifyContent: "space-between",
  },
  dayChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepVal: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    minWidth: 50,
    textAlign: "center",
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(61,142,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
});
