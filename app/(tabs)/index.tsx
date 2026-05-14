import {
  Bell,
  ChevronRight,
  Clock,
  ImageIcon,
  Moon,
  Music,
  PlusCircle,
  Share2,
  Smartphone,
  Sun,
  Timer,
  Watch,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAlarms } from "../../context/AlarmContext";
import type { AppearanceMode } from "../../context/AlarmContext";
import { useColors } from "../../hooks/useColors";
import { useAppearance } from "../../hooks/useAppearance";
import { useScale } from "../../hooks/useScale";

type LucideIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface RowItem {
  Icon: LucideIcon;
  label: string;
  sublabel: string;
  route: string;
  gradient: readonly [string, string];
}

const SECTIONS: Array<{ title: string; items: RowItem[] }> = [
  {
    title: "Quick Actions",
    items: [
      { Icon: PlusCircle, label: "Set Alarm",  sublabel: "Create a new alarm",  route: "/set-alarm",  gradient: ["#3D8EFF", "#5B6FFF"] },
      { Icon: Bell,       label: "My Alarms",  sublabel: "View saved alarms",   route: "/alarms",     gradient: ["#9B5DE5", "#C47AFF"] },
    ],
  },
  {
    title: "Audio & Visuals",
    items: [
      { Icon: Music,     label: "Sounds",  sublabel: "19 engine sounds",   route: "/sounds",  gradient: ["#FF6B9D", "#FF8C42"] },
      { Icon: ImageIcon, label: "Themes",  sublabel: "Front & Rear views", route: "/themes",  gradient: ["#00C9A7", "#0099CC"] },
    ],
  },
  {
    title: "Tools",
    items: [
      { Icon: Watch, label: "Stopwatch", sublabel: "Track laps & splits",    route: "/stopwatch", gradient: ["#9B5DE5", "#B07FFF"] },
      { Icon: Timer, label: "Timer",     sublabel: "Engine alarm countdown", route: "/timer",     gradient: ["#FF6B35", "#FF3D71"] },
    ],
  },
];

const APPEARANCE_OPTIONS: { key: AppearanceMode; label: string; Icon: LucideIcon }[] = [
  { key: "light",  label: "Light",  Icon: Sun        },
  { key: "dark",   label: "Dark",   Icon: Moon       },
  { key: "device", label: "Device", Icon: Smartphone },
];

