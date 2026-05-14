import colors from "@/constants/colors";
import { useAppearance } from "./useAppearance";

type Palette = typeof colors.light;

export function useColors(): Palette & { radius: number } {
  const scheme = useAppearance();
  const palette: Palette = scheme === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
