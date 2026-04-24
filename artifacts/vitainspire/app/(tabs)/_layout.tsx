import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Platform } from "react-native";

import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const colors = useColors();
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : { height: 64 }),
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontWeight: "700",
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Field Capture",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="sprout" size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="harvest"
        options={{
          title: "Harvest",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="leaf-maple" size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="post-harvest"
        options={{
          title: "Post Harvest",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="silo" size={size + 2} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
