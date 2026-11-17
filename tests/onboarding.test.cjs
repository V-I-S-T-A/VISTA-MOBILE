const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');
const settle = async () => { for (let i=0;i<6;i++) await Promise.resolve(); };
const button = (tree, label) => nodes(tree).find(n => n.props?.label === label);

test('every cold app session shows welcome again without reading or writing stored preferences or tokens', async () => {
  const values = new Map(); let writes=0;
  const h = createHarness({ 'expo-secure-store': { getItemAsync: async key => values.get(key), setItemAsync: async (key,value) => { writes++; values.set(key,value); } } });
  const { default: useOnboarding } = h.load('src/hooks/useOnboarding.js');
  let view = h.instance(useOnboarding);
  assert.equal(view.output.ready, true);
  await settle(); view.render();
  assert.equal(view.output.ready, true); assert.equal(view.output.completed, false);
  await Promise.all([view.output.complete(), view.output.complete()]); view.render();
  assert.equal(view.output.completed, true); assert.equal(writes,0);
  assert.deepEqual([...values.keys()], []);
  view.unmount(); view=h.instance(useOnboarding); await settle(); view.render();
  assert.equal(view.output.completed,false);
});

test('storage availability and authentication never bypass the welcome page on a new session', async () => {
  for (const authenticated of [false,true]) {
    const h=createHarness({ 'expo-secure-store': { getItemAsync:async()=>{throw Error('unavailable');}, setItemAsync:async()=>{throw Error('unavailable');} } });
    const hook=h.load('src/hooks/useOnboarding.js').default;
    const view=h.instance(() => hook(authenticated)); await settle(); view.render(); await settle(); view.render();
    assert.equal(view.output.ready,true);
    assert.equal(view.output.completed,false);await view.output.complete();view.render();
    assert.equal(view.output.completed,true);
  }
});

test('role tours preserve Student/Staff choice, Back, progress, and Finish without authentication changes', async () => {
  for(const audience of ['student','staff']) {
    let completed=0, back;
    const base=createHarness().native;
    const h=createHarness({ 'react-native':{...base,BackHandler:{addEventListener:(_,fn)=>{back=fn;return{remove(){}};}}} });
    const Screen=h.load('src/screens/auth/OnboardingScreen.jsx').default;
    const screen=h.instance(Screen,{onComplete:async()=>{completed++;}});
    const role=nodes(screen.output).find(n=>n.props?.accessibilityRole==='radio'&&n.props.accessibilityLabel.startsWith(audience==='student'?'Student':'OSA Staff'));
    role.props.onPress();screen.render();
    assert.equal(nodes(screen.output).filter(n=>n.type?.name==='OnboardingStudents'&&n.props.active).length,1);
    button(screen.output,`Explore the ${audience==='student'?'Student':'Staff'} tour`).props.onPress();screen.render();
    const count=audience==='student'?3:4;
    assert.ok(textOf(screen.output).includes(`1 of ${count}`));assert.equal(back(),true);screen.render();
    assert.ok(textOf(screen.output).includes('Welcome to VISTA'));
    button(screen.output,`Explore the ${audience==='student'?'Student':'Staff'} tour`).props.onPress();screen.render();
    const content=h.load('src/data/onboardingContent.js').ONBOARDING_TOURS[audience];
    for(let i=0;i<count;i++){
      assert.ok(textOf(screen.output).includes(content[i].title));
      assert.ok(textOf(screen.output).includes(content[i].description));
      const b=button(screen.output,i===count-1?'Get started':'Next');
      if(i===count-1) await b.props.onPress();else b.props.onPress();screen.render();
    }
    assert.equal(completed,1);
    await button(screen.output,'Get started').props.onPress();assert.equal(completed,1);
  }
});

test('welcome has no Skip; existing-account action and Skip within a selected tour complete it', async () => {
  for(const label of ['Skip','I already have an account']){
    const h=createHarness();let completed=0;
    const Screen=h.load('src/screens/auth/OnboardingScreen.jsx').default;
    const screen=h.instance(Screen,{onComplete:async()=>{completed++;}});
    assert.equal(button(screen.output,'Skip'),undefined);
    if(label==='Skip'){button(screen.output,'Explore the Student tour').props.onPress();screen.render();}
    await button(screen.output,label).props.onPress();assert.equal(completed,1);
  }
});

