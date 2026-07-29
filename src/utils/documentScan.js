import DocumentScanner from "react-native-document-scanner-plugin";
import * as DocumentPicker from "expo-document-picker";

/**
 * Launches the native document scanner (react-native-document-scanner-plugin)
 * and returns a file descriptor ready for submissionsService.autofillFromScan().
 * Returns null if the staff member cancels the scan.
 */
export async function scanDocument() {
  const { scannedImages, status } = await DocumentScanner.scanDocument({
    maxNumDocuments: 1,
  });

  if (status !== "success" || !scannedImages?.length) {
    return null;
  }

  const uri = scannedImages[0];
  const fileName = uri.split("/").pop() || `scan_${Date.now()}.jpg`;

  return { uri, name: fileName, type: "image/jpeg" };
}

export async function pickDocumentFile() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "image/*"],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if(result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  return { 
    uri: asset.uri, 
    name: asset.name || `document_${Date.now()}`, 
    type: asset.mimeType || inferMimeTypeFromName(asset.name),
  };
}

function inferMimeTypeFromName(name = "") {
  const extension = name.split(".").pop()?.toLowerCase() || "";
  switch (extension) {
    case "pdf":
      return "application/pdf";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    default:
      return "application/octet-stream"; // Default binary type
  }
}
