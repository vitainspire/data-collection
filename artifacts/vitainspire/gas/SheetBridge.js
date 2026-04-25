/**
 * Vitainspire — Google Sheets Bridge
 * ====================================
 * HOW TO DEPLOY
 * 1. Go to https://sheets.google.com → create a NEW spreadsheet
 *    named "Vitainspire Field Data"
 * 2. Extensions → Apps Script → paste this entire file
 * 3. Save, then Deploy → New Deployment
 *    · Type: Web App
 *    · Execute as: Me
 *    · Who has access: Anyone
 * 4. Copy the Web App URL → paste as EXPO_PUBLIC_SHEET_BRIDGE_URL in .env.local
 *
 * SHEET TABS (auto-created on first request):
 *   Fields        — master list of every registered field
 *   Standing      — zone A / B / C plant observations
 *   Cut           — cut-stage photo + observations
 *   Chopped       — chopped-stage photo + observations
 *   Audit Trail   — who did what and when
 */

// ─── Sheet names ──────────────────────────────────────────────────────────────

const TAB = {
  FIELDS:   "Fields",
  STANDING: "Standing",
  CUT:      "Cut",
  CHOPPED:  "Chopped",
  AUDIT:    "Audit Trail",
};

// ─── Entry points ─────────────────────────────────────────────────────────────

function doGet() {
  ensureAllSheets_();
  return text_("✅ Vitainspire Sheet Bridge ONLINE");
}

function doPost(e) {
  try {
    ensureAllSheets_();
    const { action, data } = JSON.parse(e.postData.contents);

    switch (action) {
      case "syncField":    return json_(syncField_(data));
      case "syncStanding": return json_(syncStanding_(data));
      case "syncCut":      return json_(syncCut_(data));
      case "syncChopped":  return json_(syncChopped_(data));
      default:
        return json_({ ok: false, error: "Unknown action: " + action });
    }
  } catch (err) {
    return json_({ ok: false, error: err.toString() });
  }
}

// ─── Field tab ────────────────────────────────────────────────────────────────
//
//  Col:  A         B          C      D             E       F          G             H             I           J        K        L         M       N            O
//        Field #   Field ID   Crop   Area (acres)  State   District   Sowing Date   Harvest Due   Irrigation  GPS Lat  GPS Lon  Accuracy  Status  Created By   Created At

function syncField_(d) {
  const sh = sheet_(TAB.FIELDS);
  const row = [
    d.numericId,
    d.id,
    d.cropType,
    d.area || "",
    d.stateName || d.state || "",
    d.districtName || d.district || "",
    d.cropDetails?.sowingDate || "",
    d.cropDetails?.expectedHarvestDate || "",
    d.cropDetails?.irrigation || "",
    d.gps?.latitude  || "",
    d.gps?.longitude || "",
    d.gps?.accuracy  || "",
    d.status || "standing",
    d.createdBy || "",
    fmt_(d.createdAt),
  ];

  const r = findRow_(sh, 1, d.numericId);
  if (r > 0) {
    sh.getRange(r, 1, 1, row.length).setValues([row]);
    tintRow_(sh, r, d.status);
  } else {
    sh.appendRow(row);
    tintRow_(sh, sh.getLastRow(), d.status);
  }

  audit_(d.numericId, d.id, "Field", "sync", d.createdBy, "status=" + d.status);
  return { ok: true, action: "syncField", fieldNum: d.numericId };
}

// ─── Standing tab ─────────────────────────────────────────────────────────────
//
//  Col:  A         B          C      D     E              F             G              H           I            J
//        Field #   Field ID   Crop   Zone  Plant Height   Plant Color   Stand Density  Photo URL   Captured By  Captured At

function syncStanding_(d) {
  const sh = sheet_(TAB.STANDING);
  const zones = d.zones || {};
  const capturedBy = zones.capturedBy || "";
  const capturedAt = zones.capturedAt || "";

  for (const zone of ["A", "B", "C"]) {
    const z = zones[zone] || {};
    const row = [
      d.numericId,
      d.id,
      d.cropType,
      zone,
      z.plantHeight  || "",
      z.plantColor   || "",
      z.standDensity || "",
      z.plantUri     || "",   // local URI initially; Drive URL once uploaded
      capturedBy,
      fmt_(capturedAt),
    ];

    const r = findZoneRow_(sh, d.numericId, zone);
    if (r > 0) {
      sh.getRange(r, 1, 1, row.length).setValues([row]);
    } else {
      sh.appendRow(row);
    }
  }

  // Also update the status column in Fields tab
  updateStatus_(d.numericId, d.status || "standing");
  audit_(d.numericId, d.id, "Standing", "sync", capturedBy, "zones A/B/C");
  return { ok: true, action: "syncStanding" };
}

// ─── Cut tab ──────────────────────────────────────────────────────────────────
//
//  Col:  A         B          C      D               E               F               G              H          I            J
//        Field #   Field ID   Crop   Harvest Method  Crop Condition  Cutting Height  Lodging        Photo URL  Captured By  Captured At

function syncCut_(d) {
  const sh = sheet_(TAB.CUT);
  const cut = d.cut     || {};
  const obs = d.cutData || {};

  const row = [
    d.numericId,
    d.id,
    d.cropType,
    obs.harvestMethod  || "",
    obs.cropCondition  || "",
    obs.cuttingHeight  || "",
    obs.lodging        || "",
    cut.uri            || "",
    cut.capturedBy || obs.capturedBy || "",
    fmt_(cut.capturedAt || obs.savedAt),
  ];

  const r = findRow_(sh, 1, d.numericId);
  if (r > 0) {
    sh.getRange(r, 1, 1, row.length).setValues([row]);
    tintRow_(sh, r, "cut");
  } else {
    sh.appendRow(row);
    tintRow_(sh, sh.getLastRow(), "cut");
  }

  updateStatus_(d.numericId, "cut");
  audit_(d.numericId, d.id, "Cut", "sync", cut.capturedBy || "", "yield=" + obs.yieldEstimate);
  return { ok: true, action: "syncCut" };
}

