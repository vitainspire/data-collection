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
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import Animated, { FadeInDown, FadeIn, ZoomIn } from "react-native-reanimated";
import Svg, { Circle, Ellipse, Path, Rect, G, Defs, RadialGradient, Stop } from "react-native-svg";

import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/hooks/useStore";
import { uniqueId } from "@/utils/idGenerator";

const W = Math.min(Dimensions.get("window").width, 480);

// ── Farm illustration ─────────────────────────────────────────────────────────
function FarmIllustration({ size = 260 }: { size?: number }) {
  const s = size / 260;
  return (
    <Svg width={size} height={size * 0.78} viewBox="0 0 260 203">
      <Defs>
        <RadialGradient id="sky" cx="50%" cy="30%" r="70%">
          <Stop offset="0%" stopColor="#e8f5e9" />
          <Stop offset="100%" stopColor="#c8e6c9" />
        </RadialGradient>
      </Defs>

      {/* Sky */}
      <Rect x="0" y="0" width="260" height="203" rx="20" fill="url(#sky)" />

      {/* Sun */}
      <Circle cx="210" cy="38" r="22" fill="#fef08a" opacity="0.9" />
      <Circle cx="210" cy="38" r="16" fill="#fde047" />

      {/* Clouds */}
      <G opacity="0.85">
        <Ellipse cx="60" cy="30" rx="22" ry="13" fill="#fff" />
        <Ellipse cx="78" cy="26" rx="18" ry="11" fill="#fff" />
        <Ellipse cx="42" cy="26" rx="16" ry="10" fill="#fff" />
      </G>
      <G opacity="0.7">
        <Ellipse cx="160" cy="48" rx="16" ry="9" fill="#fff" />
        <Ellipse cx="174" cy="44" rx="13" ry="8" fill="#fff" />
        <Ellipse cx="147" cy="44" rx="12" ry="8" fill="#fff" />
      </G>

      {/* Ground */}
      <Ellipse cx="130" cy="185" rx="120" ry="22" fill="#4ade80" opacity="0.35" />
      <Rect x="0" y="160" width="260" height="43" rx="0" fill="#16a34a" opacity="0.18" />
      <Rect x="0" y="170" width="260" height="33" rx="0" fill="#15803d" opacity="0.22" />

      {/* Barn */}
      <Rect x="148" y="108" width="62" height="60" rx="3" fill="#dc2626" />
      <Path d="M145 112 L179 82 L213 112Z" fill="#b91c1c" />
      <Rect x="166" y="130" width="16" height="22" rx="2" fill="#7f1d1d" opacity="0.8" />
      <Rect x="152" y="115" width="14" height="14" rx="2" fill="#fef9c3" opacity="0.9" />
      <Rect x="188" y="115" width="14" height="14" rx="2" fill="#fef9c3" opacity="0.9" />

      {/* Corn rows */}
      {[40, 58, 76, 94].map((x, i) => (
        <G key={i}>
          <Rect x={x} y="130" width="7" height="38" rx="3" fill="#16a34a" />
          <Ellipse cx={x + 3.5} cy="127" rx="7" ry="9" fill="#22c55e" />
          <Ellipse cx={x + 3.5} cy="118" rx="5" ry="7" fill="#4ade80" />
          {/* Cob */}
          <Rect x={x + 1} y="134" width="5" height="10" rx="2" fill="#fbbf24" />
        </G>
      ))}

      {/* Tractor */}
      <G>
        {/* Body */}
        <Rect x="88" y="148" width="42" height="22" rx="5" fill="#15803d" />
        {/* Cabin */}
        <Rect x="100" y="138" width="22" height="14" rx="4" fill="#166534" />
        <Rect x="102" y="140" width="10" height="9" rx="2" fill="#bfdbfe" opacity="0.85" />
        {/* Wheels */}
        <Circle cx="96" cy="172" r="11" fill="#1c1917" />
        <Circle cx="96" cy="172" r="7" fill="#44403c" />
        <Circle cx="122" cy="172" r="8" fill="#1c1917" />
        <Circle cx="122" cy="172" r="5" fill="#44403c" />
        {/* Exhaust */}
        <Rect x="128" y="140" width="4" height="12" rx="2" fill="#374151" />
        <Ellipse cx="130" cy="138" rx="4" ry="3" fill="#9ca3af" opacity="0.6" />
      </G>

      {/* Trees */}
      <G>
        <Rect x="22" y="148" width="8" height="24" rx="3" fill="#92400e" />
        <Circle cx="26" cy="138" r="18" fill="#16a34a" />
        <Circle cx="26" cy="132" r="13" fill="#22c55e" />
      </G>
      <G>
        <Rect x="230" y="152" width="6" height="18" rx="3" fill="#92400e" />
        <Circle cx="233" cy="143" r="14" fill="#16a34a" />
        <Circle cx="233" cy="138" r="10" fill="#22c55e" />
      </G>
    </Svg>
  );
}

