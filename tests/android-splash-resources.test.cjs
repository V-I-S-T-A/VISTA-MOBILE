const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { AndroidConfig } = require('expo/config-plugins');
const XML = require('@expo/config-plugins/build/utils/XML');

const resourceRoot = 'android/app/src/main/res';
const themeName = 'Theme.App.SplashScreen';
const behavior = 'android:windowSplashScreenBehavior';
const expected = {
  windowSplashScreenBackground: '@color/splashscreen_background',
  windowSplashScreenAnimatedIcon: '@drawable/splashscreen_logo',
  postSplashScreenTheme: '@style/AppTheme',
  'android:windowSplashScreenBrandingImage': '@drawable/splash_branding',
  'android:windowBackground': '@drawable/splash_launch',
};

// Resolve the selected resource bag through explicit parents; a v33 theme that
// accidentally drops the shared parent must fail, even if both XML files parse.
function resolveTheme(base, versioned, api) {
  const styles = new Map(base.resources.style.map(style => [style.$.name, style]));
  if (api >= 33) for (const style of versioned.resources.style) styles.set(style.$.name, style);
  const visiting = new Set();
  function resolve(name) {
    if (name === 'Theme.SplashScreen') return {};
    assert.ok(!visiting.has(name), `Circular theme inheritance: ${name}`);
    const style = styles.get(name);
    assert.ok(style, `Missing theme parent: ${name}`);
    visiting.add(name);
    const result = { ...resolve(style.$.parent), ...Object.fromEntries((style.item || []).map(item => [item.$.name, item._])) };
    visiting.delete(name);
    return result;
  }
  return resolve(themeName);
}

test('splash resource selection preserves branding and gates icon_preferred to API 33+', async () => {
  const base = await AndroidConfig.Resources.readResourcesXMLAsync({ path: `${resourceRoot}/values/styles.xml` });
  const versioned = await AndroidConfig.Resources.readResourcesXMLAsync({ path: `${resourceRoot}/values-v33/styles.xml` });
  for (const api of [24, 29, 31, 32, 33, 36]) {
    assert.deepEqual(resolveTheme(base, versioned, api), api >= 33 ? { ...expected, [behavior]: 'icon_preferred' } : expected);
  }
  // Check every values directory so an unqualified copy cannot silently return.
  const locations = [];
  for (const directory of fs.readdirSync(resourceRoot).filter(name => name.startsWith('values'))) {
    for (const file of fs.readdirSync(`${resourceRoot}/${directory}`).filter(name => name.endsWith('.xml'))) {
      const xml = fs.readFileSync(`${resourceRoot}/${directory}/${file}`, 'utf8');
      if (xml.includes(behavior)) locations.push(directory);
    }
  }
  assert.deepEqual(locations, ['values-v33']);
  const manifest = await XML.parseXMLAsync(fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8'));
  assert.equal(manifest.manifest.application[0].activity.find(activity => activity.$['android:name'] === '.MainActivity').$['android:theme'], `@style/${themeName}`);
});

test('Expo splash regeneration remains version-correct, idempotent and preserves other resources', async t => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'vista-splash-resources-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  let callback, dangerous;
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync('plugins/withSplashBranding.js', 'utf8'), {
    module,
    require: name => name === 'expo/config-plugins' ? {
      AndroidConfig,
      withAndroidStyles: (config, action) => { callback = action; return config; },
      withDangerousMod: (config, [, action]) => { dangerous = action; return config; },
    } : name === 'fs' ? {
      ...fs, existsSync: () => false,
      promises: { ...fs.promises, copyFile: async () => {} },
    } : require(name),
  });
  module.exports({});
  const generated = await XML.parseXMLAsync(`<resources>
    <style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar" />
    <style name="${themeName}" parent="Theme.SplashScreen">
      <item name="windowSplashScreenBackground">@color/splashscreen_background</item>
      <item name="windowSplashScreenAnimatedIcon">@drawable/splashscreen_logo</item>
      <item name="postSplashScreenTheme">@style/AppTheme</item>
      <item name="${behavior}">icon_preferred</item>
    </style>
  </resources>`);
  const versionedPath = path.join(temporary, 'app/src/main/res/values-v33/styles.xml');
  await XML.writeXMLAsync({ path: versionedPath, xml: { resources: { color: [{ $: { name: 'unrelated' }, _: '#ffffff' }] } } });
  const config = { modResults: generated, modRequest: { platformProjectRoot: temporary, projectRoot: temporary } };
  await dangerous(config);
  await callback(config);
  const first = XML.format(config.modResults);
  await callback(config);
  assert.equal(XML.format(config.modResults), first);
  const versioned = await AndroidConfig.Resources.readResourcesXMLAsync({ path: versionedPath });
  assert.equal(versioned.resources.color[0].$.name, 'unrelated');
  assert.equal(versioned.resources.style.length, 1);
  assert.equal(config.modResults.resources.style.filter(style => style.$.name === 'AppTheme').length, 1);
  assert.deepEqual(resolveTheme(config.modResults, versioned, 24), expected);
  assert.deepEqual(resolveTheme(config.modResults, versioned, 33), { ...expected, [behavior]: 'icon_preferred' });
  // A later Expo prebuild replaces the public style. Its new values must win
  // over the previously generated base rather than leave stale splash assets.
  const current = config.modResults.resources.style.find(style => style.$.name === themeName);
  current.$.parent = 'Theme.SplashScreen';
  current.item = [{ $: { name: 'windowSplashScreenAnimatedIcon' }, _: '@drawable/new_logo' }, { $: { name: behavior }, _: 'icon_preferred' }];
  await callback(config);
  assert.equal(resolveTheme(config.modResults, versioned, 33).windowSplashScreenAnimatedIcon, '@drawable/new_logo');
  assert.ok(!XML.format(config.modResults).includes(behavior));
});
