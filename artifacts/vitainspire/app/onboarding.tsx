import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/hooks/useStore";
import { uniqueId } from "@/utils/idGenerator";

export default function OnboardingScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setFarmer } = useStore();

  const [name, setName] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const capturePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      let uri: string | null = null;
      if (Platform.OS === "web") {
        const r = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
        });
        if (!r.canceled) uri = r.assets[0].uri;
      } else {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== "granted") {
          Alert.alert("Camera permission", "Please allow camera access to take a photo.");
          return;
        }
        const r = await ImagePicker.launchCameraAsync({ quality: 0.7 });
        if (!r.canceled) uri = r.assets[0].uri;
      }
      if (uri) {
        setPhotoUri(uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      console.log("photo error", e);
    }
  };

  const handleContinue = async () => {
    if (!name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setFarmer({
      id: uniqueId(),
      name: name.trim(),
      photoUri,
      createdAt: new Date().toISOString(),
    });
    router.replace("/(tabs)");
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 12, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(500)} style={styles.brandRow}>
          <View style={[styles.brandIcon, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="leaf" size={24} color={colors.primaryForeground} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.brand, { color: colors.foreground }]}>Vitainspire</Text>
            <Text style={[styles.brandSub, { color: colors.mutedForeground }]}>
              Smart Farming. Better Yield.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <Text style={[styles.title, { color: colors.foreground }]}>Welcome</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Let&rsquo;s set up your profile so we can attach your name to every field you record.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(500)} style={{ marginTop: 28 }}>
          <Text style={[styles.label, { color: colors.foreground }]}>Farmer Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Ramesh Kumar"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="words"
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).duration(500)} style={{ marginTop: 24 }}>
          <Text style={[styles.label, { color: colors.foreground }]}>Profile Photo (optional)</Text>
          <TouchableOpacity
            onPress={capturePhoto}
            activeOpacity={0.85}
            style={[
              styles.photoCard,
              {
                backgroundColor: colors.card,
                borderColor: photoUri ? colors.primary : colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            {photoUri ? (
              <>
                <Image source={{ uri: photoUri }} style={styles.photoImg} contentFit="cover" />
                <View style={[styles.photoBadge, { backgroundColor: colors.primary }]}>
                  <Feather name="camera" size={14} color={colors.primaryForeground} />
                  <Text style={{ color: colors.primaryForeground, fontWeight: "700", fontSize: 12 }}>
                    Retake
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.photoEmpty}>
                <View style={[styles.photoIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name="camera" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.photoTitle, { color: colors.foreground }]}>
                  Capture Photo
                </Text>
                <Text style={[styles.photoSub, { color: colors.mutedForeground }]}>
                  Tap to take a photo of yourself
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(450).duration(500)} style={{ marginTop: 28 }}>
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={!name.trim() || saving}
            loading={saving}
            icon={<Feather name="arrow-right" size={20} color={colors.primaryForeground} />}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 32 },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },
  brandSub: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  title: { fontSize: 32, fontWeight: "800", letterSpacing: -1 },
  subtitle: { fontSize: 15, fontWeight: "500", marginTop: 6, lineHeight: 22 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    fontWeight: "600",
  },
  photoCard: {
    borderWidth: 2,
    borderStyle: "dashed",
    overflow: "hidden",
    minHeight: 220,
    position: "relative",
  },
  photoEmpty: { padding: 32, alignItems: "center", gap: 10 },
  photoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  photoTitle: { fontSize: 16, fontWeight: "700" },
  photoSub: { fontSize: 13, fontWeight: "500" },
  photoImg: { width: "100%", height: 220 },
  photoBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
