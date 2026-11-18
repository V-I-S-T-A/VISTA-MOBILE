const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const babel = require('@babel/core');
const traverse = require('@babel/traverse').default;

// Header slots scroll away normally but are separate from pull translation.
for (const [file, header] of [
  ['screens/staff/home/StaffHomeContent.jsx', 'AccountHeader'],
  ['screens/staff/StaffReviewPanel.jsx', 'StaffReviewHeader'],
  ['screens/student/StudentHomeScreen.jsx', 'StudentHeader'],
  ['screens/student/StudentTrackerScreen.jsx', 'StudentHeader'],
  ['screens/student/StudentNotificationsScreen.jsx', 'AccountHeader'],
  ['screens/staff/GDriveSync.jsx', 'StaffReviewHeader'],
  ['screens/staff/docEntry/StaffDocumentEntryContent.jsx', 'AccountHeader'],
]) test(`${file} separates its scroll-away header from moving refresh content`, () => {
  const ast = babel.parseSync(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), {
    configFile: false, babelrc: false, parserOpts: { plugins: ['jsx'] },
  });
  let headers = 0, scrolls = 0;
  traverse(ast, {
    JSXElement(node) {
      const name = node.node.openingElement.name.name;
      if (['ScrollView', 'FlatList', 'KeyboardAwareScrollView'].includes(name)) scrolls++;
      if (name === header || ['StaffBottomNav', 'StudentBottomNav'].includes(name)) {
        if (name === header) headers++;
        if (name === header) {
          assert.ok(node.findParent(parent => parent.isJSXAttribute() && parent.node.name.name === 'scrollHeader'), 'Use the separate scroll-aware header slot');
        } else assert.equal(!!node.findParent(parent => parent.isJSXElement() && ['ScrollView', 'FlatList', 'KeyboardAwareScrollView'].includes(parent.node.openingElement.name.name)), false,
          'Navigation remains outside the scroll/pull content');
      }
    },
  });
  assert.equal(headers, 1); assert.equal(scrolls, 1, 'Keep the existing single data scroll container');
});
