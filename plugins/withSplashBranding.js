const fs = require('fs');
const path = require('path');
const { AndroidConfig, withAndroidStyles, withDangerousMod } = require('expo/config-plugins');

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
    return config;
  });
  return withDangerousMod(config, ['android', async config => {
    const root = config.modRequest.projectRoot;
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
