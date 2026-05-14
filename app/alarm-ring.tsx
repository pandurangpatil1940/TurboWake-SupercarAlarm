import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Theme } from "../context/AlarmContext";
import { useAlarms } from "../context/AlarmContext";
import { soundService } from "../services/soundService";

const { width, height } = Dimensions.get("window");

const CAR_IMAGES: Record<Theme, ReturnType<typeof require>> = {
  blue_storm:     require("../assets/images/car_blue_storm.png"),
  violet_exhaust: require("../assets/images/car_violet_exhaust.png"),
  dark_knight:    require("../assets/images/car_dark_knight.png"),
  red_inferno:    require("../assets/images/car_red_inferno.png"),
  m_power:        require("../assets/images/car_m_power.png"),
  m_drift:        require("../assets/images/car_m_drift.png"),
  shadow_m:       require("../assets/images/car_shadow_m.png"),
  night_exit:     require("../assets/images/car_night_exit.png"),
};

interface ThemePalette {
  bg: string;
  fadeRgb: string;
  timeColor: string;
  dateColor: string;
  stopBg: string;
  snoozeColor: string;
  snoozeBg: string;
  snoozeBorder: string;
}

const THEME_PALETTE: Record<Theme, ThemePalette> = {
  blue_storm:     { bg: "#EDF0FF", fadeRgb: "237,240,255", timeColor: "#0F1B35", dateColor: "#6B7A9A", stopBg: "#0F1B35", snoozeColor: "#3D8EFF", snoozeBg: "rgba(255,255,255,0.60)", snoozeBorder: "rgba(255,255,255,0.85)" },
  violet_exhaust: { bg: "#F2EEF8", fadeRgb: "242,238,248", timeColor: "#1A0A2E", dateColor: "#7A6A9A", stopBg: "#1A0A2E", snoozeColor: "#9B5DE5", snoozeBg: "rgba(255,255,255,0.60)", snoozeBorder: "rgba(255,255,255,0.85)" },
  dark_knight:    { bg: "#080A0F", fadeRgb: "8,10,15",     timeColor: "#E8ECF8", dateColor: "#7A88AA", stopBg: "#E8ECF8", snoozeColor: "#7EB3FF", snoozeBg: "rgba(255,255,255,0.10)", snoozeBorder: "rgba(255,255,255,0.18)" },
  red_inferno:    { bg: "#0D0406", fadeRgb: "13,4,6",      timeColor: "#F8E8E8", dateColor: "#AA8080", stopBg: "#F8E8E8", snoozeColor: "#FF5555", snoozeBg: "rgba(255,255,255,0.08)", snoozeBorder: "rgba(255,100,100,0.30)" },
  m_power:        { bg: "#F0F0F0", fadeRgb: "240,240,240", timeColor: "#111111", dateColor: "#666666", stopBg: "#111111", snoozeColor: "#3D8EFF", snoozeBg: "rgba(255,255,255,0.70)", snoozeBorder: "rgba(255,255,255,0.90)" },
  m_drift:        { bg: "#EEF0F8", fadeRgb: "238,240,248", timeColor: "#0A0A1A", dateColor: "#66669A", stopBg: "#0A0A1A", snoozeColor: "#9B5DE5", snoozeBg: "rgba(255,255,255,0.65)", snoozeBorder: "rgba(255,255,255,0.88)" },
  shadow_m:       { bg: "#080808", fadeRgb: "8,8,8",       timeColor: "#EAEAEA", dateColor: "#888888", stopBg: "#EAEAEA", snoozeColor: "#7EB3FF", snoozeBg: "rgba(255,255,255,0.08)", snoozeBorder: "rgba(255,255,255,0.16)" },
  night_exit:     { bg: "#07060F", fadeRgb: "7,6,15",      timeColor: "#E8E0F8", dateColor: "#8880AA", stopBg: "#E8E0F8", snoozeColor: "#B07EFF", snoozeBg: "rgba(255,255,255,0.06)", snoozeBorder: "rgba(180,130,255,0.28)" },
};

const CAR_CONTENT_POSITION: Record<Theme, { top: string; left: string }> = {
  blue_storm:     { top: "55%", left: "50%" },
  violet_exhaust: { top: "50%", left: "50%" },
  dark_knight:    { top: "55%", left: "50%" },
  red_inferno:    { top: "50%", left: "50%" },
  m_power:        { top: "50%", left: "50%" },
  m_drift:        { top: "50%", left: "50%" },
  shadow_m:       { top: "55%", left: "50%" },
  night_exit:     { top: "50%", left: "50%" },
};

interface RingScreenProps {
  soundId?: number;
  theme?: Theme;
  alarmId?: string;
  label?: string;
  snoozeMinutes?: number;
  onStop?: () => void;
  onSnooze?: () => void;
}

