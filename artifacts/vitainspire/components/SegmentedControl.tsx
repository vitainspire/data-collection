import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface SegmentedControlProps<T extends string> {
  options: { label: string; value: T; icon?: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  scrollable?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  scrollable = false,
}: SegmentedControlProps<T>) {
  const colors = useColors();

  const handlePress = (val: T) => {
    if (val !== value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(val);
    }
  };

  const content = (
    <View style={[styles.container, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.segment,
              { borderRadius: colors.radius - 4 },
              isSelected && { backgroundColor: colors.primary },
            ]}
            onPress={() => handlePress(opt.value)}
            activeOpacity={0.8}
          >
            {opt.icon && (
              <View style={styles.iconContainer}>
                {opt.icon}
              </View>
            )}
            <Text
              style={[
                styles.label,
                { color: isSelected ? colors.primaryForeground : colors.secondaryForeground },
              ]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {content}
      </ScrollView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 4,
    width: "100%",
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 8,
  },
  iconContainer: {
    marginRight: 4,
  },
  label: {
    fontWeight: "600",
    fontSize: 15,
  },
});
