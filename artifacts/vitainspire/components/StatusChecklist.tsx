import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import type { Field } from "@/hooks/useStore";

interface Props {
  field: Field;
  compact?: boolean;
}

const STAGES: { key: keyof Field | "silage"; label: string }[] = [
  { key: "standing", label: "Standing" },
  { key: "cut", label: "Cut" },
  { key: "chopped", label: "Chopped" },
  { key: "silage", label: "Silage" },
];

export function StatusChecklist({ field, compact = false }: Props) {
  const colors = useColors();

  const isDone = (key: string) => {
    if (key === "standing") return !!field.standing.plantUri;
    if (key === "cut") return !!field.cut;
    if (key === "chopped") return !!field.chopped;
    if (key === "silage") return !!field.silage?.submittedAt;
    return false;
  };

  return (
    <View style={[styles.list, compact && styles.compactList]}>
      {STAGES.map((s) => {
        const done = isDone(s.key as string);
        return (
          <View
            key={s.key as string}
            style={[
              styles.row,
              compact && styles.compactRow,
              {
                backgroundColor: done ? colors.primary + "15" : colors.secondary,
                borderRadius: colors.radius,
              },
            ]}
          >
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: done ? colors.primary : "transparent",
                  borderColor: done ? colors.primary : colors.border,
                },
              ]}
            >
              {done ? (
                <Feather name="check" size={compact ? 11 : 13} color={colors.primaryForeground} />
              ) : (
                <Feather name="clock" size={compact ? 11 : 13} color={colors.mutedForeground} />
              )}
            </View>
            <Text
              style={[
                styles.label,
                compact && { fontSize: 12 },
                { color: done ? colors.foreground : colors.mutedForeground },
              ]}
            >
              {s.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  compactList: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  compactRow: { paddingHorizontal: 10, paddingVertical: 6, gap: 6 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 14, fontWeight: "700" },
});
