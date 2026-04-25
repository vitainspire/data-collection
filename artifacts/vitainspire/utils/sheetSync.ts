import type { Field } from "@/hooks/useStore";

const URL = process.env.EXPO_PUBLIC_SHEET_BRIDGE_URL ?? "";

async function post(action: string, data: object) {
  if (!URL) {
    console.warn("[sheetSync] EXPO_PUBLIC_SHEET_BRIDGE_URL not set");
    return;
  }
  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action, data }),
    });
    const json = await res.json();
    if (!json.ok) console.warn("[sheetSync] action failed:", action, json);
  } catch (err) {
    console.warn("[sheetSync] fetch error:", action, err);
  }
}

export function syncFieldToSheet(field: Field) {
  post("syncField", {
    numericId:    field.numericId,
    id:           field.id,
    cropType:     field.cropType,
    area:         field.area,
    state:        field.state,
    stateName:    field.stateName,
    district:     field.district,
    districtName: field.districtName,
    cropDetails:  field.cropDetails,
    gps:          field.gps,
    status:       field.status,
    createdBy:    field.createdBy,
    createdAt:    field.createdAt,
  });
}

export function syncZonesToSheet(field: Field) {
  if (!field.zones) return;
  post("syncStanding", {
    numericId: field.numericId,
    id:        field.id,
    cropType:  field.cropType,
    status:    field.status,
    zones:     field.zones,
  });
}

export function syncCutToSheet(field: Field) {
  post("syncCut", {
    numericId: field.numericId,
    id:        field.id,
    cropType:  field.cropType,
    cut:       field.cut,
    cutData:   field.cutData,
  });
}

export function syncChoppedToSheet(field: Field) {
  post("syncChopped", {
    numericId:   field.numericId,
    id:          field.id,
    cropType:    field.cropType,
    chopped:     field.chopped,
    choppedData: field.choppedData,
  });
}