function MenuRow({
  item,
  isFirst,
  isLast,
  borderColor,
}: {
  item: RowItem;
  isFirst: boolean;
  isLast: boolean;
  borderColor: string;
}) {
  const colors = useColors();
  const scheme = useAppearance();
  const isDark = scheme === "dark";
  const { ms, s } = useScale();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  const handlePress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(item.route as never);
  };

  const iconSize = s(44);
  const iconRadius = s(13);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View
          style={[
            styles.row,
            {
              backgroundColor: isDark ? "#131D38" : "#FFFFFF",
              borderTopLeftRadius: isFirst ? 16 : 0,
              borderTopRightRadius: isFirst ? 16 : 0,
              borderBottomLeftRadius: isLast ? 16 : 0,
              borderBottomRightRadius: isLast ? 16 : 0,
            },
          ]}
        >
          <LinearGradient
            colors={item.gradient}
            style={[styles.iconBadge, { width: iconSize, height: iconSize, borderRadius: iconRadius }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <item.Icon size={ms(20)} color="#fff" strokeWidth={2} />
          </LinearGradient>

          <View style={styles.rowText}>
            <Text style={[styles.rowLabel, { color: colors.text, fontSize: ms(15) }]}>
              {item.label}
            </Text>
            <Text style={[styles.rowSub, { color: colors.mutedForeground, fontSize: ms(12) }]}>
              {item.sublabel}
            </Text>
          </View>

          <ChevronRight size={ms(16)} color={isDark ? "#4A5880" : "#B0BCE0"} strokeWidth={2} />
        </View>

        {!isLast && (
          <View
            style={[
              styles.separator,
              { backgroundColor: borderColor, marginLeft: s(44) + 16 + 16 },
            ]}
          />
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const scheme = useAppearance();
  const insets = useSafeAreaInsets();
  const { ms, s } = useScale();
  const { alarms, settings, updateSettings } = useAlarms();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isDark = scheme === "dark";

  const activeAlarms = alarms.filter((a) => a.enabled);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 2400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 2400, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleShare = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try { await Share.share({ message: "Wake up like a supercar with TurboWake 🚀" }); } catch (_) {}
  };

  const handleAppearance = (mode: AppearanceMode) => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    updateSettings({ appearanceMode: mode });
  };

  const cardBg    = isDark ? "#131D38" : "#FFFFFF";
  const border    = isDark ? "#1E2D52" : "#DDE4F8";
  const sectionHdr = isDark ? "#8B98B8" : "#6B7A9A";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <LinearGradient
        colors={colors.gradientColors as [string, string]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={[styles.blob, { top: -100, right: -100, backgroundColor: colors.blobBlue,   width: 280, height: 280, borderRadius: 140 }]} />
      <View style={[styles.blob, { bottom: 40, left: -100, backgroundColor: colors.blobPurple, width: 300, height: 300, borderRadius: 150 }]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.appName, { color: colors.text, fontSize: ms(32) }]}>
              TurboWake
            </Text>
            <Text style={[styles.tagline, { color: sectionHdr, fontSize: ms(11) }]}>
              SUPERCAR ALARM
            </Text>
            {activeAlarms.length > 0 && (
              <View style={[styles.activeBadge, { backgroundColor: isDark ? "#1A2B50" : "#EEF5FF", borderColor: isDark ? "#2B4070" : "#C5D8FF" }]}>
                <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.activeBadgeText, { color: colors.primary, fontSize: ms(11) }]}>
                  {activeAlarms.length} alarm{activeAlarms.length > 1 ? "s" : ""} active
                </Text>
              </View>
            )}
          </View>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View style={[styles.appIconWrap, { backgroundColor: cardBg, borderColor: border }]}>
              <Image
                source={require("../../assets/images/icon.png")}
                style={{ width: s(56), height: s(56) }}
                contentFit="cover"
              />
            </View>
          </Animated.View>
        </View>

        {/* ── Menu Sections ── */}
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: sectionHdr, fontSize: ms(11) }]}>
              {section.title.toUpperCase()}
            </Text>

            <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
              {section.items.map((item, idx) => (
                <MenuRow
                  key={item.route}
                  item={item}
                  isFirst={idx === 0}
                  isLast={idx === section.items.length - 1}
                  borderColor={border}
                />
              ))}
            </View>
          </View>
        ))}

        {/* ── Appearance ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: sectionHdr, fontSize: ms(11) }]}>
            APPEARANCE
          </Text>
          <View style={[styles.card, styles.appearanceCard, { backgroundColor: cardBg, borderColor: border }]}>
            {APPEARANCE_OPTIONS.map(({ key, label, Icon }) => {
              const isActive = settings.appearanceMode === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => handleAppearance(key)}
                  style={[
                    styles.appearanceBtn,
                    isActive && { backgroundColor: colors.primary, borderRadius: 11 },
                  ]}
                >
                  <Icon size={13} color={isActive ? "#fff" : sectionHdr} strokeWidth={2} />
                  <Text style={[styles.appearanceBtnText, { color: isActive ? "#fff" : sectionHdr, fontSize: ms(13) }]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Share ── */}
        <Pressable onPress={handleShare}>
          <View style={[styles.shareRow, { backgroundColor: cardBg, borderColor: border }]}>
            <Share2 size={16} color={colors.primary} strokeWidth={2} />
            <Text style={[styles.shareText, { color: colors.primary, fontSize: ms(14) }]}>
              Share TurboWake
            </Text>
          </View>
        </Pressable>

        {/* ── Privacy Policy ── */}
        <Pressable onPress={() => router.push("/privacy-policy" as never)}>
          <Text style={[styles.privacyLink, { color: colors.mutedForeground, fontSize: ms(12) }]}>
            Privacy Policy
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  blob: { position: "absolute" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 0 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  headerLeft: { flex: 1, gap: 3 },
  appName: {
    fontFamily: "Inter_700Bold",
    letterSpacing: -1.2,
  },
  tagline: {
    fontFamily: "Inter_500Medium",
    letterSpacing: 2.5,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeBadgeText: { fontFamily: "Inter_500Medium" },
  appIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
  },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 14,
  },
  iconBadge: {
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontFamily: "Inter_600SemiBold" },
  rowSub:   { fontFamily: "Inter_400Regular" },
  separator: {
    height: 1,
    marginRight: 0,
  },

  appearanceCard: {
    flexDirection: "row",
    padding: 4,
  },
  appearanceBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  appearanceBtnText: { fontFamily: "Inter_500Medium" },

  shareRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
  },
  shareText: { fontFamily: "Inter_500Medium" },
  privacyLink: {
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 4,
  },
});
