import { ChevronLeft } from "lucide-react-native";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../hooks/useColors";

const LAST_UPDATED = "May 14, 2026";
const CONTACT_EMAIL = "pandurangpatil01011940@gmail.com";

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "Overview",
    body:
      "TurboWake is an alarm clock application. This Privacy Policy explains what information the app handles and how it is used. We are committed to protecting your privacy.",
  },
  {
    title: "Data We Collect",
    body:
      "TurboWake does not collect, transmit, or share any personal data. All information you enter — alarm times, labels, sound preferences, and theme settings — is stored exclusively on your device using local storage. This data never leaves your device.",
  },
  {
    title: "Data We Do Not Collect",
    body:
      "We do not collect:\n\n\u2022 Your name, email address, or any contact information\n\u2022 Location data\n\u2022 Device identifiers or advertising IDs\n\u2022 Usage analytics or crash reports\n\u2022 Payment information\n\u2022 Any biometric data\n\nThe app contains no third-party analytics, advertising SDKs, or tracking libraries.",
  },
  {
    title: "Permissions We Request",
    body:
      "The app requests the following device permissions, each used solely to deliver alarm functionality:\n\n\u2022 Notifications \u2014 to alert you when an alarm fires\n\u2022 Vibration \u2014 to vibrate when an alarm fires\n\u2022 Receive Boot Completed \u2014 to reschedule alarms after device restart\n\u2022 Wake Lock \u2014 to wake the device screen when an alarm fires\n\u2022 Exact Alarm \u2014 to fire alarms at the precise time you set\n\u2022 Full Screen Intent \u2014 to display the alarm screen on your lock screen\n\u2022 Ignore Battery Optimizations \u2014 to ensure alarms fire reliably in battery-saving mode\n\nNone of these permissions are used to collect data.",
  },
  {
    title: "Local Storage",
    body:
      "Alarm settings are stored locally on your device. You can delete all stored data at any time by uninstalling the app. We have no ability to access this data remotely.",
  },
  {
    title: "Children\u2019s Privacy",
    body:
      "TurboWake does not knowingly collect any information from children under 13 years of age. The app contains no user accounts and collects no data, making it safe for users of all ages.",
  },
  {
    title: "Changes to This Policy",
    body:
      "If we update this Privacy Policy, we will update the Last Updated date at the top of this page. Continued use of the app after any changes constitutes acceptance of the updated policy.",
  },
  {
    title: "Contact",
    body:
      "If you have any questions about this Privacy Policy, please contact us at:\n\n" +
      CONTACT_EMAIL,
  },
];

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          style={[
            styles.backBtn,
            { backgroundColor: "rgba(61,142,255,0.08)" },
          ]}
        >
          <ChevronLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>
          Privacy Policy
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              insets.bottom + (Platform.OS === "web" ? 34 : 0) + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.updated, { color: colors.mutedForeground }]}>
          Last updated: {LAST_UPDATED}
        </Text>

        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {s.title}
            </Text>
            <Text
              style={[styles.sectionBody, { color: colors.mutedForeground }]}
            >
              {s.body}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    letterSpacing: -0.3,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  updated: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
    gap: 8,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  sectionBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
  },
});
