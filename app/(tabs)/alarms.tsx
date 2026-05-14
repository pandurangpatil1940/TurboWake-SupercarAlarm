import { BellOff, ChevronLeft, Plus } from "lucide-react-native";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlarmItem } from "../../components/AlarmItem";
import type { Alarm } from "../../context/AlarmContext";
import { useAlarms } from "../../context/AlarmContext";
import { useColors } from "../../hooks/useColors";
import { cancelAlarm, scheduleAlarm } from "../../services/alarmScheduler";

const goBack = () => router.canGoBack() ? router.back() : router.replace("/");

export default function AlarmsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { alarms, toggleAlarm, deleteAlarm } = useAlarms();

  const handleToggle = async (alarm: Alarm) => {
    toggleAlarm(alarm.id);
    if (!alarm.enabled) {
      await scheduleAlarm({ ...alarm, enabled: true });
    } else {
      await cancelAlarm(alarm.id);
    }
  };

  const handleEdit = (alarm: Alarm) => {
    router.push({ pathname: "/set-alarm", params: { id: alarm.id } });
  };

  const handleDelete = async (alarm: Alarm) => {
    await cancelAlarm(alarm.id);
    deleteAlarm(alarm.id);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom header */}
      <View style={[styles.headerRow, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 8, backgroundColor: colors.background }]}>
        <Pressable onPress={goBack} style={[styles.backBtn, { backgroundColor: "rgba(61,142,255,0.08)" }]}>
          <ChevronLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.screenTitle, { color: colors.text }]}>My Alarms</Text>
        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        scrollEnabled={!!alarms.length}
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom:
              insets.bottom + (Platform.OS === "web" ? 34 : 0) + 80,
          },
        ]}
        renderItem={({ item }) => (
          <AlarmItem
            alarm={item}
            onToggle={() => handleToggle(item)}
            onEdit={() => handleEdit(item)}
            onDelete={() => handleDelete(item)}
            onPreview={() =>
              router.push({
                pathname: "/preview",
                params: { soundId: item.soundId, theme: item.theme, alarmId: item.id },
              })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <BellOff size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No alarms yet
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Create your first supercar alarm
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <Pressable
        style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 24 }]}
        onPress={() => router.push("/set-alarm")}
      >
        <Plus size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  screenTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    letterSpacing: -0.3,
  },
  list: {
    paddingTop: 12,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
  },
  emptySub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3D8EFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
