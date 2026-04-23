import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/useColors";

interface PhotoSlotProps {
  uri: string | null;
  onPhotoTaken: (uri: string) => void;
  label: string;
  hint?: string;
}

export function PhotoSlot({ uri, onPhotoTaken, label, hint }: PhotoSlotProps) {
  const colors = useColors();

  const handlePress = async () => {
    try {
      if (Platform.OS === "web") {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });
        if (!result.canceled) {
          onPhotoTaken(result.assets[0].uri);
        }
      } else {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          alert("Camera permission is required to take photos.");
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });

        if (!result.canceled) {
          onPhotoTaken(result.assets[0].uri);
        }
      }
    } catch (e) {
      console.log("Error taking photo", e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      {hint && <Text style={[styles.hint, { color: colors.mutedForeground }]}>{hint}</Text>}
      
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          styles.slot,
          { 
            backgroundColor: colors.secondary,
            borderColor: colors.border,
            borderRadius: colors.radius,
            borderStyle: uri ? "solid" : "dashed",
            borderWidth: 2,
          }
        ]}
      >
        {uri ? (
          <>
            <Image source={{ uri }} style={styles.image} contentFit="cover" />
            <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.4)" }]}>
              <Feather name="refresh-cw" size={24} color="#fff" />
              <Text style={styles.overlayText}>Retake</Text>
            </View>
          </>
        ) : (
          <View style={styles.empty}>
            <Feather name="camera" size={32} color={colors.primary} />
            <Text style={[styles.emptyText, { color: colors.primary }]}>Tap to capture</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    fontSize: 14,
    marginBottom: 4,
  },
  slot: {
    height: 160,
    width: "100%",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  overlayText: {
    color: "#fff",
    fontWeight: "600",
  },
  empty: {
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontWeight: "600",
  },
});
