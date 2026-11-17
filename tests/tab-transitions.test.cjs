const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes } = require('./helpers/mobileComponentHarness.cjs');
const { tabDirection } = require('../src/navigation/tabBackPolicy.cjs');
const flat = value => Object.assign({}, ...value);

for (const names of [
  ['StaffHome', 'StaffDocumentEntry', 'StaffReviewPanel', 'GDriveSync'],
  ['StudentHome', 'StudentTracker', 'StudentNotifications'],
]) test(`${names[0]} tab direction follows physical order rather than visit order`, () => {
  for (let from=0; from<names.length; from++) for (let to=0; to<names.length; to++) {
    const history = [...names].reverse().filter(name => name !== names[from]).map(name => ({name}));
    history.push({name:names[from]});
    assert.equal(tabDirection(history, names[to]), Math.sign(to-from));
    history.push({name:'Settings'});
    assert.equal(tabDirection(history, names[to]), Math.sign(to-from), 'Nested screens use their parent tab index');
  }
  assert.equal(tabDirection([{name:names[0]}], 'Settings'), 0);
});

function navigatorHarness() {
  let state = {routes:[{key:'home',name:'StaffHome'}],index:0};
  const animations=[];
  const descriptors={};
  const add = route => descriptors[route.key] ||= {options:{animation:'ios_from_right'},render:()=>route.name};
  state.routes.forEach(add);
  const h=createHarness({
    '@react-navigation/native': {StackRouter:'router',createNavigatorFactory:Component=>()=>({Navigator:Component}),useNavigationBuilder:()=>({state,descriptors,navigation:{},NavigationContent:'NavigationContent'})},
    '@react-navigation/native-stack': {createNativeStackNavigator(){}},
    'react-native-screens': {Screen:'Screen',ScreenContainer:'ScreenContainer'},
    '../components/common/OverlayPortal': {useIsOverlayOpen:()=>false},
  });
  h.native.Animated.Value.prototype.interpolate=function(config){return {source:this,...config};};
  h.native.Animated.Value.prototype.stopAnimation=function(){for(const a of animations) if(a.value===this && !a.finished){a.finished=true;a.callback?.({finished:false});}};
  h.native.Animated.timing=(value,config)=>({start(callback){animations.push({value,config,callback,finished:false});}});
  const nav=h.instance(h.load('src/navigation/createPushStackNavigator.jsx').createPushStackNavigator().Navigator,{screenOptions:{}});
  const jump=(key,name)=>{const route=state.routes.find(r=>r.key===key)||{key,name};add(route);state={routes:[...state.routes.filter(r=>r.key!==key),route],index:state.routes.filter(r=>r.key!==key).length};nav.render();};
  const views=()=>nodes(nav.output).filter(n=>n.type==='AnimatedView' && n.key);
  const finish=()=>{const frame=nodes(nav.output).find(n=>n.props?.transition);if(frame){const t=frame.props.transition;for(const key of t.scenes.keys())frame.props.onFinish(t.revision,key);}nav.render();};
  return {h,nav,jump,views,finish,animations,descriptors};
}

test('tab scenes coordinate both directions and retain cached keys and scene types',()=>{
  const r=navigatorHarness();r.jump('review','StaffReviewPanel');
  const frames=()=>nodes(r.nav.output).filter(n=>n.props?.sceneKey);
  const incoming=frames().find(n=>n.props.sceneKey==='review'),outgoing=frames().find(n=>n.props.sceneKey==='home');
  assert.equal(incoming.props.transition.direction,1);
  assert.equal(outgoing.props.transition,incoming.props.transition,'Both pages use the same transition revision');
  assert.equal(incoming.props.transition.scenes.get('home').exitDirection,-1);
  assert.equal(incoming.props.current,true);assert.equal(outgoing.props.current,false);
  assert.equal(flat(r.views().find(v=>v.key==='review').props.style).opacity,1);
  const sceneType=r.views().find(v=>v.key==='home').props.children[0].type;
  r.finish();r.jump('home','StaffHome');
  assert.equal(frames()[0].props.transition.direction,-1);
  assert.equal(frames()[0].props.transition.scenes.get('review').exitDirection,1);
  assert.equal(r.views().find(v=>v.key==='home').props.children[0].type,sceneType);
  r.finish();assert.equal(nodes(r.nav.output).find(n=>n.props?.value?.isActive).props.value.isActive(),false);
});

