import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";

const TABS = [
  { label: "Field Capture", path: "/" },
  { label: "Harvest", path: "/harvest" },
  { label: "Post Harvest", path: "/post-harvest" },
] as const;

export function HorizontalTabBar() {
  const colors = useColors();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  return (
    <View
      style={[
        styles.bar,
        {
          paddingTop: topPad,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <TouchableOpacity
            key={tab.path}
            onPress={() => {
              Haptics.selectionAsync();
              router.navigate(tab.path);
            }}
            activeOpacity={0.8}
            style={[
              styles.tab,
              { borderBottomColor: isActive ? colors.primary : "transparent" },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.primary : colors.mutedForeground },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
});
