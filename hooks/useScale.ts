import { useWindowDimensions } from "react-native";

const BASE_W = 375;
const BASE_H = 812;

export function useScale() {
  const { width, height } = useWindowDimensions();

  const sw = width / BASE_W;
  const sh = height / BASE_H;

  const s = (size: number) => Math.round(size * sw);
  const vs = (size: number) => Math.round(size * sh);
  const ms = (size: number, factor = 0.45) =>
    Math.round(size + (size * sw - size) * factor);

  const wp = (pct: number) => (width * pct) / 100;
  const hp = (pct: number) => (height * pct) / 100;

  const isTablet = width >= 768;
  const isSmall = width < 360;

  return { width, height, sw, sh, s, vs, ms, wp, hp, isTablet, isSmall };
}
