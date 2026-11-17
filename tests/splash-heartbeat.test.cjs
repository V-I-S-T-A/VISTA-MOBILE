const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHarness,nodes,textOf}=require('./helpers/mobileComponentHarness.cjs');

test('startup holds the native splash until session restoration then lays out onboarding directly',()=>{
  let auth={user:null,role:null,isRestoring:true},hidden=0;
  const h=createHarness({
    '../context/AuthContext':{useAuth:()=>auth},
    '../hooks/useOnboarding':{__esModule:true,default:()=>({ready:true,completed:false,complete(){}})},
    '../screens/SplashScreen':{__esModule:true,default:'Splash'},
    './AuthNavigator':{__esModule:true,default:'Auth'},
    './StudentNavigator':{__esModule:true,default:'Student'},
    './StaffNavigator':{__esModule:true,default:'Staff'},
    '../components/common/OfflineBanner':{__esModule:true,default:'Offline'},
    'expo-splash-screen':{hideAsync:()=>{hidden++;return Promise.resolve();}},
  });
  const Root=h.load('src/navigation/RootNavigator.jsx').default;
  let root=h.instance(Root);
  assert.equal(root.output,null);assert.equal(hidden,0);
  auth={...auth,isRestoring:false};root.render();
  assert.ok(nodes(root.output).some(n=>n.type==='Auth'));
  assert.ok(!nodes(root.output).some(n=>n.type==='Splash'));
  root.output.props.onLayout();assert.equal(hidden,1);
  assert.ok(!nodes(root.output).some(n=>n.type==='Offline'));
  root.unmount();root=h.instance(Root);
  assert.ok(nodes(root.output).some(n=>n.type==='Auth'),'A warm React remount must not introduce a second splash');
});

test('heartbeat has two distinct peaks, uses native animation, and stops in background or reduced motion',()=>{
  const base=createHarness().native;let reduced=false,change,starts=0,stops=0,config;
  class Value extends base.Animated.Value {interpolate(value){return {keyframes:value};}}
  const h=createHarness({'react-native':{...base,AppState:{currentState:'active',addEventListener:(_,fn)=>{change=fn;return{remove(){}};}},Easing:{...base.Easing,linear:x=>x},Animated:{...base.Animated,Value,timing:(_,value)=>{config=value;return{};},loop:()=>({start(){starts++;},stop(){stops++;}})}},'../../hooks/useReducedMotion':{__esModule:true,default:()=>reduced}});
  const Brand=h.load('src/components/common/SplashBrand.jsx').default;
  const brand=h.instance(Brand);assert.equal(starts,1);assert.equal(config.useNativeDriver,true);assert.equal(config.isInteraction,false);
  const animated=nodes(brand.output).filter(n=>n.type==='AnimatedView');
  const scale=animated.at(-1).props.style.transform[0].scale.keyframes.outputRange;
  assert.ok(scale[1]>scale[0]&&scale[3]>scale[2]);assert.equal(scale.at(-1),1);
  change('background');brand.render();assert.equal(stops,1);
  change('active');brand.render();assert.equal(starts,2);
  reduced=true;brand.render();assert.equal(stops,2);
  reduced=false;brand.render();assert.equal(starts,3);
  brand.unmount();assert.equal(stops,3);
});

test('React recovery screen has no startup timer or completion callback that could duplicate the OS splash', t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  let finished=0;
  const h=createHarness();const Screen=h.load('src/screens/SplashScreen.jsx').default;
  const splash=h.instance(Screen,{onReady:()=>finished++});
  t.mock.timers.tick(6100);assert.equal(finished,0);splash.unmount();
  const canceled=h.instance(Screen,{onReady:()=>finished++});canceled.unmount();
  t.mock.timers.tick(2000);assert.equal(finished,0);
});

test('restore error keeps the retry button and pull-to-retry without changing credentials',async()=>{
  let retry=0;
  const h=createHarness();const Screen=h.load('src/screens/SplashScreen.jsx').default;
  const splash=h.instance(Screen,{error:'Please reconnect',onRetry:()=>{retry++;}});
  assert.ok(textOf(splash.output).includes('Please reconnect'));
  nodes(splash.output).find(n=>n.props?.label==='Try again').props.onPress();assert.equal(retry,1);
  const refresh=nodes(splash.output).find(n=>n.type==='ScrollView').props.refreshControl;
  await refresh.props.onRefresh();assert.equal(retry,2);
  assert.ok(!nodes(splash.output).some(n=>n.type==='Text'&&textOf(n)==='VISTA'));
});

