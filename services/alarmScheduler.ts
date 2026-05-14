import { Platform } from "react-native";
import type { Alarm } from "../context/AlarmContext";

let Notifications: typeof import("expo-notifications") | null = null;

try {
  Notifications = require("expo-notifications");
  if (Notifications) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
} catch (_) {
  Notifications = null;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch (_) {
    return false;
  }
}

export async function scheduleAlarm(alarm: Alarm): Promise<string | null> {
  if (!alarm.enabled || !Notifications || Platform.OS === "web") return null;

  const permission = await requestNotificationPermissions();
  if (!permission) return null;

  await cancelAlarm(alarm.id);

  const now = new Date();
  const trigger = new Date();
  let hour24 = alarm.hour;
  if (alarm.ampm === "PM" && alarm.hour !== 12) hour24 += 12;
  if (alarm.ampm === "AM" && alarm.hour === 12) hour24 = 0;

  trigger.setHours(hour24, alarm.minute, 0, 0);
  if (trigger <= now) trigger.setDate(trigger.getDate() + 1);

  try {
    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "TurboWake — Alarm",
        body: alarm.label ? `${alarm.label} · Time to wake up!` : "Time to wake up!",
        data: { alarmId: alarm.id, soundId: alarm.soundId, theme: alarm.theme },
        categoryIdentifier: "alarm",
        sound: true,
        vibrate: alarm.vibration ? [0, 250, 250, 250] : [],
        priority: "max",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
        channelId: "turbowake_alarm",
      },
    });

    const { default: AsyncStorage } = await import(
      "@react-native-async-storage/async-storage"
    );
    const map = JSON.parse(
      (await AsyncStorage.getItem("alarm_notif_map")) || "{}"
    );
    map[alarm.id] = notifId;
    await AsyncStorage.setItem("alarm_notif_map", JSON.stringify(map));

    return notifId;
  } catch (_) {
    return null;
  }
}

export async function cancelAlarm(alarmId: string) {
  try {
    const { default: AsyncStorage } = await import(
      "@react-native-async-storage/async-storage"
    );
    const map = JSON.parse(
      (await AsyncStorage.getItem("alarm_notif_map")) || "{}"
    );
    const notifId = map[alarmId];
    if (notifId && Notifications) {
      await Notifications.cancelScheduledNotificationAsync(notifId);
      delete map[alarmId];
      await AsyncStorage.setItem("alarm_notif_map", JSON.stringify(map));
    }
  } catch (_) {}
}

export function setupNotificationCategories() {
  if (Platform.OS === "web" || !Notifications) return;

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("turbowake_alarm", {
      name: "TurboWake Alarms",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      sound: "default",
      bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      lightColor: "#3D8EFF",
      enableLights: true,
      showBadge: false,
      description: "Supercar alarm notifications",
    }).catch(() => {});
  }

  Notifications.setNotificationCategoryAsync("alarm", [
    {
      identifier: "stop",
      buttonTitle: "Stop",
      options: { isDestructive: true },
    },
    { identifier: "snooze", buttonTitle: "Snooze" },
  ]).catch(() => {});
}
