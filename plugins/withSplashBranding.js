const fs = require('fs');
const path = require('path');
const { AndroidConfig, withAndroidStyles, withDangerousMod } = require('expo/config-plugins');
const { writeXMLAsync } = require('@expo/config-plugins/build/utils/XML');
const themeName = 'Theme.App.SplashScreen';
const baseName = 'Base.Theme.App.SplashScreen';

function applyNativeSplashPatch(root) {
  const nativeFolder = path.join(root, 'node_modules/expo-splash-screen/android/src/main/java/expo/modules/splashscreen');
  const managerPath = path.join(nativeFolder, 'SplashScreenManager.kt');
  if (!fs.existsSync(managerPath)) return;
  const previous = fs.readFileSync(managerPath, 'utf8');
  const original = previous.replace('if (animateVistaSplash(', 'if (preventAutoHideCalled && animateVistaSplash(');
  const anchor = '      val splashScreenView = splashScreenViewProvider.view';
  const marker = 'if (preventAutoHideCalled && animateVistaSplash(splashScreenViewProvider)';
  if (!original.includes(marker)) {
    if (!original.includes(anchor)) throw new Error('The installed Expo splash manager changed; review the native splash hook before building.');
    const hook = `      if (preventAutoHideCalled && animateVistaSplash(splashScreenViewProvider) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
          splashScreenViewProvider.remove()
        } else {
          (splashScreenViewProvider.view as SplashScreenView).remove()
        }
      }) return@setOnExitAnimationListener
`;
    fs.writeFileSync(managerPath, original.replace(anchor, hook + anchor));
  } else if (original !== previous) {
    fs.writeFileSync(managerPath, original);
  }
  fs.copyFileSync(path.join(root, 'plugins/android/VistaSplashAnimation.kt'), path.join(nativeFolder, 'VistaSplashAnimation.kt'));
}

// Keep Android 12+ OS branding in sync when Expo regenerates native resources.
module.exports = function withSplashBranding(config) {
  config = withAndroidStyles(config, config => {
    config.modResults = AndroidConfig.Styles.assignStylesValue(config.modResults, {
      add: true,
      parent: { name: 'Theme.App.SplashScreen' },
      name: 'android:windowSplashScreenBrandingImage',
      targetApi: '31',
      value: '@drawable/splash_branding',
    });
    config.modResults = AndroidConfig.Styles.assignStylesValue(config.modResults, {
      add: true, parent: { name: 'Theme.App.SplashScreen' },
      name: 'android:windowBackground', value: '@drawable/splash_launch',
    });
    // Expo generates this API-33 attribute in values/. Keep it version-qualified
    // after every prebuild, with one shared parent for all launch styling.
    const styles = config.modResults.resources.style;
    const theme = styles.find(style => style.$.name === themeName);
    const base = styles.find(style => style.$.name === baseName);
    const items = new Map([...(base?.item || []), ...(theme.item || [])].map(item => [item.$.name, item]));
    items.delete('android:windowSplashScreenBehavior');
    config.modResults.resources.style = [
      ...styles.filter(style => ![themeName, baseName].includes(style.$.name)),
      { $: { name: baseName, parent: theme.$.parent === baseName ? base.$.parent : theme.$.parent }, item: [...items.values()] },
      { $: { name: themeName, parent: baseName } },
    ];
    return config;
  });
  return withDangerousMod(config, ['android', async config => {
    const root = config.modRequest.projectRoot;
    const versionedPath = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/values-v33/styles.xml');
    let versioned = await AndroidConfig.Resources.readResourcesXMLAsync({ path: versionedPath });
    versioned = AndroidConfig.Styles.assignStylesValue(versioned, {
      add: true, parent: { name: themeName, parent: baseName },
      name: 'android:windowSplashScreenBehavior', value: 'icon_preferred',
    });
    await writeXMLAsync({ path: versionedPath, xml: versioned });
    const destination = path.join(root, 'android/app/src/main/res/drawable-xxhdpi/splash_branding.png');
    await fs.promises.mkdir(path.dirname(destination), { recursive: true });
    await fs.promises.copyFile(path.join(root, 'assets/native/splash-branding.png'), destination);
    await fs.promises.mkdir(path.join(root, 'android/app/src/main/res/drawable-nodpi'), { recursive: true });
    await fs.promises.copyFile(path.join(root, 'assets/native/splash.png'), path.join(root, 'android/app/src/main/res/drawable-nodpi/splash_mark.png'));
    await fs.promises.copyFile(path.join(root, 'plugins/android/splash_launch.xml'), path.join(root, 'android/app/src/main/res/drawable/splash_launch.xml'));
    const notice = path.join(root, 'android/app/src/main/assets/lucide-LICENSE.txt');
    await fs.promises.mkdir(path.dirname(notice), { recursive: true });
    await fs.promises.copyFile(path.join(root, 'src/assets/branding/lucide-LICENSE.txt'), notice);
    applyNativeSplashPatch(root);
    return config;
  }]);
};
module.exports.applyNativeSplashPatch = applyNativeSplashPatch;
