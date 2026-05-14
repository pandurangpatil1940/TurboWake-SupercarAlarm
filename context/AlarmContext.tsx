import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type RepeatDay =
  | "Mon"
  | "Tue"
  | "Wed"
  | "Thu"
  | "Fri"
  | "Sat"
  | "Sun";
export type Theme =
  | "blue_storm"
  | "violet_exhaust"
  | "dark_knight"
  | "red_inferno"
  | "m_power"
  | "m_drift"
  | "shadow_m"
  | "night_exit";

export interface Alarm {
  id: string;
  hour: number;
  minute: number;
  ampm: "AM" | "PM";
  label: string;
  enabled: boolean;
  repeat: RepeatDay[];
  snoozeMinutes: number;
  soundId: number;
  theme: Theme;
  vibration: boolean;
}

export interface SnoozeEntry {
  alarmId: string;
  expiresAt: number;
}

export type AppearanceMode = "light" | "dark" | "device";

export interface AppSettings {
  defaultSoundId: number;
  defaultTheme: Theme;
  defaultSnooze: number;
  defaultVibration: boolean;
  appearanceMode: AppearanceMode;
}

interface AlarmContextValue {
  alarms: Alarm[];
  settings: AppSettings;
  activeSnoozes: SnoozeEntry[];
  addAlarm: (alarm: Omit<Alarm, "id">) => void;
  updateAlarm: (alarm: Alarm) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  snoozeAlarm: (alarmId: string, minutes: number) => void;
  cancelSnooze: (alarmId: string) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultSoundId: 1,
  defaultTheme: "blue_storm",
  defaultSnooze: 10,
  defaultVibration: true,
  appearanceMode: "device",
};

const AlarmContext = createContext<AlarmContextValue | null>(null);

const ALARMS_KEY = "turbowake_alarms";
const SETTINGS_KEY = "turbowake_settings";

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeSnoozes, setActiveSnoozes] = useState<SnoozeEntry[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [alarmsStr, settingsStr] = await Promise.all([
          AsyncStorage.getItem(ALARMS_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
        ]);
        if (alarmsStr) setAlarms(JSON.parse(alarmsStr));
        if (settingsStr)
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(settingsStr) });
      } catch (_) {}
    })();
  }, []);

  const persist = useCallback(
    async (updated: Alarm[]) => {
      setAlarms(updated);
      await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(updated));
    },
    []
  );

  const addAlarm = useCallback(
    (alarm: Omit<Alarm, "id">) => {
      const newAlarm: Alarm = {
        ...alarm,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      };
      persist([...alarms, newAlarm]);
    },
    [alarms, persist]
  );

  const updateAlarm = useCallback(
    (alarm: Alarm) => {
      persist(alarms.map((a) => (a.id === alarm.id ? alarm : a)));
    },
    [alarms, persist]
  );

  const deleteAlarm = useCallback(
    (id: string) => {
      persist(alarms.filter((a) => a.id !== id));
    },
    [alarms, persist]
  );

  const toggleAlarm = useCallback(
    (id: string) => {
      persist(
        alarms.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
      );
    },
    [alarms, persist]
  );

  const updateSettings = useCallback(
    async (s: Partial<AppSettings>) => {
      const updated = { ...settings, ...s };
      setSettings(updated);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    },
    [settings]
  );

  const snoozeAlarm = useCallback((alarmId: string, minutes: number) => {
    const expiresAt = Date.now() + minutes * 60 * 1000;
    setActiveSnoozes((prev) => [
      ...prev.filter((s) => s.alarmId !== alarmId),
      { alarmId, expiresAt },
    ]);
  }, []);

  const cancelSnooze = useCallback((alarmId: string) => {
    setActiveSnoozes((prev) => prev.filter((s) => s.alarmId !== alarmId));
  }, []);

  return (
    <AlarmContext.Provider
      value={{
        alarms,
        settings,
        activeSnoozes,
        addAlarm,
        updateAlarm,
        deleteAlarm,
        toggleAlarm,
        updateSettings,
        snoozeAlarm,
        cancelSnooze,
      }}
    >
      {children}
    </AlarmContext.Provider>
  );
}

export function useAlarms() {
  const ctx = useContext(AlarmContext);
  if (!ctx) throw new Error("useAlarms must be used inside AlarmProvider");
  return ctx;
}
