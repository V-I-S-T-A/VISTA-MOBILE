const MAIN_TABS = new Set([
  'StaffHome', 'StaffDocumentEntry', 'StaffReviewPanel', 'GDriveSync',
  'StudentHome', 'StudentTracker', 'StudentNotifications',
]);

const isMainTab = name => MAIN_TABS.has(name);

// Physical navbar order. The staff scan button is an action, not a tab.
const TAB_GROUPS = [
  ['StaffHome', 'StaffDocumentEntry', 'StaffReviewPanel', 'GDriveSync'],
  ['StudentHome', 'StudentTracker', 'StudentNotifications'],
];
function tabDirection(routes, destination) {
  let origin;
  for (let index = routes.length - 1; index >= 0; index--) {
    if (isMainTab(routes[index].name)) { origin = routes[index].name; break; }
  }
  const group = TAB_GROUPS.find(tabs => tabs.includes(origin) && tabs.includes(destination));
  return group ? Math.sign(group.indexOf(destination) - group.indexOf(origin)) : 0;
}

function backBoundary(state, source) {
  const index = source ? state.routes.findIndex(route => route.key === source) : state.index;
  if (index < 0) return { index, root: index, depth: 0 };
  let root = index;
  while (root > 0 && !isMainTab(state.routes[root].name)) root--;
  return { index, root, depth: index - root };
}

// Retain the original StackRouter's navigation, IDs and tab animations. Cached
// independent tabs are scenes, not eligible back destinations from a tab root.
function withTabBackBoundaries(router) {
  return {
    getStateForAction(state, action, options) {
      if (!['GO_BACK', 'POP', 'POP_TO_TOP', 'POP_TO'].includes(action.type)) {
        return router.getStateForAction(state, action, options);
      }
      const source = action.target === state.key ? action.source : undefined;
      const { index, root, depth } = backBoundary(state, source);
      if (depth === 0) return null; // Android system Back may exit/bubble at a root.
      if (action.type === 'POP_TO') {
        const target = state.routes.findLastIndex((route, i) => i <= index && route.name === action.payload.name);
        if (target < root) return null;
        return router.getStateForAction(state, action, options);
      }
      const count = action.type === 'GO_BACK' ? 1 : action.type === 'POP_TO_TOP' ? depth : Math.min(depth, Math.max(1, action.payload.count));
      return router.getStateForAction(state, { ...action, type: 'POP', payload: { count } }, options);
    },
  };
}

module.exports = { isMainTab, tabDirection, backBoundary, withTabBackBoundaries };
