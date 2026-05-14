import { useColorScheme } from "react-native";
import { useAlarms } from "@/context/AlarmContext";

export function useAppearance(): "light" | "dark" {
  const { settings } = useAlarms();
  const deviceScheme = useColorScheme();

  if (settings.appearanceMode === "dark") return "dark";
  if (settings.appearanceMode === "light") return "light";
  return deviceScheme === "dark" ? "dark" : "light";
}
