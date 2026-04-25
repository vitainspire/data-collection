/**
 * Google Drive Bridge Upload Utility
 *
 * Converts local photo URIs to base64 and uploads them to Google Drive
 * via the GAS Web App bridge, with rich contextual file names.
 *
 * Set EXPO_PUBLIC_GAS_BRIDGE_URL in your .env file to the deployed Web App URL.
 */

import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import type {
  Field,
  SilageData,
  ZoneData,
  CutObservation,
  ChoppedObservation,
} from "@/hooks/useStore";

const GAS_URL = process.env.EXPO_PUBLIC_GAS_BRIDGE_URL ?? "";
const FOLDER_ID = process.env.EXPO_PUBLIC_DRIVE_FOLDER_ID ?? "";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Sanitise a string so it's safe to use in a filename */
function safe(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-_]/g, "");
}

/** Format an ISO timestamp to YYYYMMDD-HHmm */
function stamp(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}`
  );
}

/** Convert a local URI to base64 (handles data:, blob:, and native file URIs) */
async function toBase64(uri: string): Promise<string> {
  if (uri.startsWith("data:")) {
    return uri.split(",")[1];
  }
  if (Platform.OS === "web" || uri.startsWith("blob:")) {
    // Web: fetch the blob, read with FileReader
    const blob = await fetch(uri).then((r) => r.blob());
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  // Native file URI
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

// ─── Upload core ─────────────────────────────────────────────────────────────

export interface UploadResult {
  status: "success" | "error";
  url?: string;
  fileId?: string;
  message?: string;
}

/**
 * Upload a single photo to Google Drive.
 *
 * @param uri       Local file URI (from expo-image-picker)
 * @param fileName  Contextual filename (without extension)
 * @param mimeType  Defaults to image/jpeg
 */
export async function uploadPhoto(
  uri: string,
  fileName: string,
  mimeType = "image/jpeg",
  metadata: Record<string, string> = {}
): Promise<UploadResult> {
  if (!GAS_URL) {
    console.warn("[driveUpload] EXPO_PUBLIC_GAS_BRIDGE_URL is not set.");
    return { status: "error", message: "GAS bridge URL not configured." };
  }

  try {
    const base64 = await toBase64(uri);
    const ext = mimeType === "image/png" ? "png" : "jpg";
    const fullName = `${fileName}.${ext}`;

    console.log("[driveUpload] uploading:", fullName, "url:", GAS_URL.slice(0, 60));

    const res = await fetch(GAS_URL, {
      method: "POST",
      // text/plain avoids CORS preflight — GAS parses e.postData.contents regardless
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ base64, fileName: fullName, mimeType, folderId: FOLDER_ID, metadata }),
    });

    const text = await res.text();
    console.log("[driveUpload] raw response:", text.slice(0, 200));

    let json: UploadResult;
    try { json = JSON.parse(text); }
    catch { return { status: "error", message: "Non-JSON response: " + text.slice(0, 100) }; }

    if (json.status !== "success") console.warn("[driveUpload] failed:", fileName, json);
    else console.log("[driveUpload] ✅ uploaded:", json.url);
    return json;
  } catch (err: any) {
    console.warn("[driveUpload] fetch error:", fileName, err?.message ?? String(err));
    return { status: "error", message: err?.message ?? String(err) };
  }
}

// ─── Contextual filename builders ────────────────────────────────────────────

/**
 * Farmer profile photo
 * Pattern: farmer-profile_<farmerName>_<date>
 */
export function farmerProfileFileName(farmerName: string): string {
  return `farmer-profile_${safe(farmerName)}_${stamp()}`;
}

/**
 * Standing plant photo (overview of the standing crop)
 * Pattern: <fieldId>_<crop>_standing-plant_<capturedBy>_<date>
 */
export function standingPlantFileName(field: Field): string {
  return [
    field.id,
    safe(field.cropType),
    "standing-plant",
    safe(field.standing.capturedBy),
    stamp(field.standing.capturedAt),
  ].join("_");
}

/**
 * Standing leaf/cob photo
 * Pattern: <fieldId>_<crop>_standing-leafcob_<capturedBy>_<date>
 */
export function standingLeafCobFileName(field: Field): string {
  return [
    field.id,
    safe(field.cropType),
    "standing-leafcob",
    safe(field.standing.capturedBy),
    stamp(field.standing.capturedAt),
  ].join("_");
}

/**
 * Zone sampling photo (plant or cob within a zone)
 * Pattern: <fieldId>_<crop>_zone<Z>-<photoType>_ht<height>_col<color>_den<density>_<date>
 */
export function zonePhotoFileName(
  field: Field,
  zone: "A" | "B" | "C",
  photoType: "plant" | "cob",
  zoneData: ZoneData,
  capturedAt: string
): string {
  const attrs = [
    zoneData.plantHeight ? `ht-${safe(zoneData.plantHeight)}` : null,
    zoneData.plantColor ? `col-${safe(zoneData.plantColor)}` : null,
    zoneData.standDensity ? `den-${safe(zoneData.standDensity)}` : null,
  ]
    .filter(Boolean)
    .join("_");

  return [
    field.id,
    safe(field.cropType),
    `zone${zone}-${photoType}`,
    attrs,
    stamp(capturedAt),
  ]
    .filter(Boolean)
    .join("_");
}

/**
 * Cut (harvest) photo
 * Pattern: <fieldId>_<crop>_cut_yield-<yield>_moist-<moisture>_stubble-<stubble>_<capturedBy>_<date>
 */
export function cutPhotoFileName(
  field: Field,
  obs: CutObservation
): string {
  const attrs = [
    obs.yieldEstimate ? `yield-${safe(obs.yieldEstimate)}` : null,
    obs.moistureAtCut ? `moist-${safe(obs.moistureAtCut)}` : null,
    obs.stubbleHeight ? `stubble-${safe(obs.stubbleHeight)}` : null,
  ]
    .filter(Boolean)
    .join("_");

  return [
    field.id,
    safe(field.cropType),
    "cut",
    attrs,
    safe(obs.capturedBy ?? field.cut?.capturedBy ?? "unknown"),
    stamp(field.cut?.capturedAt),
  ]
    .filter(Boolean)
    .join("_");
}

/**
 * Chopped photo
 * Pattern: <fieldId>_<crop>_chopped_chop-<length>_uni-<uniformity>_qual-<quality>_<capturedBy>_<date>
 */
export function choppedPhotoFileName(
  field: Field,
  obs: ChoppedObservation
): string {
  const attrs = [
    obs.chopLength ? `chop-${safe(obs.chopLength)}` : null,
    obs.uniformity ? `uni-${safe(obs.uniformity)}` : null,
    obs.materialQuality ? `qual-${safe(obs.materialQuality)}` : null,
  ]
    .filter(Boolean)
    .join("_");

  return [
    field.id,
    safe(field.cropType),
    "chopped",
    attrs,
    safe(obs.capturedBy ?? field.chopped?.capturedBy ?? "unknown"),
    stamp(field.chopped?.capturedAt),
  ]
    .filter(Boolean)
    .join("_");
}

/**
 * Silage photo (one of 4 types per sample)
 * Pattern: <sampleId>_<crop>_silage-<photoType>_<storageType>_age<age>_pH<pH>_<smell>_mold-<mold>_<date>
 */
export type SilagePhotoType = "storage" | "cross-section" | "sample" | "texture";

export function silagePhotoFileName(
  silage: SilageData,
  photoType: SilagePhotoType
): string {
  const attrs = [
    silage.storageType ? `store-${safe(silage.storageType)}` : null,
    silage.age ? `age-${safe(silage.age)}days` : null,
    silage.pH ? `pH-${safe(silage.pH)}` : null,
    silage.smell ? `smell-${safe(silage.smell)}` : null,
    silage.mold ? `mold-${safe(silage.mold)}` : null,
  ]
    .filter(Boolean)
    .join("_");

  return [
    silage.sampleId,
    safe(silage.cropType || "unknown-crop"),
    `silage-${photoType}`,
    attrs,
    stamp(silage.submittedAt || undefined),
  ]
    .filter(Boolean)
    .join("_");
}

// ─── Batch upload helpers ─────────────────────────────────────────────────────

/**
 * Upload all photos for a field in one call.
 * Returns a map of photo slot → Drive URL (or null on failure).
 */
export async function uploadFieldPhotos(
  field: Field
): Promise<Record<string, string | null>> {
  const results: Record<string, string | null> = {};

  async function tryUpload(
    uri: string | null | undefined,
    name: string
  ): Promise<string | null> {
    if (!uri) return null;
    const r = await uploadPhoto(uri, name);
    return r.status === "success" ? (r.url ?? null) : null;
  }

  // Standing
  if (field.standing.plantUri) {
    results["standing.plantUri"] = await tryUpload(
      field.standing.plantUri,
      standingPlantFileName(field)
    );
  }
  if (field.standing.leafCobUri) {
    results["standing.leafCobUri"] = await tryUpload(
      field.standing.leafCobUri,
      standingLeafCobFileName(field)
    );
  }

  // Zones
  if (field.zones) {
    for (const zone of ["A", "B", "C"] as const) {
      const z = field.zones[zone];
      const at = field.zones.capturedAt;
      if (z.plantUri) {
        results[`zones.${zone}.plantUri`] = await tryUpload(
          z.plantUri,
          zonePhotoFileName(field, zone, "plant", z, at)
        );
      }
      if (z.cobUri) {
        results[`zones.${zone}.cobUri`] = await tryUpload(
          z.cobUri,
          zonePhotoFileName(field, zone, "cob", z, at)
        );
      }
    }
  }

  // Cut
  if (field.cut?.uri && field.cutData) {
    results["cut.uri"] = await tryUpload(
      field.cut.uri,
      cutPhotoFileName(field, field.cutData)
    );
  }

  // Chopped
  if (field.chopped?.uri && field.choppedData) {
    results["chopped.uri"] = await tryUpload(
      field.chopped.uri,
      choppedPhotoFileName(field, field.choppedData)
    );
  }

  // Silage — pass fieldId in metadata so GAS can route to the right folder
  if (field.silage) {
    const s = field.silage;
    const slots: [string | null, SilagePhotoType][] = [
      [s.photos.storage, "storage"],
      [s.photos.crossSection, "cross-section"],
      [s.photos.sample, "sample"],
      [s.photos.texture, "texture"],
    ];
    for (const [uri, type] of slots) {
      if (uri) {
        const name = silagePhotoFileName(s, type);
        const r = await uploadPhoto(uri, name, "image/jpeg", { fieldId: field.id });
        results[`silage.photos.${type}`] = r.status === "success" ? (r.url ?? null) : null;
      }
    }
  }

  return results;
}
