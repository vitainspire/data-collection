import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { INDIA_STATES, type StateEntry, type DistrictEntry } from "@/data/indiaLocations";

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedState: string;
  selectedDistrict: string;
  onSelect: (state: StateEntry, district: DistrictEntry) => void;
}

type Step = "state" | "district";

export function LocationPicker({
  visible,
  onClose,
  selectedState,
  selectedDistrict,
  onSelect,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("state");
  const [pendingState, setPendingState] = useState<StateEntry | null>(
    INDIA_STATES.find((s) => s.code === selectedState) ?? null
  );
  const [query, setQuery] = useState("");

  // Reset on open
  React.useEffect(() => {
    if (visible) {
      setQuery("");
      setStep("state");
      setPendingState(INDIA_STATES.find((s) => s.code === selectedState) ?? null);
    }
  }, [visible, selectedState]);

  const filteredStates = useMemo(() => {
    if (!query.trim()) return INDIA_STATES;
    const q = query.trim().toLowerCase();
    return INDIA_STATES.filter(
      (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    );
  }, [query]);

  const filteredDistricts = useMemo(() => {
    if (!pendingState) return [];
    if (!query.trim()) return pendingState.districts;
    const q = query.trim().toLowerCase();
    return pendingState.districts.filter(
      (d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)
    );
  }, [pendingState, query]);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 12) : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom + 16;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { paddingTop: topPad + 8, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (step === "district") {
                setStep("state");
                setQuery("");
              } else {
                onClose();
              }
            }}
            style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
            activeOpacity={0.7}
          >
            <Feather name={step === "state" ? "x" : "arrow-left"} size={20} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {step === "state" ? "Select State / UT" : pendingState?.name}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {step === "state"
                ? `${INDIA_STATES.length} states & UTs`
                : `${pendingState?.districts.length} districts`}
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Feather name="search" size={18} color={colors.mutedForeground} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={step === "state" ? "Search state…" : "Search district…"}
              placeholderTextColor={colors.mutedForeground}
              style={{
                flex: 1,
                fontSize: 15,
                fontWeight: "600",
                color: colors.foreground,
                paddingVertical: 0,
              }}
              autoFocus={false}
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")} hitSlop={10}>
                <Feather name="x-circle" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* List */}
        {step === "state" ? (
          <FlatList
            data={filteredStates}
            keyExtractor={(s) => s.code}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad + 16 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => {
              const isSelected = item.code === selectedState;
              return (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPendingState(item);
                    setQuery("");
                    setStep("district");
                  }}
                  activeOpacity={0.85}
                  style={[
                    styles.row,
                    {
                      backgroundColor: isSelected ? colors.primary + "15" : colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderRadius: colors.radius,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.codeBadge,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.secondary,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: isSelected ? colors.primaryForeground : colors.primary,
                        fontWeight: "800",
                        fontSize: 12,
                        letterSpacing: 0.5,
                      }}
                    >
                      {item.code}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowName, { color: colors.foreground }]}>{item.name}</Text>
                    <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
                      {item.districts.length} districts
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Feather name="search" size={28} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No states match &ldquo;{query}&rdquo;
                </Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={filteredDistricts}
            keyExtractor={(d) => d.code}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad + 16 }}
            ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
            renderItem={({ item }) => {
              const isSelected =
                pendingState?.code === selectedState && item.code === selectedDistrict;
              return (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    if (pendingState) onSelect(pendingState, item);
                    onClose();
                  }}
                  activeOpacity={0.85}
                  style={[
                    styles.row,
                    {
                      backgroundColor: isSelected ? colors.primary + "15" : colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderRadius: colors.radius,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.codeBadge,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.secondary,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: isSelected ? colors.primaryForeground : colors.primary,
                        fontWeight: "800",
                        fontSize: 11,
                        letterSpacing: 0.5,
                      }}
                    >
                      {item.code}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowName, { color: colors.foreground }]}>{item.name}</Text>
                    <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
                      {pendingState?.code}-{item.code}
                    </Text>
                  </View>
                  {isSelected && <Feather name="check" size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Feather name="search" size={28} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No districts match &ldquo;{query}&rdquo;
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "800" },
  subtitle: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1.5,
  },
  codeBadge: {
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowName: { fontSize: 15, fontWeight: "700" },
  rowMeta: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  empty: { alignItems: "center", padding: 48, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: "500", textAlign: "center" },
});
