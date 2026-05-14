import { PlayCircle, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import type { Alarm, RepeatDay } from "../context/AlarmContext";
import { useColors } from "../hooks/useColors";
import { useScale } from "../hooks/useScale";
import { GlassCard } from "./GlassCard";

interface AlarmItemProps {
  alarm: Alarm;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
}

function formatTime(hour: number, minute: number, ampm: "AM" | "PM"): string {
  const h = hour.toString().padStart(2, "0");
  const m = minute.toString().padStart(2, "0");
  return `${h}:${m} ${ampm}`;
}

function formatRepeat(repeat: string[]): string {
  if (!repeat || repeat.length === 0) return "Once";
  if (repeat.length === 7) return "Every day";
  if (
    repeat.length === 5 &&
    !repeat.includes("Sat") &&
    !repeat.includes("Sun")
  )
    return "Weekdays";
  if (repeat.length === 2 && repeat.includes("Sat") && repeat.includes("Sun"))
    return "Weekends";
  return repeat.join(", ");
}

const DAY_IDX = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function timeUntilAlarm(alarm: Alarm): string | null {
  if (!alarm.enabled) return null;

  const now = new Date();
  const nowTotalMin = now.getHours() * 60 + now.getMinutes();

  let h24 = alarm.hour;
  if (alarm.ampm === "PM" && alarm.hour !== 12) h24 += 12;
  if (alarm.ampm === "AM" && alarm.hour === 12) h24 = 0;
  const alarmTotalMin = h24 * 60 + alarm.minute;

  let minutesUntil: number;

  if (alarm.repeat.length === 0) {
    // One-time alarm — next occurrence today or tomorrow
    if (alarmTotalMin > nowTotalMin) {
      minutesUntil = alarmTotalMin - nowTotalMin;
    } else {
      minutesUntil = 24 * 60 - nowTotalMin + alarmTotalMin;
    }
  } else {
    // Repeating — find the nearest matching day
    let found = false;
    minutesUntil = 0;
    for (let d = 0; d <= 7; d++) {
      const dayName = DAY_IDX[(now.getDay() + d) % 7] as RepeatDay;
      if (!alarm.repeat.includes(dayName)) continue;
      if (d === 0 && alarmTotalMin <= nowTotalMin) continue; // already passed today
      minutesUntil = d * 24 * 60 + alarmTotalMin - nowTotalMin;
      found = true;
      break;
    }
    if (!found) return null;
  }

  const h = Math.floor(minutesUntil / 60);
  const m = minutesUntil % 60;

  if (h === 0) return `Alarm in ${m}m`;
  if (m === 0) return `Alarm in ${h}h`;
  return `Alarm in ${h}h ${m}m`;
}

export function AlarmItem({ alarm, onToggle, onEdit, onDelete, onPreview }: AlarmItemProps) {
  const colors = useColors();
  const { ms } = useScale();

  const countdown = timeUntilAlarm(alarm);

  const handleToggle = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onToggle();
  };

  return (
    <GlassCard style={styles.card}>
      <Pressable
        style={styles.main}
        onPress={onEdit}
        android_ripple={{ color: "rgba(61,142,255,0.1)" }}
      >
        <View style={styles.timeSection}>
          <Text
            style={[
              styles.time,
              { color: alarm.enabled ? colors.text : colors.mutedForeground, fontSize: ms(26) },
            ]}
          >
            {formatTime(alarm.hour, alarm.minute, alarm.ampm)}
          </Text>
          <Text style={[styles.repeat, { color: colors.mutedForeground, fontSize: ms(12) }]}>
            {alarm.label ? `${alarm.label} · ` : ""}
            {formatRepeat(alarm.repeat)}
          </Text>
          {countdown ? (
            <View style={[styles.countdownBadge, { backgroundColor: "rgba(61,142,255,0.12)" }]}>
              <Text style={[styles.countdownText, { color: colors.primary, fontSize: ms(11) }]}>
                {countdown}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.controls}>
          <Pressable
            onPress={onPreview}
            style={styles.previewBtn}
            hitSlop={8}
          >
            <PlayCircle size={ms(22)} color={colors.accent} />
          </Pressable>
          <Switch
            value={alarm.enabled}
            onValueChange={handleToggle}
            trackColor={{
              false: "rgba(107,122,154,0.2)",
              true: "rgba(61,142,255,0.4)",
            }}
            thumbColor={alarm.enabled ? colors.primary : "#fff"}
          />
          <Pressable
            onPress={onDelete}
            style={styles.deleteBtn}
            hitSlop={8}
          >
            <Trash2 size={ms(16)} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </Pressable>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginVertical: 6,
  },
  main: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  timeSection: {
    flex: 1,
    gap: 4,
  },
  time: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    letterSpacing: -1,
  },
  repeat: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  countdownBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 2,
  },
  countdownText: {
    fontFamily: "Inter_500Medium",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  previewBtn: {
    padding: 4,
  },
  deleteBtn: {
    padding: 4,
  },
});
