import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  hint?: string;
  uri: string | null;
  onChange: (uri: string) => void;
  optional?: boolean;
  height?: number;
}

export function CapturePhotoCard({ label, hint, uri, onChange, optional, height = 180 }: Props) {
  const colors = useColors();

  const capture = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      let pickedUri: string | null = null;
      if (Platform.OS === "web") {
        const r = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
        });
        if (!r.canceled) pickedUri = r.assets[0].uri;
      } else {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== "granted") {
          Alert.alert("Camera permission", "Please allow camera access to take photos.");
          return;
        }
        const r = await ImagePicker.launchCameraAsync({ quality: 0.7 });
        if (!r.canceled) pickedUri = r.assets[0].uri;
      }
      if (pickedUri) {
        onChange(pickedUri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      console.log("capture error", e);
    }
  };

  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
        {optional && (
          <Text style={[styles.optional, { color: colors.mutedForeground }]}>  Optional</Text>
        )}
      </View>
      {hint && (
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>{hint}</Text>
      )}
      <TouchableOpacity
        onPress={capture}
        activeOpacity={0.85}
        style={[
          styles.card,
          {
            height,
            backgroundColor: colors.card,
            borderColor: uri ? colors.primary : colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        {uri ? (
          <>
            <Image source={{ uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            <View style={[styles.overlayBadge, { backgroundColor: colors.primary }]}>
              <Feather name="camera" size={13} color={colors.primaryForeground} />
              <Text style={{ color: colors.primaryForeground, fontWeight: "700", fontSize: 12 }}>
                Retake
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.empty}>
            <View style={[styles.iconBg, { backgroundColor: colors.secondary }]}>
              <Feather name="camera" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.tap, { color: colors.foreground }]}>Tap to capture</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  optional: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  hint: { fontSize: 12, fontWeight: "500", marginBottom: 8, marginTop: -4 },
  card: {
    borderWidth: 2,
    borderStyle: "dashed",
    overflow: "hidden",
    position: "relative",
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  tap: { fontSize: 14, fontWeight: "700" },
  overlayBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
});