test('native artwork motion runs only for active foreground cards and cleans up on page changes', () => {
  const base=createHarness().native;let reduced=false,foreground='active',stateChange,starts=0,stops=0;
  const native={...base,AppState:{currentState:foreground,addEventListener:(_,fn)=>{stateChange=fn;return{remove(){}};}},Easing:{...base.Easing,sin:x=>x},Animated:{...base.Animated,sequence:x=>x,loop:()=>({start(){starts++;},stop(){stops++;}})}};
  const h=createHarness({'react-native':native,'../../hooks/useReducedMotion':{default:()=>reduced,__esModule:true}});
  const Art=h.load('src/components/common/OnboardingStudents.jsx').default;
  const card=h.instance(Art,{active:false});assert.equal(starts,0);
  card.render({active:true});assert.equal(starts,1);
  stateChange('background');card.render();assert.equal(stops,1);
  stateChange('active');card.render();assert.equal(starts,2);
  reduced=true;card.render();assert.equal(stops,2);
  reduced=false;card.render();assert.equal(starts,3);
  card.render({active:false});assert.equal(stops,3);
  card.unmount();
});

test('all art is a bundled WebP and tour remains scrollable with larger text and compact screens', () => {
  for(const name of ['onboarding-student.webp','onboarding-staff.webp',...['student-feedback','student-updates','staff-register','staff-review','staff-archive'].map(name=>'onboarding-'+name+'.webp'),...['tracking','feedback','notifications','scan','review','archive'].map(name=>'onboarding-mascot-'+name+'.webp')]){const asset=fs.readFileSync('src/assets/'+name);assert.equal(asset.subarray(8,12).toString(),'WEBP');}
  for(const width of [320,393,800]){
    const base=createHarness().native;
    const h=createHarness({'react-native':{...base,useWindowDimensions:()=>({width,height:568,fontScale:2})}});
    const Screen=h.load('src/screens/auth/OnboardingScreen.jsx').default;
    const tree=h.instance(Screen,{onComplete:async()=>{}}).output;
    assert.ok(nodes(tree).some(n=>n.type==='ScrollView'));
    assert.ok(!nodes(tree).some(n=>n.type==='Text'&&n.props.numberOfLines));
  }
});

test('root shows onboarding for returning users before preserving each authenticated role dashboard', () => {
  let auth={user:null,role:null,isRestoring:false},onboarding={ready:false,completed:false,complete(){}};
  const h=createHarness({
    '../context/AuthContext':{useAuth:()=>auth},
    '../hooks/useOnboarding':{__esModule:true,default:()=>onboarding},
    '../screens/auth/OnboardingScreen':{__esModule:true,default:'Onboarding'},
    '../screens/SplashScreen':{__esModule:true,default:'Splash'},
    './AuthNavigator':{__esModule:true,default:'Auth'},
    './StudentNavigator':{__esModule:true,default:'Student'},
    './StaffNavigator':{__esModule:true,default:'Staff'},
    '../components/common/OfflineBanner':{__esModule:true,default:'Offline'},
    'expo-splash-screen':{hideAsync:async()=>{}},
  });
  const Root=h.load('src/navigation/RootNavigator.jsx').default;
  const root=h.instance(Root);assert.equal(root.output,null);
  onboarding={...onboarding,ready:true};root.render();
  assert.ok(nodes(root.output).some(n=>n.type==='Auth'&&!n.props.onboarding.completed));
  onboarding={...onboarding,completed:true};root.render();assert.ok(nodes(root.output).some(n=>n.type==='Auth'&&n.props.onboarding.completed));
  for(const role of ['student','staff','admin']){
    auth={user:{user_id:1},role,isRestoring:false};onboarding={...onboarding,ready:true,completed:false};root.render();
    assert.ok(nodes(root.output).some(n=>n.type==='Auth'));
    assert.ok(!nodes(root.output).some(n=>n.type==='Offline'));
    onboarding={...onboarding,completed:true};root.render();
    assert.ok(nodes(root.output).some(n=>n.type===(role==='student'?'Student':'Staff')));
    assert.ok(!nodes(root.output).some(n=>n.type==='Onboarding'));
  }
  auth={user:null,role:null,isRestoring:false,restoreError:{message:'Restore failed'},retryRestore(){}};root.render();
  assert.ok(nodes(root.output).some(n=>n.type==='Splash'&&n.props.error==='Restore failed'));
  auth={...auth,isRestoring:true};root.render();assert.equal(root.output,null);
});
const { test: onboardingTest } = require('node:test');
onboardingTest('compact onboarding assigns the boy and girl to their own role and keeps slide art illustration-only', () => {
  const h=createHarness();const Screen=h.load('src/screens/auth/OnboardingScreen.jsx').default;
  const screen=h.instance(Screen,{onComplete:async()=>{}});
  let art=nodes(screen.output).filter(n=>n.type?.name==='OnboardingStudents');
  assert.deepEqual(art.map(n=>n.props.character),['student','staff']);
  assert.equal(art.filter(n=>n.props.active).length,1);
  const heading=nodes(screen.output).find(n=>n.props?.accessibilityRole==='header');assert.ok(heading.props.style.fontSize<=20);
  button(screen.output,'Explore the Student tour').props.onPress();screen.render();
  art=nodes(screen.output).filter(n=>n.type?.name==='OnboardingStudents');assert.equal(art.length,1);assert.equal(art[0].props.character,'student');
  assert.equal(nodes(screen.output).filter(n=>n.type==='Image'&&String(n.props.source).includes('onboarding-mascot-')).length,3);
  assert.ok(!nodes(screen.output).some(n=>n.type==='Image'&&/feature-.*webp/.test(String(n.props.source))));
  assert.equal(art[0].props.style.bottom,0);
  assert.equal(art[0].props.style.height,'94%');
});