// ─── Chopped tab ──────────────────────────────────────────────────────────────
//
//  Col:  A         B          C      D            E            F                G          H            I
//        Field #   Field ID   Crop   Chop Length  Uniformity   Material Quality Photo URL  Captured By  Captured At

function syncChopped_(d) {
  const sh = sheet_(TAB.CHOPPED);
  const chopped = d.chopped     || {};
  const obs     = d.choppedData || {};

  const row = [
    d.numericId,
    d.id,
    d.cropType,
    obs.chopLength      || "",
    obs.uniformity      || "",
    obs.materialQuality || "",
    chopped.uri         || "",
    chopped.capturedBy || obs.capturedBy || "",
    fmt_(chopped.capturedAt || obs.savedAt),
  ];

  const r = findRow_(sh, 1, d.numericId);
  if (r > 0) {
    sh.getRange(r, 1, 1, row.length).setValues([row]);
    tintRow_(sh, r, "chopped");
  } else {
    sh.appendRow(row);
    tintRow_(sh, sh.getLastRow(), "chopped");
  }

  updateStatus_(d.numericId, "chopped");
  audit_(d.numericId, d.id, "Chopped", "sync", chopped.capturedBy || "", "chop=" + obs.chopLength);
  return { ok: true, action: "syncChopped" };
}

// ─── Sheet setup helpers ──────────────────────────────────────────────────────

function ensureAllSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  createIfMissing_(ss, TAB.FIELDS, [
    "Field #", "Field ID", "Crop", "Area (acres)",
    "State", "District", "Sowing Date", "Harvest Due", "Irrigation",
    "GPS Lat", "GPS Lon", "GPS Accuracy (m)",
    "Status", "Created By", "Created At",
  ], [70, 120, 90, 90, 90, 100, 100, 100, 90, 90, 90, 120, 90, 120, 160]);

  createIfMissing_(ss, TAB.STANDING, [
    "Field #", "Field ID", "Crop",
    "Zone", "Plant Height", "Plant Color", "Stand Density",
    "Photo URL", "Captured By", "Captured At",
  ], [70, 120, 90, 55, 100, 100, 110, 300, 120, 160]);

  createIfMissing_(ss, TAB.CUT, [
    "Field #", "Field ID", "Crop",
    "Harvest Method", "Crop Condition", "Cutting Height", "Lodging",
    "Photo URL", "Captured By", "Captured At",
  ], [70, 120, 90, 120, 120, 110, 90, 300, 120, 160]);

  createIfMissing_(ss, TAB.CHOPPED, [
    "Field #", "Field ID", "Crop",
    "Chop Length", "Uniformity", "Material Quality",
    "Photo URL", "Captured By", "Captured At",
  ], [70, 120, 90, 100, 100, 120, 300, 120, 160]);

  createIfMissing_(ss, TAB.AUDIT, [
    "Timestamp", "Field #", "Field ID", "Stage", "Action", "By", "Detail",
  ], [180, 70, 120, 90, 80, 120, 200]);
}

function createIfMissing_(ss, name, headers, widths) {
  if (ss.getSheetByName(name)) return;
  const sh = ss.insertSheet(name);
  sh.appendRow(headers);
  sh.setFrozenRows(1);
  const hdr = sh.getRange(1, 1, 1, headers.length);
  hdr.setBackground("#1e5c2e");
  hdr.setFontColor("#ffffff");
  hdr.setFontWeight("bold");
  hdr.setFontSize(11);
  if (widths) widths.forEach((w, i) => sh.setColumnWidth(i + 1, w));
}

// ─── Row finders ──────────────────────────────────────────────────────────────

function findRow_(sh, col, value) {
  const vals = sh.getDataRange().getValues();
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][col - 1]) === String(value)) return i + 1;
  }
  return -1;
}

function findZoneRow_(sh, fieldNum, zone) {
  const vals = sh.getDataRange().getValues();
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(fieldNum) && String(vals[i][3]) === String(zone)) {
      return i + 1;
    }
  }
  return -1;
}

// ─── Status & colour ──────────────────────────────────────────────────────────

const STATUS_BG = {
  standing: "#e6f4ea",   // light green
  cut:      "#fef9e7",   // light amber
  chopped:  "#f3e8ff",   // light purple
  silage:   "#e0f2fe",   // light blue
};

function tintRow_(sh, rowNum, status) {
  const bg = STATUS_BG[status] || "#ffffff";
  sh.getRange(rowNum, 1, 1, sh.getLastColumn()).setBackground(bg);
}

function updateStatus_(fieldNum, status) {
  const sh = sheet_(TAB.FIELDS);
  const r = findRow_(sh, 1, fieldNum);
  if (r < 0) return;
  sh.getRange(r, 13).setValue(status);  // column M = Status
  tintRow_(sh, r, status);
}

// ─── Audit ────────────────────────────────────────────────────────────────────

function audit_(fieldNum, fieldId, stage, action, by, detail) {
  sheet_(TAB.AUDIT).appendRow([
    new Date().toISOString(), fieldNum, fieldId, stage, action, by, detail,
  ]);
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function sheet_(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function fmt_(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleString(); } catch (_) { return iso; }
}

function text_(s) {
  return ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.TEXT);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
