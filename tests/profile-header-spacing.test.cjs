const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes } = require('./helpers/mobileComponentHarness.cjs');

test('Profile header height increased by ~40dp, positioning blue panel and avatar lower while preserving top button positions', () => {
  const user = { user_id: 1, first_name: 'Isabella', last_name: 'Gonzales', role: 'student' };
  const h = createHarness({
    '../../context/AuthContext': { useAuth: () => ({ user, updateUser() {}, logout() {} }) },
    '../../theme/layout': {
      useStaffLayout: () => ({ horizontal: { paddingHorizontal: 16 } }),
      useBottomNavClearance: () => 68,
    },
    '../../services/authService': { authService: { me() {} } },
    '@tanstack/react-query': { useQuery: () => ({ data: user, isPending: false }) },
  });

  const Screen = h.load('src/screens/shared/EditProfileScreen.jsx').default;
  const tree = h.instance(Screen, { navigation: { canGoBack: () => true, goBack() {} } }).output;

  // 1. Root container
  assert.equal(tree.props.className, 'flex-1 bg-[#F3F3F3]');

  // 2. Top header button row
  const buttonRow = nodes(tree).find(n => n.props?.style?.some?.(s => s?.paddingTop === 8 && s?.paddingBottom === 20));
  assert.ok(buttonRow, 'Top button row must exist with paddingTop: 8 and paddingBottom: 20');

  // Back button and Settings gear inside button row
  const backBtn = nodes(buttonRow).find(n => n.props?.accessibilityLabel === 'Back');
  assert.ok(backBtn, 'Back button must exist in header row');
  const settingsBtn = nodes(buttonRow).find(n => n.props?.accessibilityLabel === 'Open Settings');
  assert.ok(settingsBtn, 'Settings button must exist in header row');

  // 3. Blue profile panel with increased header spacing
  const bluePanel = nodes(tree).find(n => n.props?.className === 'flex-1 bg-[#245EA9]');
  assert.ok(bluePanel, 'Blue panel must exist');
  const panelStyle = Object.assign({}, ...[].concat(bluePanel.props.style || {}));
  assert.equal(panelStyle.borderTopLeftRadius, 20, 'Blue panel must retain 20dp top-left radius');
  assert.equal(panelStyle.borderTopRightRadius, 20, 'Blue panel must retain 20dp top-right radius');
  assert.equal(panelStyle.overflow, 'visible', 'Blue panel must have visible overflow for avatar');

  // Check new marginTop: 44 (increased by 40dp from previous 4dp)
  assert.equal(panelStyle.marginTop, 44, 'Blue panel marginTop must be 44dp (40dp increase, within 35-50dp target)');

  // Total white header height from safe-area top to blue panel:
  // paddingTop (8) + button minHeight (48) + paddingBottom (20) + marginTop (44) = 120dp
  // Previous: 8 + 48 + 20 + 4 = 80dp -> Increased by exactly 40dp!
  const prevHeaderHeight = 8 + 48 + 20 + 4; // 80dp
  const newHeaderHeight = 8 + 48 + 20 + panelStyle.marginTop; // 120dp
  const heightIncrease = newHeaderHeight - prevHeaderHeight;
  assert.ok(heightIncrease >= 35 && heightIncrease <= 50, `Header height increase must be 35-50dp (was ${heightIncrease}dp)`);

  // 4. Overlapping avatar moved downward together with the panel
  const avatarWrap = nodes(bluePanel).find(n => n.props?.style?.top === -34 && n.props?.style?.position === 'absolute');
  assert.ok(avatarWrap, 'Avatar container must maintain top: -34 overlap on the blue panel');
  const avatar = nodes(avatarWrap).find(n => n.type?.name === 'UserAvatar');
  assert.equal(avatar.props.size, 84, 'Avatar must retain 84dp size');

  // Camera button
  const cameraBtn = nodes(avatarWrap).find(n => n.props?.accessibilityLabel === 'Change profile photo');
  assert.ok(cameraBtn, 'Camera button must exist on avatar');
  assert.equal(cameraBtn.props.style.width, 32);
  assert.equal(cameraBtn.props.style.height, 32);

  // 5. Preserved form controls and logout
  assert.ok(nodes(bluePanel).some(n => n.props?.placeholder === 'First Name'));
  assert.ok(nodes(bluePanel).some(n => n.props?.placeholder === 'Last Name'));
  assert.ok(nodes(bluePanel).some(n => n.props?.accessibilityLabel === 'Update Profile'));
  assert.ok(nodes(bluePanel).some(n => n.props?.accessibilityLabel === 'Cancel'));
  assert.ok(nodes(bluePanel).some(n => n.props?.accessibilityLabel === 'Change Password'));
  assert.ok(nodes(bluePanel).some(n => n.props?.accessibilityLabel === 'Log out'));

  // 6. ProfileSkeleton matches new white header height and blue panel positioning
  const { ProfileSkeleton } = h.load('src/components/common/Skeleton.jsx');
  const skelTree = h.instance(ProfileSkeleton).output;
  assert.equal(skelTree.props.accessibilityLabel, 'Loading profile');

  // Skeleton header row
  const skelHeader = nodes(skelTree).find(n => {
    const style = Object.assign({}, ...[].concat(n.props?.style || {}));
    return style.paddingTop === 8 && style.paddingBottom === 20;
  });
  assert.ok(skelHeader, 'ProfileSkeleton must render top header icon placeholders');

  // Skeleton blue panel
  const skelBluePanel = nodes(skelTree).find(n => n.props?.style?.backgroundColor === '#245EA9');
  assert.ok(skelBluePanel, 'ProfileSkeleton must render blue panel');
  assert.equal(skelBluePanel.props.style.marginTop, 44, 'ProfileSkeleton blue panel must match marginTop: 44');
  assert.equal(skelBluePanel.props.style.borderTopLeftRadius, 20);
  assert.equal(skelBluePanel.props.style.borderTopRightRadius, 20);

  // Skeleton avatar
  const skelAvatar = nodes(skelBluePanel).find(n => n.props?.width === 84 && n.props?.height === 84 && n.props?.radius >= 42);
  assert.ok(skelAvatar, 'ProfileSkeleton must render matching 84dp avatar placeholder');
});
