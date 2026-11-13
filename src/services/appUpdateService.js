import * as Application from "expo-application";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";
import { apiClient, unwrapApiError } from "../lib/apiClient";
import { API_ENDPOINTS } from "../config/api";

const DIR = FileSystem.cacheDirectory + "updates/";
export const installedCode = () =>
  parseInt(Application.nativeBuildVersion, 10) || 0;

export async function fetchLatestRelease() {
  if (Platform.OS !== "android") return null;
  try {
    const { data } = await apiClient.get(API_ENDPOINTS.APP.LATEST, {
      timeout: 10000,
    });
    if (!data?.available || data.version_code <= installedCode()) return null;
    return {
      ...data,
      forced: installedCode() < (data.min_supported_code || 0),
    };
  } catch (e) {
    throw unwrapApiError(e);
  }
}

export async function downloadRelease(release, onProgress) {
  await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  const target = `${DIR}vista-${release.version_code}.apk`;

  // Reuse a finished download from a previous session.
  const existing = await FileSystem.getInfoAsync(target, { md5: true });
  if (existing.exists && existing.md5 === release.md5) return target;

  const task = FileSystem.createDownloadResumable(
    release.apk_url,
    target,
    {},
    (p) => {
      const total =
        p.totalBytesExpectedToWrite > 0
          ? p.totalBytesExpectedToWrite
          : release.size_bytes;
      if (total) onProgress(Math.min(1, p.totalBytesWritten / total));
    },
  );
  const result = await task.downloadAsync();
  if (!result || result.status !== 200)
    throw new Error("Download failed. Check your connection.");

  const saved = await FileSystem.getInfoAsync(target, { md5: true });
  if (saved.md5 !== release.md5) {
    await FileSystem.deleteAsync(target, { idempotent: true });
    throw new Error("The downloaded update is corrupted. Please try again.");
  }
  return target;
}

export async function installApk(fileUri) {
  const data = await FileSystem.getContentUriAsync(fileUri);
  await IntentLauncher.startActivityAsync("android.intent.action.INSTALL_PACKAGE", {
    data,
    type: "application/vnd.android.package-archive",
    flags: 1,
  });
}

// Run when no update is pending (e.g. right after a successful update).
export async function cleanupOldApks() {
  await FileSystem.deleteAsync(DIR, { idempotent: true }).catch(() => {});
}