test('anatomical layers move the head and forearm at independent joints while leaving the torso anchored', () => {
  const base=createHarness().native;
  class Value extends base.Animated.Value {
    interpolate(config){for(const value of config.outputRange)assert.ok(Number.isFinite(parseFloat(value)), 'Every joint keyframe must have a finite angle');return {config};}
  }
  const h=createHarness({'react-native':{...base,AppState:{currentState:'active',addEventListener:()=>({remove(){}})},Animated:{...base.Animated,Value}},'../../hooks/useReducedMotion':{default:()=>true,__esModule:true}});
  const Art=h.load('src/components/common/OnboardingStudents.jsx').default;
  for(const character of ['student','staff']){
    const art=h.instance(Art,{character,active:false,style:{width:320,height:192}});
    art.output.props.onLayout({nativeEvent:{layout:{width:320,height:192}}});art.render();
    assert.equal(art.output.type,'View');
    assert.equal(art.output.props.style.transform,undefined,'No whole-image translation or rotation');
    const pieces=nodes(art.output).filter(n=>n.type?.name==='ArtworkPiece');
    assert.equal(pieces.length,4);
    const moving=pieces.filter(n=>n.props.rotation);assert.equal(moving.length,2);
    assert.notDeepEqual(moving[0].props.bounds.pivot,moving[1].props.bounds.pivot);
    for(const piece of moving){
      const tree=h.instance(piece.type,piece.props).output;
      assert.equal(tree.type,'AnimatedView');
      assert.ok(tree.props.style.left>0&&tree.props.style.top>0);
      const output=piece.props.rotation.config.outputRange;
      assert.equal(output[0],'0deg');assert.equal(output.at(-1),'0deg');
      assert.ok(output.some(value=>parseFloat(value)!==0));
    }
    for(const body of pieces.filter(n=>!n.props.rotation))assert.equal(h.instance(body.type,body.props).output.type,'View');
    art.unmount();
  }
});

test('each role and slide uses its own contextual mascots, with no feature glyphs or network artwork', () => {
  const h=createHarness();const Screen=h.load('src/screens/auth/OnboardingScreen.jsx').default;
  for(const [role,features] of Object.entries({student:['tracking','feedback','notifications'],staff:['scan','tracking','review','archive']})){
    const screen=h.instance(Screen,{onComplete:async()=>{}});
    nodes(screen.output).find(n=>n.props?.accessibilityRole==='radio'&&n.props.accessibilityLabel.startsWith(role==='student'?'Student':'OSA Staff')).props.onPress();screen.render();
    button(screen.output,`Explore the ${role==='student'?'Student':'Staff'} tour`).props.onPress();screen.render();
    for(let step=0;step<features.length;step++){
      const images=nodes(screen.output).filter(n=>n.type==='Image');
      assert.ok(images.some(n=>String(n.props.source).includes('onboarding-mascot-'+features[step]+'.webp')));
      assert.ok(images.every(n=>typeof n.props.source==='string'&&!/^https?:/.test(n.props.source)));
      assert.equal(nodes(screen.output).find(n=>n.type?.name==='OnboardingStudents').props.gesture,step);
      assert.ok(!nodes(screen.output).some(n=>n.type==='Icon'&&['file-text','message-circle','bell','maximize','check-square','cloud'].includes(n.props.name)));
      if(step<features.length-1){button(screen.output,'Next').props.onPress();screen.render();}
    }
  }
});

