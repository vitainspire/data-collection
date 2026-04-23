import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { useColors } from "@/hooks/useColors";

export function ProgressBar({ progress, steps }: { progress: number; steps: number }) {
  const colors = useColors();
  
  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: colors.mutedForeground }]}>
        Step {progress} of {steps}
      </Text>
      <View style={[styles.track, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
        <View 
          style={[
            styles.fill, 
            { 
              backgroundColor: colors.primary,
              borderRadius: colors.radius,
              width: `${(progress / steps) * 100}%` 
            }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    gap: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  track: {
    height: 8,
    width: "100%",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});
