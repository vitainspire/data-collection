import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Polyline, Polygon, Circle, Line } from "react-native-svg";

import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";
import { useVisitContext } from "./_layout";
import {
  GeoPoint,
  polygonAreaSqMeters,
  projectToCanvas,
  sqMetersToAcres,
  trackDistanceMeters,
} from "@/utils/geo";

type WalkState = "idle" | "tracking" | "paused" | "done";

const MIN_MOVE_M = 1.5; // ignore noise smaller than this

export default function WalkerScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updateData } = useVisitContext();

  const [walkState, setWalkState] = useState<WalkState>("idle");
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 360, height: 360 });

  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const webWatchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const elapsedAccumRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Distance / area derived
  const distance = trackDistanceMeters(points);
  const closedPoints = points.length >= 3 ? points : [];
  const areaSqM = polygonAreaSqMeters(closedPoints);
  const acres = sqMetersToAcres(areaSqM);

  // Cleanup
  useEffect(() => {
    return () => {
      stopWatchInternal();
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  // Tick for elapsed time
  useEffect(() => {
    if (walkState === "tracking") {
      tickRef.current = setInterval(() => {
        if (startTimeRef.current !== null) {
          setElapsed(elapsedAccumRef.current + (Date.now() - startTimeRef.current));
        }
      }, 200);
    } else if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [walkState]);

  const handleNewPoint = (p: GeoPoint, acc: number | null) => {
    if (acc !== null) setAccuracy(acc);
    setPoints((prev) => {
      if (prev.length === 0) return [p];
      const last = prev[prev.length - 1];
      // Distance filter to drop GPS noise
      const dLat = ((p.latitude - last.latitude) * Math.PI) / 180;
      const dLon = ((p.longitude - last.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((last.latitude * Math.PI) / 180) *
          Math.cos((p.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      const d = 2 * 6378137 * Math.asin(Math.sqrt(a));
      if (d < MIN_MOVE_M) return prev;
      return [...prev, p];
    });
  };

  const startWatchInternal = async () => {
    if (Platform.OS === "web") {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        Alert.alert("GPS unavailable", "Your browser does not support geolocation.");
        setPermissionDenied(true);
        return false;
      }
      webWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          handleNewPoint(
            {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              timestamp: pos.timestamp,
            },
            pos.coords.accuracy ?? null
          );
        },
        (err) => {
          if (err.code === 1) setPermissionDenied(true);
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
      return true;
    } else {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setPermissionDenied(true);
        return false;
      }
      watcherRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 1,
          timeInterval: 1000,
        },
        (loc) => {
          handleNewPoint(
            {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              timestamp: loc.timestamp,
            },
            loc.coords.accuracy ?? null
          );
        }
      );
      return true;
    }
  };

  const stopWatchInternal = () => {
    if (watcherRef.current) {
      watcherRef.current.remove();
      watcherRef.current = null;
    }
    if (webWatchIdRef.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(webWatchIdRef.current);
      webWatchIdRef.current = null;
    }
  };

  const start = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const ok = await startWatchInternal();
    if (!ok) return;
    startTimeRef.current = Date.now();
    setWalkState("tracking");
  };

  const pause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    stopWatchInternal();
    if (startTimeRef.current !== null) {
      elapsedAccumRef.current += Date.now() - startTimeRef.current;
      startTimeRef.current = null;
    }
    setWalkState("paused");
  };

  const resume = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ok = await startWatchInternal();
    if (!ok) return;
    startTimeRef.current = Date.now();
    setWalkState("tracking");
  };

  const finish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    stopWatchInternal();
    if (startTimeRef.current !== null) {
      elapsedAccumRef.current += Date.now() - startTimeRef.current;
      startTimeRef.current = null;
    }
    setWalkState("done");
  };

  const reset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    stopWatchInternal();
    setPoints([]);
    setElapsed(0);
    elapsedAccumRef.current = 0;
    startTimeRef.current = null;
    setWalkState("idle");
  };

  const useThisArea = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateData({ fieldArea: acres.toFixed(2) });
    router.back();
  };

  const projected = projectToCanvas(points, canvasSize.width, canvasSize.height);
  const polygonPts = projected.length >= 3 ? projected.map((p) => `${p.x},${p.y}`).join(" ") : "";
  const polylinePts = projected.map((p) => `${p.x},${p.y}`).join(" ");

  const mm = Math.floor(elapsed / 60000);
  const ss = Math.floor((elapsed % 60000) / 1000);
  const timeStr = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 12) : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
          activeOpacity={0.7}
        >
          <Feather name="x" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Acre Walker</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Walk the field perimeter to measure
          </Text>
        </View>
        {accuracy !== null && (
          <View style={[styles.accBadge, { backgroundColor: accuracy < 15 ? "#10b98122" : "#f59e0b22" }]}>
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={14}
              color={accuracy < 15 ? "#10b981" : "#f59e0b"}
            />
            <Text style={{ fontSize: 11, fontWeight: "700", color: accuracy < 15 ? "#10b981" : "#f59e0b" }}>
              ±{Math.round(accuracy)}m
            </Text>
          </View>
        )}
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <Stat colors={colors} value={acres.toFixed(2)} label="ACRES" big primary />
        <View style={styles.statsRow}>
          <Stat colors={colors} value={timeStr} label="TIME" />
          <Stat colors={colors} value={`${distance.toFixed(0)}m`} label="DISTANCE" />
          <Stat colors={colors} value={String(points.length)} label="POINTS" />
        </View>
      </View>

      {/* Map canvas */}
      <View
        style={[styles.canvas, { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: colors.radius }]}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width !== canvasSize.width || height !== canvasSize.height)
            setCanvasSize({ width, height });
        }}
      >
        {points.length === 0 ? (
          <View style={styles.canvasEmpty}>
            <MaterialCommunityIcons name="map-marker-path" size={42} color={colors.mutedForeground} />
            <Text style={[styles.canvasEmptyText, { color: colors.mutedForeground }]}>
              {permissionDenied
                ? "Location permission denied. Enable it in your device settings."
                : Platform.OS === "web"
                ? "Press Start, allow location, then walk the perimeter"
                : "Press Start to begin tracking"}
            </Text>
          </View>
        ) : (
          <Svg width={canvasSize.width} height={canvasSize.height}>
            {/* Grid */}
            {[0.25, 0.5, 0.75].map((f) => (
              <React.Fragment key={f}>
                <Line
                  x1={canvasSize.width * f}
                  y1={0}
                  x2={canvasSize.width * f}
                  y2={canvasSize.height}
                  stroke={colors.border}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
                <Line
                  x1={0}
                  y1={canvasSize.height * f}
                  x2={canvasSize.width}
                  y2={canvasSize.height * f}
                  stroke={colors.border}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
              </React.Fragment>
            ))}

            {/* Filled polygon (when 3+ points) */}
            {polygonPts ? (
              <Polygon
                points={polygonPts}
                fill={colors.primary}
                fillOpacity={0.18}
                stroke={colors.primary}
                strokeWidth={3}
                strokeLinejoin="round"
              />
            ) : (
              <Polyline
                points={polylinePts}
                fill="none"
                stroke={colors.primary}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Start marker */}
            <Circle
              cx={projected[0].x}
              cy={projected[0].y}
              r={8}
              fill="#10b981"
              stroke="#fff"
              strokeWidth={2}
            />

            {/* Live position */}
            {projected.length > 1 && (
              <Circle
                cx={projected[projected.length - 1].x}
                cy={projected[projected.length - 1].y}
                r={9}
                fill={colors.accent}
                stroke="#fff"
                strokeWidth={3}
              />
            )}
          </Svg>
        )}
      </View>

      {/* Action bar */}
      <View style={[styles.actions, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: Platform.OS === "web" ? 24 : insets.bottom + 12 }]}>
        {walkState === "idle" && (
          <Button
            title="Start Walking"
            icon={<Feather name="play" size={20} color={colors.primaryForeground} />}
            onPress={start}
          />
        )}
        {walkState === "tracking" && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button title="Pause" variant="outline" onPress={pause} style={{ flex: 1 }} icon={<Feather name="pause" size={18} color={colors.primary} />} />
            <Button title="Finish" onPress={finish} style={{ flex: 1 }} icon={<Feather name="check" size={18} color={colors.primaryForeground} />} disabled={points.length < 3} />
          </View>
        )}
        {walkState === "paused" && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button title="Reset" variant="outline" onPress={reset} style={{ flex: 1 }} icon={<Feather name="rotate-ccw" size={18} color={colors.primary} />} />
            <Button title="Resume" onPress={resume} style={{ flex: 1 }} icon={<Feather name="play" size={18} color={colors.primaryForeground} />} />
          </View>
        )}
        {walkState === "done" && (
          <View style={{ gap: 10 }}>
            <Button
              title={`Use ${acres.toFixed(2)} acres`}
              onPress={useThisArea}
              icon={<Feather name="check-circle" size={20} color={colors.primaryForeground} />}
              disabled={acres <= 0}
            />
            <Button title="Walk Again" variant="outline" onPress={reset} icon={<Feather name="rotate-ccw" size={18} color={colors.primary} />} />
          </View>
        )}
      </View>
    </View>
  );
}

function Stat({
  colors,
  value,
  label,
  big = false,
  primary = false,
}: {
  colors: any;
  value: string;
  label: string;
  big?: boolean;
  primary?: boolean;
}) {
  return (
    <View style={[styles.stat, big && { paddingVertical: 16 }]}>
      <Text
        style={{
          fontSize: big ? 56 : 22,
          fontWeight: "900",
          color: primary ? colors.primary : colors.foreground,
          letterSpacing: -1,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: big ? 12 : 10,
          fontWeight: "800",
          color: colors.mutedForeground,
          letterSpacing: 1.5,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
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
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "800" },
  subtitle: { fontSize: 12, marginTop: 2 },
  accBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statsGrid: { padding: 16, gap: 12 },
  statsRow: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, alignItems: "center" },
  canvas: {
    flex: 1,
    margin: 16,
    marginTop: 0,
    borderWidth: 1,
    overflow: "hidden",
  },
  canvasEmpty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  canvasEmptyText: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  actions: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