test('the auth shell opens onboarding first, keeps system bars hidden, and resumes login or the saved session', async () => {
  const h=createHarness({
    '@react-navigation/native-stack':{createNativeStackNavigator:()=>({Navigator:'AuthStack',Screen:'AuthScreen'})},
    '../screens/auth/LoginScreen':{__esModule:true,default:'Login'},
    '../screens/auth/OnboardingScreen':{__esModule:true,default:'Onboarding'},
  });
  const Auth=h.load('src/navigation/AuthNavigator.jsx').default;let saved=false,replaced;
  let tree=h.instance(Auth,{onboarding:{completed:false,complete:async()=>{saved=true;}}}).output;
  assert.equal(tree.props.initialRouteName,'Onboarding');assert.equal(tree.props.screenOptions.navigationBarHidden,true);
  const intro=nodes(tree).find(n=>n.props.name==='Onboarding');
  const screen=intro.props.children({navigation:{replace:route=>{assert.equal(saved,true);replaced=route;}}});
  await screen.props.onComplete();assert.equal(replaced,'Login');
  replaced=undefined;
  tree=h.instance(Auth,{onboarding:{completed:false,complete:async()=>{}},authenticated:true}).output;
  await nodes(tree).find(n=>n.props.name==='Onboarding').props.children({navigation:{replace:route=>{replaced=route;}}}).props.onComplete();
  assert.equal(replaced,undefined,'Root resumes authenticated dashboard without dispatching into an unmounted auth stack');
  tree=h.instance(Auth,{onboarding:{completed:true}}).output;assert.equal(tree.props.initialRouteName,'Login');
});

test('Back precedes Next in the footer, Skip is tour-only, and hardware back matches the visible control', () => {
  const h=createHarness();const Screen=h.load('src/screens/auth/OnboardingScreen.jsx').default;
  const screen=h.instance(Screen,{onComplete:async()=>{}});
  assert.equal(button(screen.output,'Skip'),undefined);
  button(screen.output,'Explore the Student tour').props.onPress();screen.render();
  assert.ok(button(screen.output,'Skip'));
  const row=nodes(screen.output).find(n=>Array.isArray(n.props?.children)&&n.props.children[0]?.props?.accessibilityLabel==='Previous onboarding page');
  assert.equal(row.props.children[1].props.label,'Next');
  button(screen.output,'Next').props.onPress();screen.render();
  nodes(screen.output).find(n=>n.props?.accessibilityLabel==='Previous onboarding page').props.onPress();screen.render();
  assert.ok(textOf(screen.output).includes('1 of 3'));
});

test('every feature has a distinct bundled pose with valid moving-joint geometry and anchored lower edge', () => {
  const h=createHarness();const {ONBOARDING_POSES}=h.load('src/data/onboardingCharacters.js');
  const {ONBOARDING_TOURS}=h.load('src/data/onboardingContent.js');
  for(const [role,poses] of Object.entries(ONBOARDING_POSES)){
    assert.equal(poses.length,ONBOARDING_TOURS[role].length);
    assert.equal(new Set(poses.map(p=>p.source)).size,poses.length);
    for(const pose of poses){
      for(const part of [pose.head,pose.arm,...pose.body]){
        assert.ok(part.x>=0&&part.y>=0&&part.x+part.width<=pose.width&&part.y+part.height<=pose.height);
        assert.ok(part.width>0&&part.height>0);
      }
      assert.notDeepEqual(pose.head.pivot,pose.arm.pivot);
    }
  }
  assert.ok(!JSON.stringify(ONBOARDING_TOURS).includes('Track every submission'));
  assert.ok(ONBOARDING_TOURS.student[0].title.startsWith('Monitor'));
});
