import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Field Capture" }} />
      <Tabs.Screen name="harvest" options={{ title: "Harvest" }} />
      <Tabs.Screen name="post-harvest" options={{ title: "Post Harvest" }} />
    </Tabs>
  );
}
