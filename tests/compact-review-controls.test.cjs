const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');
const flat = s => Object.assign({}, ...(Array.isArray(s) ? s : [s]));
const named = (tree,label) => nodes(tree).find(n=>n.props?.label===label || n.props?.accessibilityLabel===label);

test('compact status options keep one selection surface, checked state and cancellation without parent changes',()=>{
 const h=createHarness(); const Select=h.load('src/components/staff/SelectField.jsx').default;
 const options=[{id:'under_review',label:'On Process'},{id:'approved',label:'Approved'},{id:'rejected',label:'Returned'}];
 const calls=[]; const field=h.instance(Select,{size:'compact',presentation:'inline',accessibilityLabel:'Document status',value:options[1],options,onChange:v=>calls.push(v)});
 let trigger=named(field.output,'Document status'); assert.equal(flat(trigger.props.style).minHeight,48);
 assert.ok(nodes(trigger).some(n=>flat(n.props?.style).minHeight===42));
 trigger.props.onPress();field.render();
 assert.ok(!nodes(field.output).some(n=>n.type?.name==='AppBottomSheet'));
 const rows=nodes(field.output).filter(n=>n.props?.accessibilityRole==='radio');
 assert.equal(rows.length,3);assert.equal(rows[1].props.accessibilityState.checked,true);
 assert.ok(rows.every(n=>flat(n.props.style).minHeight===48));
 assert.ok(nodes(rows[1]).some(n=>n.props?.name==='check'));
 named(field.output,'Cancel status selection').props.onPress();field.render();assert.equal(calls.length,0);
 named(field.output,'Document status').props.onPress();field.render();
 nodes(field.output).find(n=>n.props?.accessibilityRole==='radio'&&textOf(n)==='Returned').props.onPress();field.render();
 assert.equal(calls[0],options[2]);assert.equal(named(field.output,'Document status').props.accessibilityState.expanded,false);
});
test('opt-in compact input and button separate 42dp visuals from 48dp targets without shrinking defaults',()=>{
 const h=createHarness();const Button=h.load('src/components/common/AppButton.jsx').default;
 const button=h.instance(Button,{size:'compact',label:'Archive Approved Copy',variant:'accent'}).output;
 assert.equal(flat(button.props.style).minHeight,48);
 assert.ok(nodes(button).some(node=>flat(node.props?.style).minHeight===42),'The compact surface stays 42dp inside its animated 48dp target');
 const Input=h.load('src/components/common/AppInput.jsx').default;
 const input=h.instance(Input,{size:'compact',value:'Complete filename',accessibilityLabel:'File name'}).output;
 assert.equal(flat(input.props.style).minHeight,48);assert.equal(flat(input.props.children.props.style).minHeight,42);
 assert.equal(input.props.children.props.allowFontScaling,undefined);
 const regular=h.instance(Input,{value:'Unchanged default'}).output;assert.equal(flat(regular.props.style).minHeight,48);
});
test('archive summary has no duplicate upload or folder controls',()=>{
 const h=createHarness();
 const Card=h.load('src/components/staff/DriveArchiveCard.jsx').default;
 const panel=h.instance(Card,{submission:{status:'approved',drive_archives:[]},handledBy:'Reviewer'});
 assert.match(textOf(panel.output),/Approval recorded/);
 for(const label of ['Take Photo','Upload File','File name','Choose Folder','Automated Folder','Archive Approved Copy']) assert.equal(named(panel.output,label),undefined);
});
