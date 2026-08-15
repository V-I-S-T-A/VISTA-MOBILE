import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

/**
 * Opens the device camera with Expo Image Picker and returns a file descriptor
 * ready for OCR/autofill. Returns null if the user cancels the capture.
 */
export async function scanDocument() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    throw new Error("Camera access was not granted.");
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 1,
    cameraType: ImagePicker.CameraType.back,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.fileName || `scan_${Date.now()}.jpg`,
    type: asset.mimeType || "image/jpeg",
  };
}

/**
 * Backward-compatible helper for the existing entry screen. This now uses the
 * camera capture path instead of the native document scanner package.
 */
export async function pickImageFile() {
  return scanDocument();
}

export async function pickDocumentFile() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "image/*"],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) {
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
      return "application/octet-stream";
  }
}
