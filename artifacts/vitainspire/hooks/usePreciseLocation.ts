import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";

export interface PreciseGPS {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  capturedAt: string;
}

export type GpsStatus = "idle" | "requesting" | "ready" | "denied" | "error";

export function usePreciseLocation() {
  const [gps, setGps] = useState<PreciseGPS | null>(null);
  const [status, setStatus] = useState<GpsStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const webWatchIdRef = useRef<number | null>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);

  const stop = useCallback(() => {
    if (subRef.current) {
      subRef.current.remove();
      subRef.current = null;
    }
    if (webWatchIdRef.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(webWatchIdRef.current);
      webWatchIdRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    setStatus("requesting");
    setError(null);

    if (Platform.OS === "web") {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        setStatus("error");
        setError("Browser does not support geolocation.");
        return;
      }
      // Always start a watch so accuracy improves over time
      webWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setGps({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy ?? null,
            altitude: pos.coords.altitude ?? null,
            capturedAt: new Date(pos.timestamp).toISOString(),
          });
          setStatus("ready");
        },
        (err) => {
          if (err.code === 1) {
            setStatus("denied");
            setError("Location permission denied.");
          } else {
            setStatus("error");
            setError(err.message || "Could not get location.");
          }
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
      return;
    }

    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== "granted") {
      setStatus("denied");
      setError("Location permission denied.");
      return;
    }
    try {
      subRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 0,
          timeInterval: 1500,
        },
        (loc) => {
          setGps({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy ?? null,
            altitude: loc.coords.altitude ?? null,
            capturedAt: new Date(loc.timestamp).toISOString(),
          });
          setStatus("ready");
        }
      );
    } catch (e: any) {
      setStatus("error");
      setError(e?.message ?? "Could not start GPS.");
    }
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { gps, status, error, start, stop };
}

export function formatLatLon(g: PreciseGPS): string {
  const lat = g.latitude;
  const lon = g.longitude;
  const latStr = `${Math.abs(lat).toFixed(5)}°${lat >= 0 ? "N" : "S"}`;
  const lonStr = `${Math.abs(lon).toFixed(5)}°${lon >= 0 ? "E" : "W"}`;
  return `${latStr}, ${lonStr}`;
}
