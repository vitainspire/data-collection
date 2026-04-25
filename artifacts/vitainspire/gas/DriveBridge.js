/**
 * Google Apps Script (GAS) Bridge Code
 *
 * 1. Go to https://script.google.com
 * 2. Create a NEW PROJECT
 * 3. Paste this code
 * 4. Update FOLDER_ID below to your Google Drive folder ID
 * 5. DEPLOY as a Web App:
 *      Execute as: Me
 *      Who has access: Anyone
 * 6. Copy the Web App URL → set EXPO_PUBLIC_GAS_BRIDGE_URL in Vercel env vars
 */

const FOLDER_ID = "1V41MoM4Fj1trrOhu5lXKRaH_los8oCrv";

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var base64Data = data.base64;
    var fileName = data.fileName;
    var mimeType = data.mimeType || "image/jpeg";

    // Decode base64
    var bytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(bytes, mimeType, fileName);

    // Route into a per-field subfolder (field ID is the first segment of the filename)
    var rootFolder = DriveApp.getFolderById(FOLDER_ID);
    var fieldId = fileName.split("_")[0];
    var folder = fieldId ? getOrCreateSubfolder(rootFolder, fieldId) : rootFolder;

    // Deduplicate — trash any existing file with the same name
    var existing = folder.getFilesByName(fileName);
    while (existing.hasNext()) existing.next().setTrashed(true);

    // Save file
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      url: file.getUrl().replace("file/d/", "uc?export=view&id=").replace("/view?usp=drivesdk", ""),
      fileId: file.getId()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSubfolder(parent, name) {
  var existing = parent.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return parent.createFolder(name);
}

function doGet(e) {
  return ContentService.createTextOutput("✅ Google Drive Bridge is ONLINE. Ready for POST requests.").setMimeType(ContentService.MimeType.TEXT);
}
