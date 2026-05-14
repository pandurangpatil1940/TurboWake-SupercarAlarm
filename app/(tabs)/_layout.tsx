import { Stack } from "expo-router";
import React from "react";

export default function TabsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="alarms" />
      <Stack.Screen name="set-alarm" />
      <Stack.Screen name="sounds" />
      <Stack.Screen name="themes" />
      <Stack.Screen name="stopwatch" />
      <Stack.Screen name="timer" />
    </Stack>
  );
}
