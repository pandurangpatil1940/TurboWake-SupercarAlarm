import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import type { Theme } from "../context/AlarmContext";
import { useAlarms } from "../context/AlarmContext";
import { RingScreen } from "./alarm-ring";

export default function PreviewScreen() {
  const params = useLocalSearchParams<{
    soundId?: string;
    theme?: string;
    alarmId?: string;
  }>();
  const { alarms } = useAlarms();

  const soundId = parseInt(params.soundId ?? "1") || 1;
  const theme = (params.theme as Theme) ?? "blue_storm";
  const alarm = params.alarmId ? alarms.find((a) => a.id === params.alarmId) : null;
  const label = alarm?.label || undefined;

  return (
    <RingScreen
      soundId={soundId}
      theme={theme}
      label={label}
      snoozeMinutes={alarm?.snoozeMinutes ?? 10}
      onStop={() => router.canGoBack() ? router.back() : router.replace("/")}
      onSnooze={() => router.canGoBack() ? router.back() : router.replace("/")}
    />
  );
}
