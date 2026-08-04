const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function patchFile(relativePath, replacements) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    console.warn(`[native-patches] Skipped missing file: ${relativePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;

  for (const { find, replace, marker } of replacements) {
    if (marker && content.includes(marker)) {
      continue;
    }
    if (!content.includes(find)) {
      console.warn(`[native-patches] Pattern not found in ${relativePath}`);
      continue;
    }
    content = content.replace(find, replace);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`[native-patches] Patched ${relativePath}`);
  }
}

patchFile("node_modules/expo-dev-menu/android/src/main/java/expo/modules/devmenu/AppInfo.kt", [
  {
    marker: "private lateinit var _native: Native",
    find: `  lateinit var native: Native

  fun init(application: Application) {
    native = getNativeAppInfo(application)
  }`,
    replace: `  private lateinit var _native: Native
  var native: Native
    get() {
      if (!::_native.isInitialized) {
        return Native(appName = "VISTA", appVersion = "1.0.0")
      }
      return _native
    }
    set(value) {
      _native = value
    }

  fun init(application: Application) {
    _native = getNativeAppInfo(application)
  }`,
  },
]);

patchFile("node_modules/expo-dev-menu/android/src/main/java/expo/modules/devmenu/DevMenuPreferences.kt", [
  {
    marker: "private fun getBoolean(key: String, defaultValue: Boolean): Boolean",
    find: `  fun init(application: Application) {
    sharedPreferences = application.getSharedPreferences(DEV_SETTINGS_PREFERENCES, MODE_PRIVATE)
    sharedPreferences.registerOnSharedPreferenceChangeListener(mainListener)
  }

  fun addOnChangeListener(listener: () -> Unit) {`,
    replace: `  fun init(application: Application) {
    sharedPreferences = application.getSharedPreferences(DEV_SETTINGS_PREFERENCES, MODE_PRIVATE)
    sharedPreferences.registerOnSharedPreferenceChangeListener(mainListener)
  }

  private fun getBoolean(key: String, defaultValue: Boolean): Boolean {
    if (!::sharedPreferences.isInitialized) {
      return defaultValue
    }
    return sharedPreferences.getBoolean(key, defaultValue)
  }

  fun addOnChangeListener(listener: () -> Unit) {`,
  },
  {
    marker: `get() = getBoolean("motionGestureEnabled", true)`,
    find: `get() = sharedPreferences.getBoolean("motionGestureEnabled", true)`,
    replace: `get() = getBoolean("motionGestureEnabled", true)`,
  },
  {
    marker: `get() = getBoolean("touchGestureEnabled", true)`,
    find: `get() = sharedPreferences.getBoolean("touchGestureEnabled", true)`,
    replace: `get() = getBoolean("touchGestureEnabled", true)`,
  },
  {
    marker: `get() = getBoolean("keyCommandsEnabled", true)`,
    find: `get() = sharedPreferences.getBoolean("keyCommandsEnabled", true)`,
    replace: `get() = getBoolean("keyCommandsEnabled", true)`,
  },
  {
    marker: `get() = getBoolean("showsAtLaunch", false)`,
    find: `get() = sharedPreferences.getBoolean("showsAtLaunch", false)`,
    replace: `get() = getBoolean("showsAtLaunch", false)`,
  },
  {
    marker: `get() = getBoolean("isOnboardingFinished", false)`,
    find: `get() = sharedPreferences.getBoolean("isOnboardingFinished", false)`,
    replace: `get() = getBoolean("isOnboardingFinished", false)`,
  },
  {
    marker: `get() = getBoolean("showFab", false)`,
    find: `get() = sharedPreferences.getBoolean("showFab", false)`,
    replace: `get() = getBoolean("showFab", false)`,
  },
  {
    marker: `if (!::sharedPreferences.isInitialized) {
      return
    }`,
    find: `  private fun saveBoolean(key: String, value: Boolean) {
    sharedPreferences`,
    replace: `  private fun saveBoolean(key: String, value: Boolean) {
    if (!::sharedPreferences.isInitialized) {
      return
    }
    sharedPreferences`,
  },
]);