test('rapid switching keeps visible scene identities; stale completions cannot clear a newer transition',()=>{
  const r=navigatorHarness();r.jump('review','StaffReviewPanel');
  const first=nodes(r.nav.output).find(n=>n.props?.transition).props;
  r.jump('entry','StaffDocumentEntry');
  const latest=nodes(r.nav.output).find(n=>n.props?.transition).props;
  assert.equal(latest.transition.direction,-1);
  assert.equal(latest.transition.scenes.size,3);
  assert.equal(latest.transition.scenes.get('home').exitDirection,-1,'Earlier pages remain on their physical side');
  assert.equal(latest.transition.scenes.get('review').exitDirection,1);
  first.onFinish(first.transition.revision,'home');first.onFinish(first.transition.revision,'review');r.nav.render();
  assert.equal(nodes(r.nav.output).find(n=>n.props?.transition).props.transition,latest.transition);
  r.finish();assert.equal(nodes(r.nav.output).find(n=>n.props?.value?.isActive).props.value.isActive(),false);
});

test('reduced motion selects an immediate tab target and destination owns first-render loading',()=>{
  const r=navigatorHarness();r.descriptors.home.options.animation='none';r.jump('review','StaffReviewPanel');r.finish();
  r.jump('home','StaffHome');
  assert.equal(nodes(r.nav.output).find(n=>n.props?.transition).props.transition.reduced,true);
  const content=r.views().find(v=>v.key==='home').props.children[0];let renders=0;
  const body=r.h.instance(content.type,{...content.props,descriptor:{render:()=>{renders++;return 'Existing skeleton or cached page';}}});
  assert.equal(renders,1);assert.equal(body.output,'Existing skeleton or cached page');
  assert.equal(nodes(body.output).some(n=>n.type==='ActivityIndicator'),false);r.finish();
});

test('UI-thread tab frames retarget from the displayed offset and inverse header shares that value',()=>{
  const h=createHarness(),shared=[],timings=[];
  h.mocks['react-native-reanimated']={__esModule:true,default:{View:'TabView'},
    Easing:{cubic:x=>x*x*x,out:f=>f},runOnUI:f=>f,runOnJS:f=>f,
    useSharedValue(initial){const ref=h.mocks.react.useRef({value:initial});if(!shared.includes(ref.current))shared.push(ref.current);return ref.current;},
    useAnimatedStyle:f=>f(),cancelAnimation(){},withTiming(target,config,callback){timings.push({target,config,callback,from:shared[0].value});return shared[0].value;}};
  const Frame=h.load('src/navigation/TabScene.jsx').default;
  const finishes=[];const scenes=new Map([['home',{exitDirection:-1}],['review',{exitDirection:1}]]);
  const transition={scenes,to:'review',direction:1,revision:1,reduced:false,ready:true};
  const frame=h.instance(Frame,{sceneKey:'review',transition,width:360,current:true,onFinish:(...a)=>finishes.push(a),children:'Kept content'});
  assert.equal(timings[0].from,360);assert.equal(timings[0].target,0);
  shared[0].value=140;
  frame.render({...frame.props,transition:{...transition,to:'home',direction:-1,revision:2}});
  assert.equal(timings[1].from,140,'withTiming starts from the current shared native offset');
  assert.equal(timings[1].target,360);
  frame.render();
  const context=frame.output.props.children.props.value;
  assert.equal(context.offset,shared[0]);assert.equal(context.active,shared[1]);
  assert.equal(flat(frame.output.props.style).transform[0].translateX,140);
  frame.render({...frame.props,transition:{...transition,revision:3,reduced:true}});
  assert.equal(shared[0].value,0);assert.deepEqual(finishes,[[3,'review']]);
  frame.unmount();
});