export function RingScreen({
  soundId = 1,
  theme = "blue_storm",
  label,
  snoozeMinutes = 10,
  onStop,
  onSnooze,
}: RingScreenProps) {
  const insets = useSafeAreaInsets();
  const glowScale = useSharedValue(1);
  const [now, setNow] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Start sound and animations on mount
  useEffect(() => {
    soundService.playSound(soundId, true, false);

    // Glow pulse
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 800 }),
        withTiming(0.95, { duration: 600 })
      ),
      -1,
      false
    );

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      ).catch(() => {});
    }

    return () => {
      soundService.stopSound();
      cancelAnimation(glowScale);
    };
  }, []);

  // Single tap stops the alarm immediately
  const handleStop = useCallback(() => {
    soundService.stopSound();
    cancelAnimation(glowScale);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => {});
    }
    if (onStop) onStop();
    else if (router.canGoBack()) router.back();
    else router.replace("/");
  }, [onStop]);

  const handleSnooze = useCallback(() => {
    soundService.stopSound();
    cancelAnimation(glowScale);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    if (onSnooze) onSnooze();
    else if (router.canGoBack()) router.back();
    else router.replace("/");
  }, [onSnooze]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: 0.6,
  }));

  const timeStr = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const dateStr = now.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const pal = THEME_PALETTE[theme];
  const rgb = pal.fadeRgb;

  return (
    <View style={[styles.container, { backgroundColor: pal.bg }]}>
      <StatusBar hidden />

      {/* Car image — top section */}
      <View style={styles.carContainer}>
        <Image
          source={CAR_IMAGES[theme]}
          style={styles.carImage}
          contentFit="cover"
          contentPosition={CAR_CONTENT_POSITION[theme]}
        />
        <LinearGradient
          colors={[
            `rgba(${rgb},0)`,
            `rgba(${rgb},0.45)`,
            `rgba(${rgb},1)`,
          ]}
          style={styles.fadeOverlay}
          locations={[0.4, 0.75, 1]}
        />
      </View>

      {/* Glow ring */}
      <Animated.View
        style={[
          styles.glowRing,
          glowStyle,
          {
            backgroundColor:
              theme === "blue_storm"      ? "rgba(61,142,255,0.10)"
              : theme === "dark_knight"   ? "rgba(61,142,255,0.08)"
              : theme === "red_inferno"   ? "rgba(220,50,50,0.10)"
              : theme === "violet_exhaust"? "rgba(155,93,229,0.10)"
              : theme === "m_power"       ? "rgba(255,200,50,0.08)"
              : theme === "m_drift"       ? "rgba(155,93,229,0.08)"
              : theme === "shadow_m"      ? "rgba(61,142,255,0.08)"
              : "rgba(155,93,229,0.10)",
          },
        ]}
      />

      {/* Bottom panel — below the car */}
      <View
        style={[
          styles.bottomPanel,
          {
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 24,
          },
        ]}
      >
        {/* Time */}
        <View style={styles.timeBlock}>
          <Text style={[styles.timeText, { color: pal.timeColor }]}>{timeStr}</Text>
          <Text style={[styles.dateText, { color: pal.dateColor }]}>{dateStr}</Text>
          {!!label && (
            <Text style={[styles.labelText, { color: pal.snoozeColor }]}>{label}</Text>
          )}
        </View>

        {/* STOP button */}
        <Pressable
          onPress={handleStop}
          style={({ pressed }) => [
            styles.stopBtn,
            { backgroundColor: pal.stopBg },
            pressed && { transform: [{ scale: 0.94 }], opacity: 0.85 },
          ]}
        >
          <Text style={[styles.stopLabel, { color: pal.bg }]}>STOP</Text>
        </Pressable>

        {/* Snooze */}
        <Pressable
          onPress={handleSnooze}
          style={[
            styles.snoozeBtn,
            { backgroundColor: pal.snoozeBg, borderColor: pal.snoozeBorder },
          ]}
        >
          <Text style={[styles.snoozeText, { color: pal.snoozeColor }]}>
            Snooze {snoozeMinutes}m
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function AlarmRingScreen() {
  const params = useLocalSearchParams<{
    soundId?: string;
    theme?: string;
    alarmId?: string;
  }>();
  const { alarms, snoozeAlarm } = useAlarms();

  const alarm = params.alarmId
    ? alarms.find((a) => a.id === params.alarmId)
    : null;
  const soundId = parseInt(params.soundId ?? "1") || 1;
  const theme = (params.theme as Theme) ?? "blue_storm";
  const snoozeMinutes = alarm?.snoozeMinutes ?? 10;
  const label = alarm?.label ?? undefined;

  const handleSnooze = () => {
    if (alarm) {
      snoozeAlarm(alarm.id, snoozeMinutes);
    }
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  return (
    <RingScreen
      soundId={soundId}
      theme={theme}
      label={label}
      snoozeMinutes={snoozeMinutes}
      onStop={() => router.canGoBack() ? router.back() : router.replace("/")}
      onSnooze={handleSnooze}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EDF0FF",
  },
  carContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.60,
  },
  carImage: {
    width: "100%",
    height: "100%",
  },
  fadeOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.22,
  },
  glowRing: {
    position: "absolute",
    top: height * 0.38,
    left: width * 0.08,
    right: width * 0.08,
    height: width * 0.84,
    borderRadius: width * 0.42,
  },
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 20,
    // starts just below the car fade
    paddingTop: height * 0.40,
  },
  timeBlock: {
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 42,
    color: "#0F1B35",
    letterSpacing: -2,
  },
  dateText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#6B7A9A",
  },
  labelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#3D8EFF",
    letterSpacing: 0.5,
    marginTop: 2,
    textTransform: "uppercase",
  },
  stopBtn: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#0F1B35",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 10,
  },
  stopBtnPressed: {
    backgroundColor: "#1a2d50",
    transform: [{ scale: 0.94 }],
  },
  stopLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "#fff",
    letterSpacing: 3,
  },
  snoozeBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.60)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.85)",
  },
  snoozeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#3D8EFF",
    letterSpacing: 0.3,
  },
});