// ── Feature bubbles ───────────────────────────────────────────────────────────
function FeatureBubble({ icon, label, color, bg, delay }: {
  icon: string; label: string; color: string; bg: string; delay: number;
}) {
  return (
    <Animated.View entering={ZoomIn.delay(delay).springify().damping(12)} style={styles.bubble}>
      <View style={[styles.bubbleIcon, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon as any} size={28} color={color} />
      </View>
      <Text style={[styles.bubbleLabel, { color: "#374151" }]}>{label}</Text>
    </Animated.View>
  );
}

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
        const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
        if (!r.canceled) uri = r.assets[0].uri;
      } else {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== "granted") { Alert.alert("Camera permission", "Please allow camera access."); return; }
        const r = await ImagePicker.launchCameraAsync({ quality: 0.7 });
        if (!r.canceled) uri = r.assets[0].uri;
      }
      if (uri) { setPhotoUri(uri); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
    } catch (e) { console.log("photo error", e); }
  };

  const handleContinue = async () => {
    if (!name.trim()) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); return; }
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setFarmer({ id: uniqueId(), name: name.trim(), photoUri, createdAt: new Date().toISOString() });
    router.replace("/home");
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 32) : insets.top;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "#f0fdf4" }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>

          {/* Logo */}
          <Animated.View entering={FadeIn.duration(600)} style={styles.logoRow}>
            <View style={styles.logoWrap}>
              <MaterialCommunityIcons name="leaf" size={26} color="#fff" />
            </View>
            <View>
              <Text style={styles.logoName}>Vitainspire</Text>
              <Text style={styles.logoTag}>Smart Farming. Better Yield.</Text>
            </View>
          </Animated.View>

          {/* Illustration */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.illustrationWrap}>
            <FarmIllustration size={W * 0.88} />
          </Animated.View>

          {/* Feature bubbles */}
          <View style={styles.bubblesRow}>
            <FeatureBubble icon="sprout"       label="Track Fields"  color="#15803d" bg="#dcfce7" delay={200} />
            <FeatureBubble icon="camera"        label="Photo Logs"   color="#0369a1" bg="#dbeafe" delay={300} />
            <FeatureBubble icon="chart-bar"     label="Stage Data"   color="#7c3aed" bg="#ede9fe" delay={400} />
          </View>

          {/* Heading */}
          <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.headingWrap}>
            <Text style={styles.title}>Welcome 👋</Text>
            <Text style={styles.subtitle}>
              Set up your profile and we'll attach your name to every field capture automatically.
            </Text>
          </Animated.View>

          {/* Name input */}
          <Animated.View entering={FadeInDown.delay(450).duration(500)} style={styles.fieldWrap}>
            <Text style={styles.label}>Your Name</Text>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#6b7280" style={{ marginLeft: 14 }} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                style={styles.input}
              />
            </View>
          </Animated.View>

          {/* Profile photo */}
          <Animated.View entering={FadeInDown.delay(520).duration(500)} style={styles.fieldWrap}>
            <Text style={styles.label}>Profile Photo <Text style={styles.optional}>(optional)</Text></Text>
            <TouchableOpacity onPress={capturePhoto} activeOpacity={0.85} style={styles.photoCard}>
              {photoUri ? (
                <>
                  <Image source={{ uri: photoUri }} style={styles.photoImg} contentFit="cover" />
                  <View style={styles.retakeBadge}>
                    <Feather name="camera" size={14} color="#fff" />
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Retake</Text>
                  </View>
                </>
              ) : (
                <View style={styles.photoEmpty}>
                  <View style={styles.photoBubble}>
                    <Feather name="camera" size={32} color="#15803d" />
                  </View>
                  <Text style={styles.photoTitle}>Tap to add a photo</Text>
                  <Text style={styles.photoSub}>Helps identify you on shared devices</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* CTA */}
          <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.fieldWrap}>
            <Button
              title="Let's Go"
              onPress={handleContinue}
              disabled={!name.trim() || saving}
              loading={saving}
              icon={<Feather name="arrow-right" size={20} color="#fff" />}
            />
            {!name.trim() && (
              <Text style={styles.hint}>Enter your name to continue</Text>
            )}
          </Animated.View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: "#f0fdf4" },
  container: { alignItems: "center", paddingHorizontal: 24, maxWidth: 480, width: "100%", alignSelf: "center" },

  // Logo
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24, alignSelf: "flex-start" },
  logoWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#15803d", alignItems: "center", justifyContent: "center", shadowColor: "#15803d", shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  logoName: { fontSize: 20, fontWeight: "800", color: "#14532d", letterSpacing: -0.3 },
  logoTag: { fontSize: 12, color: "#4b5563", fontWeight: "500", marginTop: 1 },

  // Illustration
  illustrationWrap: { width: "100%", alignItems: "center", marginBottom: 16 },

  // Feature bubbles
  bubblesRow: { flexDirection: "row", gap: 12, marginBottom: 28, width: "100%", justifyContent: "center" },
  bubble: { alignItems: "center", gap: 8, flex: 1 },
  bubbleIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  bubbleLabel: { fontSize: 11, fontWeight: "700", textAlign: "center" },

  // Heading
  headingWrap: { width: "100%", alignItems: "center", marginBottom: 28 },
  title: { fontSize: 30, fontWeight: "900", color: "#14532d", letterSpacing: -0.5, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#4b5563", marginTop: 8, textAlign: "center", lineHeight: 22, maxWidth: 320 },

  // Form
  fieldWrap: { width: "100%", marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "800", color: "#374151", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  optional: { fontSize: 12, fontWeight: "500", textTransform: "none", color: "#9ca3af" },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#d1fae5", borderRadius: 14, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 15, fontSize: 16, fontWeight: "600", color: "#111827" },

  // Photo
  photoCard: { borderWidth: 2, borderStyle: "dashed", borderColor: "#86efac", borderRadius: 16, overflow: "hidden", backgroundColor: "#fff", minHeight: 160 },
  photoEmpty: { padding: 28, alignItems: "center", gap: 10 },
  photoBubble: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center", marginBottom: 4, shadowColor: "#15803d", shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  photoTitle: { fontSize: 15, fontWeight: "700", color: "#14532d" },
  photoSub: { fontSize: 12, color: "#6b7280", textAlign: "center" },
  photoImg: { width: "100%", height: 200 },
  retakeBadge: { position: "absolute", bottom: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#15803d", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },

  hint: { textAlign: "center", marginTop: 10, fontSize: 12, color: "#9ca3af", fontWeight: "600" },
});
