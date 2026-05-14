import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { RepeatDay } from "@/context/AlarmContext";
import { AlarmProvider, useAlarms } from "@/context/AlarmContext";
import { ToastProvider } from "@/context/ToastContext";
import { setupNotificationCategories } from "@/services/alarmScheduler";

// Safely load expo-notifications (absent in some Expo Go builds)
let NotificationsLib: typeof import("expo-notifications") | null = null;
try {
  NotificationsLib = require("expo-notifications");
} catch (_) {}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function AlarmWatcher() {
  const { alarms, activeSnoozes, cancelSnooze } = useAlarms();
  const fired = useRef(new Set<string>());

  useEffect(() => {
    /**
     * catchupMinutes > 0 → also fire alarms that fired up to that many minutes
     * ago (used on AppState→active to recover alarms missed while screen was locked).
     */
    const tick = (catchupMinutes = 0) => {
      const now = new Date();
      const nowMs = now.getTime();
      const H = now.getHours();
      const M = now.getMinutes();
      const today = DAY_NAMES[now.getDay()];

      // ── Check snoozed alarms ─────────────────────────────────────────────
      for (const snooze of activeSnoozes) {
        if (nowMs < snooze.expiresAt) continue;

        const alarm = alarms.find((a) => a.id === snooze.alarmId);
        cancelSnooze(snooze.alarmId);

        if (alarm) {
          router.push({
            pathname: "/alarm-ring",
            params: {
              soundId: String(alarm.soundId),
              theme: alarm.theme,
              alarmId: alarm.id,
            },
          });
          return;
        }
      }

      // ── Check scheduled alarms ───────────────────────────────────────────
      for (const a of alarms) {
        if (!a.enabled) continue;

        let h24 = a.hour;
        if (a.ampm === "PM" && a.hour !== 12) h24 += 12;
        if (a.ampm === "AM" && a.hour === 12) h24 = 0;

        if (a.repeat.length > 0 && !a.repeat.includes(today as RepeatDay)) {
          continue;
        }

        if (activeSnoozes.some((s) => s.alarmId === a.id)) continue;

        // Compute how many ms have elapsed since this alarm's fire time today
        const alarmFiredAt = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          h24,
          a.minute,
          0,
          0
        ).getTime();
        const elapsedMs = nowMs - alarmFiredAt;

        const isCurrentMinute = H === h24 && M === a.minute;
        const isMissed =
          catchupMinutes > 0 &&
          elapsedMs >= 0 &&
          elapsedMs <= catchupMinutes * 60 * 1000;

        if (!isCurrentMinute && !isMissed) continue;

        const key = `${a.id}|${now.toDateString()}|${h24}|${a.minute}`;
        if (fired.current.has(key)) continue;
        fired.current.add(key);

        if (fired.current.size > 50) {
          const arr = [...fired.current];
          fired.current = new Set(arr.slice(arr.length - 30));
        }

        router.push({
          pathname: "/alarm-ring",
          params: {
            soundId: String(a.soundId),
            theme: a.theme,
            alarmId: a.id,
          },
        });
        break;
      }
    };

    tick();
    const id = setInterval(() => tick(), 10_000);

    // When the user unlocks the screen and the app comes to the foreground,
    // check if any alarm fired while JS was suspended (up to 30 min ago).
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        tick(30);
      }
    });

    return () => {
      clearInterval(id);
      appStateSub.remove();
    };
  }, [alarms, activeSnoozes, cancelSnooze]);

  return null;
}

function RootLayoutNav() {
  // When user taps the lock-screen notification → navigate to alarm-ring
  useEffect(() => {
    if (!NotificationsLib) return;

    const sub = NotificationsLib.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as {
          alarmId?: string;
          soundId?: number;
          theme?: string;
        };
        if (data?.alarmId) {
          router.push({
            pathname: "/alarm-ring",
            params: {
              soundId: String(data.soundId ?? 1),
              theme: String(data.theme ?? "blue_storm"),
              alarmId: String(data.alarmId),
            },
          });
        }
      }
    );

    return () => sub.remove();
  }, []);

  return (
    <>
      <AlarmWatcher />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="alarm-ring"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="preview"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="privacy-policy"
          options={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      setupNotificationCategories();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AlarmProvider>
                <ToastProvider>
                  <RootLayoutNav />
                </ToastProvider>
              </AlarmProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
