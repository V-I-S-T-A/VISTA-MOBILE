import * as WebBrowser from "expo-web-browser";

const APP_REDIRECT_URL = "vista-app://drive-callback";

export async function runDriveAuthSession(authorizationUrl) {
  const result = await WebBrowser.openAuthSessionAsync(
    authorizationUrl,
    APP_REDIRECT_URL,
  );

  if (result.type !== "success" || !result.url) {
    return { status: "cancelled" };
  }

  const query = result.url.split("?")[1] || "";
  const params = Object.fromEntries(new URLSearchParams(query));
  return { status: params.status || "error", detail: params.detail };
}