test('native splash configuration and checked-in resources match logo-only and P.House branding',()=>{
  const config=JSON.parse(fs.readFileSync('app.json')).expo;
  assert.equal(config.plugins.find(p=>Array.isArray(p)&&p[0]==='expo-splash-screen')[1].imageWidth,120);
  assert.ok(config.plugins.includes('./plugins/withSplashBranding'));
  const styles=fs.readFileSync('android/app/src/main/res/values/styles.xml','utf8');
  assert.match(styles,/android:windowSplashScreenBrandingImage/);
  assert.deepEqual(JSON.parse(fs.readFileSync('package.json')).expo.autolinking.android.buildFromSource,['expo-splash-screen']);
  for(const file of ['assets/native/splash-branding.png','src/assets/branding/house.png','android/app/src/main/res/drawable-xxhdpi/splash_branding.png'])assert.equal(fs.readFileSync(file).subarray(1,4).toString(),'PNG');
});

test('release uses the native branding while retaining the team development client and native app features',()=>{
  const main=fs.readFileSync('android/app/src/main/res/values/styles.xml','utf8');
  const entries=xml=>Object.fromEntries([...xml.matchAll(/<item name="([^"]+)"[^>]*>([^<]+)<\/item>/g)].map(m=>[m[1],m[2]]));
  const release=entries(main);
  assert.equal(release.windowSplashScreenAnimatedIcon,'@drawable/splashscreen_logo');
  assert.equal(release['android:windowBackground'],'@drawable/splash_launch');
  assert.equal(release['android:windowSplashScreenBrandingImage'],'@drawable/splash_branding');
  assert.equal(fs.existsSync('android/app/src/debug/res/values/splash_debug_styles.xml'),false);
  const {spawnSync}=require('node:child_process');
  const result=spawnSync(process.execPath,['node_modules/expo-modules-autolinking/bin/expo-modules-autolinking','resolve','--platform','android','--json'],{encoding:'utf8',windowsHide:true});
  assert.equal(result.status,0,result.error?.message||result.stderr);
  const modules=JSON.parse(result.stdout).modules.map(m=>m.packageName);
  assert.ok(modules.includes('expo-dev-launcher'));
  assert.ok(modules.includes('expo-dev-client'));
  for(const name of ['expo-dev-menu','expo-notifications','expo-secure-store','expo-image-picker','expo-document-picker','expo-file-system','expo-splash-screen'])assert.ok(modules.includes(name),name+' must remain available');
  assert.match(fs.readFileSync('android/app/src/main/java/com/wayvbb/vistaapp/MainApplication.kt','utf8'),/getUseDeveloperSupport\(\): Boolean = BuildConfig.DEBUG/);
  assert.equal(fs.readFileSync('android/app/src/main/assets/lucide-LICENSE.txt','utf8'),fs.readFileSync('src/assets/branding/lucide-LICENSE.txt','utf8'));
});

test('native splash hook is idempotent and fails clearly when the installed Expo hook changes',()=>{
  const vm=require('node:vm'),path=require('node:path');
  let source='before\n      val splashScreenView = splashScreenViewProvider.view\nafter',copies=0;
  const fakeFs={existsSync:()=>true,readFileSync:()=>source,writeFileSync:(_,value)=>{source=value;},copyFileSync:()=>copies++};
  const module={exports:{}};
  vm.runInNewContext(fs.readFileSync('plugins/withSplashBranding.js','utf8'),{module,require:name=>name==='fs'?fakeFs:name==='path'?path:{}});
  const apply=module.exports.applyNativeSplashPatch;
  apply('/project');apply('/project');
  assert.equal(source.split('if (preventAutoHideCalled && animateVistaSplash(').length-1,1);
  assert.equal(copies,2);
  assert.ok(source.includes('splashScreenViewProvider.remove()'));
  assert.ok(source.endsWith('after'));
  source='Unsupported upstream implementation';
  assert.throws(()=>apply('/project'),/installed Expo splash manager changed/);
});
