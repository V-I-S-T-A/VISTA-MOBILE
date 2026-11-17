const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHarness,nodes,textOf}=require('./helpers/mobileComponentHarness.cjs');
test('both-role shared gutters use 16dp at 320 and 20dp at 360 with floating-navigation clearance',()=>{
 for(const width of [320,360]){
  const h=createHarness();h.native.useWindowDimensions=()=>({width,height:800,fontScale:1.5});
  const {useStaffLayout,useBottomNavClearance,panelStyles}=h.load('src/theme/layout.js');
  assert.equal(useStaffLayout().horizontal.paddingLeft,width===320?16:20);
  assert.equal(useStaffLayout().horizontal.paddingRight,width===320?16:20);
  assert.equal(useBottomNavClearance(),80);assert.equal(panelStyles.card.padding,12);assert.equal(panelStyles.state.paddingVertical,24);assert.equal(panelStyles.touch.minHeight,48);
 }
});
test('Drive Sync integration label is informational with shared readable typography and no inert button',()=>{
 const h=createHarness();const Top=h.load('src/screens/staff/gdriveSync/GDriveSyncTop.jsx').default;
 const tree=h.instance(Top).output;assert.match(textOf(tree),/Secure integration/);
 assert.ok(!nodes(tree).some(n=>n.type==='TouchableOpacity'));
 const label=nodes(tree).find(n=>textOf(n)==='Secure integration'&&n.type==='Text');assert.equal(label.props.style.fontSize,h.load('src/theme/tokens.js').type.label.fontSize);assert.equal(label.props.style.color,'#FFFFFF');
});
