/**
 * Vitainspire — Google Drive Photo Bridge
 * =========================================
 * HOW TO DEPLOY
 * 1. Go to https://script.google.com → New Project → name it "Vitainspire Drive Bridge"
 * 2. Paste this entire file, save
 * 3. Deploy → New Deployment
 *    · Type: Web App
 *    · Execute as: Me
 *    · Who has access: Anyone
 * 4. Copy the Web App URL → paste as EXPO_PUBLIC_GAS_BRIDGE_URL in .env.local
 *
 * REQUEST FORMAT (POST, Content-Type: application/json)
 * {
 *   "base64":   "<base64-encoded image>",
 *   "fileName": "AP-KNL-001_corn_zone-A_20260425.jpg",
 *   "mimeType": "image/jpeg",
 *   "folderId": "<EXPO_PUBLIC_DRIVE_FOLDER_ID>",
 *   "metadata": { "fieldId": "AP-KNL-001" }   // optional
 * }
 *
 * RESPONSE
 * { "status": "success", "fileId": "...", "url": "https://drive.google.com/..." }
 * { "status": "error",   "message": "..." }
 */

function doGet() {
  return ContentService
    .createTextOutput("✅ Vitainspire Drive Bridge ONLINE")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { base64, fileName, mimeType, folderId, metadata } = body;

    if (!base64)    return json_({ status: "error", message: "Missing base64 data" });
    if (!fileName)  return json_({ status: "error", message: "Missing fileName" });
    if (!folderId)  return json_({ status: "error", message: "Missing folderId" });

    const bytes  = Utilities.base64Decode(base64);
    const blob   = Utilities.newBlob(bytes, mimeType || "image/jpeg", fileName);
    const folder = DriveApp.getFolderById(folderId);

    // Optional: put inside a per-field subfolder
    const fieldId = metadata?.fieldId;
    const target  = fieldId ? getOrCreateSubfolder_(folder, fieldId) : folder;

    // Delete existing file with the same name to avoid duplicates
    const existing = target.getFilesByName(fileName);
    while (existing.hasNext()) existing.next().setTrashed(true);

    const file = target.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return json_({
      status: "success",
      fileId: file.getId(),
      url:    "https://drive.google.com/file/d/" + file.getId() + "/view",
    });

  } catch (err) {
    return json_({ status: "error", message: err.toString() });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOrCreateSubfolder_(parent, name) {
  const existing = parent.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return parent.createFolder(name);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