test('header scrolls away only for positive scrolling, keeps its spacer and remains outside pull translation',()=>{
  const shared=[];
  const h=createHarness();
  const context={value:{visible:true,offset:{value:-123},active:{value:true},seed:0},Provider:'MotionProvider'};
  h.mocks['../../navigation/ScreenMotionContext']={ScreenMotionContext:context};
  h.mocks['react-native-reanimated']={__esModule:true,default:{View:'ReanimatedView',ScrollView:'NativeScroll',FlatList:'NativeList'},useSharedValue(initial){const ref=h.mocks.react.useRef({value:initial});if(!shared.includes(ref.current))shared.push(ref.current);return ref.current;},useAnimatedStyle:callback=>callback(),useAnimatedScrollHandler:handler=>handler,runOnJS:callback=>callback};
  const Wrapper=h.load('src/components/common/PullRefresh.jsx').PullRefreshScrollView;
  const wrapper=h.instance(Wrapper,{scrollHeader:{type:'Header',props:{}},children:'Existing body',style:{paddingHorizontal:20}});
  const header=h.instance(wrapper.output.type,wrapper.output.props);
  const layer=()=>nodes(header.output).find(n=>n.props?.onLayout);
  const mask=()=>nodes(header.output).find(n=>Array.isArray(n.props?.style) && n.props.style[0]?.overflow==='hidden');
  assert.equal(flat(mask().props.style).transform[0].translateX,123,'Header cancels only horizontal tab movement');
  assert.ok(layer().props.style.transform[0].translateY===0);
  shared[0].value=40;header.render();assert.equal(layer().props.style.transform[0].translateY,-40);
  shared[0].value=500;header.render();assert.equal(layer().props.style.transform[0].translateY,-72,'Header scrolls completely out of view');
  shared[0].value=-100;header.render();assert.ok(layer().props.style.transform[0].translateY===0,'Native overscroll leaves account chrome at the top');
  const scroll=nodes(header.output).find(n=>n.props?.headerOffset);
  assert.equal(scroll.props.indicatorOffset,72,'Refresh indicator is below the header');
  assert.equal(scroll.props.headerOffset,shared[0]);
  assert.ok(nodes(scroll.props.children).some(n=>n.props?.style?.height===72),'Header spacer preserves scroll coordinates');
  assert.equal(nodes(scroll.props.children).some(n=>n.type==='Header'),false);
  context.value={visible:false,offset:{value:50},active:{value:true},seed:0};header.render();assert.equal(flat(mask().props.style).opacity,0,'Outgoing header cannot double-draw');
});
const framesTest = test;
framesTest('cold tab animation waits for native layout and cached tabs reuse that readiness',()=>{
  const r=navigatorHarness();r.jump('review','StaffReviewPanel');
  let frame=nodes(r.nav.output).find(n=>n.props?.sceneKey==='review');
  assert.equal(frame.props.transition.ready,false,'A cold destination must mount its own skeleton before motion starts');
  r.views().find(n=>n.key==='review').props.onLayout();r.nav.render();
  frame=nodes(r.nav.output).find(n=>n.props?.sceneKey==='review');assert.equal(frame.props.transition.ready,true);
  r.finish();r.jump('home','StaffHome');r.finish();r.jump('review','StaffReviewPanel');
  assert.equal(nodes(r.nav.output).find(n=>n.props?.sceneKey==='review').props.transition.ready,true,'Cached native views need no second layout or remount');
});

test('a destination cannot flash onscreen before its native starting pose is committed',()=>{
  const frames=new Map();let next=0;const shared=[],timings=[];
  const h=createHarness({}, {requestAnimationFrame:callback=>{frames.set(++next,callback);return next;},cancelAnimationFrame:id=>frames.delete(id)});
  h.mocks['react-native-reanimated']={__esModule:true,default:{View:'TabView'},
    Easing:{cubic:x=>x,out:f=>f},runOnUI:f=>f,runOnJS:f=>f,cancelAnimation(){},
    useSharedValue(initial){const ref=h.mocks.react.useRef({value:initial});if(!shared.includes(ref.current))shared.push(ref.current);return ref.current;},
    useAnimatedStyle:f=>f(),withTiming(target,config){timings.push({target,config,from:shared[0].value});return shared[0].value;}};
  const transition={scenes:new Map([['review',{exitDirection:-1}]]),to:'review',direction:1,revision:1,ready:false,reduced:false};
  const frame=h.instance(h.load('src/navigation/TabScene.jsx').default,{sceneKey:'review',transition,width:360,current:true,onFinish(){},children:'Existing skeleton'});
  assert.equal(flat(frame.output.props.style).opacity,0);assert.equal(frames.size,0);assert.equal(timings.length,0);
  frame.render({...frame.props,transition:{...transition,ready:true}});
  assert.equal(flat(frame.output.props.style).opacity,0,'Only the outgoing page is visible during pose preparation');
  assert.equal(frames.size,1);const start=[...frames.values()][0];frames.clear();start();frame.render();
  assert.equal(timings[0].from,360);assert.equal(flat(frame.output.props.style).transform[0].translateX,360);
  assert.equal(flat(frame.output.props.style).opacity,1);
  shared[0].value=180;frame.render();assert.equal(flat(frame.output.props.style).transform[0].translateX,180);
});
test('nested push and closing scenes keep their underlying native page visible and non-interactive',()=>{
  const h=createHarness();
  h.mocks['react-native-reanimated']={__esModule:true,default:{View:'TabView'},useSharedValue:value=>({value}),useAnimatedStyle:fn=>fn(),runOnUI:fn=>fn,cancelAnimation(){}};
  const Frame=h.load('src/navigation/TabScene.jsx').default;
  const frame=h.instance(Frame,{sceneKey:'underlying',transition:null,width:360,current:false,visible:true,children:'Mounted underlying page'});
  assert.equal(flat(frame.output.props.style).opacity,1,'Nested parallax and interactive pop must expose their underlying page');
  assert.equal(frame.output.props.pointerEvents,'none');
  frame.render({...frame.props,visible:false});assert.equal(flat(frame.output.props.style).opacity,0,'Inactive independent tabs remain hidden');
});
