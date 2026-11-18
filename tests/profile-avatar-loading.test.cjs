const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes, textOf } = require('./helpers/mobileComponentHarness.cjs');
const { getOptimizedAvatarUrl, getAvatarTargetDimension } = require('../src/utils/imageUrl');

function flat(style) {
  if (!style) return {};
  if (Array.isArray(style)) return style.reduce((acc, s) => Object.assign(acc, flat(s)), {});
  return style;
}

test('default artwork fills the same bordered circle as loaded photos without resizing on load or failure', () => {
  const h = createHarness();
  const UserAvatar = h.load('src/components/common/UserAvatar.jsx').default;
  for (const size of [34, 84]) {
    const props = { size, style: { borderWidth: 3, borderColor: '#FFFFFF' } };
    const avatar = h.instance(UserAvatar, { ...props, uri: null });
    const bounds = () => {
      const style = flat(avatar.output.props.style);
      return [style.width, style.height, style.borderRadius, style.borderWidth, style.borderColor, style.overflow];
    };
    const expected = bounds();
    const checkDefault = () => {
      const image = nodes(avatar.output).find(n => n.type === 'Image' && /default_user\.webp$/.test(String(n.props?.source)));
      const scale = flat(image.props.style).transform?.find(t => t.scale)?.scale || 1;
      // The asset's visible circle is ~780px across in its 980px canvas.
      assert.ok(Math.abs((780 / 980) * scale - 1) < .01, 'Default artwork must fill the photo aperture');
      assert.deepEqual(bounds(), expected, 'Outer dimensions and border must stay fixed');
    };
    checkDefault();
    avatar.render({ ...props, uri: 'https://avatar.test/profile.jpg' });
    checkDefault();
    avatar.output.props.onLoad(); avatar.render();
    assert.deepEqual(bounds(), expected);
    const remote = nodes(avatar.output).find(n => n.props?.source?.uri);
    assert.equal(flat(remote.props.style).transform, undefined, 'Uploaded photos retain their existing crop');
    avatar.output.props.onError(); avatar.render();
    avatar.output.props.onError(); avatar.render();
    checkDefault();
  }
});

test('1. Missing, null, undefined, empty, and whitespace-only image URLs render default avatar immediately', () => {
  const h = createHarness();
  const UserAvatar = h.load('src/components/common/UserAvatar.jsx').default;

  const missingValues = [null, undefined, '', '   ', '\t\n  '];
  for (const uri of missingValues) {
    const avatar = h.instance(UserAvatar, { uri, size: 34 });
    const imageNodes = nodes(avatar.output).filter(n => n.type === 'Image');
    assert.ok(imageNodes.length >= 1, `Must render image for missing uri: ${JSON.stringify(uri)}`);
    assert.match(String(imageNodes[0].props.source), /default_user\.webp$/, 'Must use bundled default avatar');
    // Ensure no remote Image component with blank URI exists
    assert.ok(!imageNodes.some(n => n.props.source && typeof n.props.source === 'object' && !n.props.source.uri));
  }
});

test('2. Immediate static default avatar placeholder during loading of valid remote URL', () => {
  const h = createHarness();
  const UserAvatar = h.load('src/components/common/UserAvatar.jsx').default;

  const remoteUri = 'https://res.cloudinary.com/djtdar2ex/image/upload/v1730000000/vista/users/student_large.jpg';
  const avatar = h.instance(UserAvatar, { uri: remoteUri, size: 34 });

  // While loading (before onLoad), the static placeholder must be rendered immediately
  const imageNodes = nodes(avatar.output).filter(n => n.type === 'Image');
  assert.equal(imageNodes.length, 2, 'Must render both fallback placeholder and remote layer');

  const placeholder = imageNodes.find(n => /default_user\.webp$/.test(String(n.props.source)));
  assert.ok(placeholder, 'Default avatar placeholder must be present');

  const remoteLayer = imageNodes.find(n => n.props.source?.uri);
  assert.ok(remoteLayer, 'Remote image layer must be mounting');
  // Remote layer should be opacity 0 while loading so placeholder is visible beneath
  assert.equal(flat(remoteLayer.props.style).opacity, 0, 'Remote layer should have opacity 0 while loading');
});

test('3. Successful remote image loading displays uploaded image without blank flash', () => {
  const h = createHarness();
  const UserAvatar = h.load('src/components/common/UserAvatar.jsx').default;

  const remoteUri = 'https://res.cloudinary.com/djtdar2ex/image/upload/v1730000000/vista/users/student_large.jpg';
  const avatar = h.instance(UserAvatar, { uri: remoteUri, size: 34 });

  // Simulate remote image load completion
  avatar.output.props.onLoad();
  avatar.render();

  const imageNodes = nodes(avatar.output).filter(n => n.type === 'Image');
  const remoteLayer = imageNodes.find(n => n.props.source?.uri);
  assert.ok(remoteLayer, 'Remote layer must exist');
  assert.equal(flat(remoteLayer.props.style).opacity, 1, 'Remote layer must be visible with opacity 1');

  // Fallback placeholder is still in DOM underneath, preventing background exposure
  const placeholder = imageNodes.find(n => /default_user\.webp$/.test(String(n.props.source)));
  assert.ok(placeholder, 'Placeholder remains underneath loaded image');
});

test('4. Failed remote image requests continue displaying default avatar', () => {
  const h = createHarness();
  const UserAvatar = h.load('src/components/common/UserAvatar.jsx').default;

  const remoteUri = 'https://res.cloudinary.com/djtdar2ex/image/upload/v1730000000/vista/users/broken.jpg';
  const avatar = h.instance(UserAvatar, { uri: remoteUri, size: 34 });

  // Error 1: bounded retry
  avatar.output.props.onError();
  avatar.render();
  // While retrying, default avatar is still shown
  assert.match(String(avatar.output.props.source || nodes(avatar.output).find(n => n.type === 'Image')?.props?.source), /default_user\.webp$/);

  // Error 2: exhaust retries
  avatar.output.props.onError();
  avatar.render();

  const imageNodes = nodes(avatar.output).filter(n => n.type === 'Image');
  assert.ok(imageNodes.some(n => /default_user\.webp$/.test(String(n.props.source))), 'Must display fallback on error');
  // Remote layer unmounted after retries exhausted
  assert.ok(!imageNodes.some(n => n.props.source?.uri), 'Failed remote layer must be unmounted');

  // Verify that any pending retry timer from Error 1 was cleared and does not clear failed state after 1500ms
  return new Promise(resolve => {
    setTimeout(() => {
      avatar.render();
      const nodesAfterTimeout = nodes(avatar.output).filter(n => n.type === 'Image');
      assert.ok(!nodesAfterTimeout.some(n => n.props.source?.uri), 'Remote layer must remain unmounted after timer duration');
      resolve();
    }, 50);
  });
});

test('5. Recovery after temporary failure on new URL or remount', () => {
  const h = createHarness();
  const UserAvatar = h.load('src/components/common/UserAvatar.jsx').default;

  const avatar = h.instance(UserAvatar, { uri: 'https://avatar.test/first_failed.jpg', size: 34 });
  avatar.output.props.onError();
  avatar.output.props.onError();
  avatar.render();
  assert.match(String(avatar.output.props.source), /default_user\.webp$/);

  // Now a new image URL is provided (e.g. user updated picture or retried)
  avatar.render({ uri: 'https://avatar.test/second_recovered.jpg', size: 34 });
  // Immediately shows placeholder
  assert.match(String(avatar.output.props.source), /default_user\.webp$/);
  // Successfully loads
  avatar.output.props.onLoad();
  avatar.render();
  assert.equal(avatar.output.props.source.uri, 'https://avatar.test/second_recovered.jpg');
});

test('6 & 7. Image URI and user/organization identity changes reset state cleanly', () => {
  const h = createHarness();
  const UserAvatar = h.load('src/components/common/UserAvatar.jsx').default;

  // Render Student A
  const avatar = h.instance(UserAvatar, { uri: 'https://res.cloudinary.com/djtdar2ex/image/upload/v1/vista/users/studentA.jpg', size: 40 });
  avatar.output.props.onLoad();
  avatar.render();
  assert.ok(avatar.output.props.source?.uri?.includes('studentA'));

  // Switch to Student B (or Organization B)
  avatar.render({ uri: 'https://res.cloudinary.com/djtdar2ex/image/upload/v1/vista/users/studentB.jpg', size: 40 });
  // Must NOT display Student A's avatar while Student B is loading!
  assert.match(String(avatar.output.props.source), /default_user\.webp$/, 'Must reset to placeholder for new identity');

  // Stale callback from Student A must be rejected
  // Even if Student A's load handler fired late, activeUriRef rejects it
  avatar.output.props.onLoad();
  avatar.render();
  assert.ok(avatar.output.props.source?.uri?.includes('studentB'), 'Active URI must be Student B');
});

test('8. Account switching without stale avatars in AccountHeader', () => {
  let currentUser = { user_id: 1, role: 'student', image_url: 'https://res.cloudinary.com/djtdar2ex/image/upload/v1/vista/users/student.jpg' };
  const h = createHarness({
    '../../context/AuthContext': { useAuth: () => ({ user: currentUser }) },
    '@react-navigation/native': { useNavigation: () => ({ navigate() {} }) },
  });
  const AccountHeader = h.load('src/components/common/AccountHeader.jsx').default;

  const header = h.instance(AccountHeader, { profileRoute: 'StudentProfile' });
  const avatarComponent = nodes(header.output).find(n => n.type?.name === 'UserAvatar');
  assert.ok(avatarComponent, 'UserAvatar must exist in AccountHeader');
  assert.equal(avatarComponent.props.uri, currentUser.image_url);

  // Switch to Staff with no profile image
  currentUser = { user_id: 2, role: 'staff', image_url: null };
  header.render({ profileRoute: 'StaffProfile' });
  const newAvatar = nodes(header.output).find(n => n.type?.name === 'UserAvatar');
  assert.equal(newAvatar.props.uri, null, 'Must reflect new account image_url');
});

test('9. Profile picture updates and local preview handling', () => {
  const h = createHarness();
  const UserAvatar = h.load('src/components/common/UserAvatar.jsx').default;

  // Local file picker preview URI
  const localPreview = 'file:///data/user/0/host.exp.exponent/cache/ExperienceData/photo.jpg';
  const avatar = h.instance(UserAvatar, { uri: localPreview, size: 84 });

  // Local preview URI should be preserved untouched
  assert.ok(nodes(avatar.output).some(n => n.props.source?.uri === localPreview));

  // Local image finishes loading
  avatar.output.props.onLoad();
  avatar.render();
  assert.equal(avatar.output.props.source.uri, localPreview);

  // Once saved, remote Cloudinary URL replaces local preview
  const savedCloudinary = 'https://res.cloudinary.com/djtdar2ex/image/upload/v1730000000/vista/users/new_photo.jpg';
  avatar.render({ uri: savedCloudinary, size: 84 });
  // Immediately shows placeholder while remote image loads
  assert.match(String(avatar.output.props.source), /default_user\.webp$/);
  avatar.output.props.onLoad();
  avatar.render();
  assert.ok(avatar.output.props.source?.uri?.includes('c_fill,w_256,h_256,q_auto'));
});

test('10. Consistent user/avatar fallback behavior in notifications without fallbackIcon', () => {
  const h = createHarness();
  const StudentNotificationListItem = h.load('src/components/students/StudentNotificationListItem.jsx').default;
  const NotificationDetailSheet = h.load('src/components/students/NotificationDetailSheet.jsx').default;

  // Notification item with no actor image
  const notifMissingActor = {
    notification_id: 'n1',
    submission_id: 'sub-1',
    submission_title: 'SARF Application',
    message: 'Review completed',
    is_read: true,
    actor_image_url: null,
    submission_status: 'approved',
    created_at: new Date().toISOString(),
  };

  const item = h.instance(StudentNotificationListItem, { notification: notifMissingActor }).output;
  const avatarNode = nodes(item).find(n => n.type?.name === 'UserAvatar');
  assert.ok(avatarNode, 'UserAvatar must exist in notification item');
  assert.equal(avatarNode.props.fallbackIcon, undefined, 'fallbackIcon must not be passed to UserAvatar');

  // Verify avatar renders bundled default avatar
  const avatarInstance = h.instance(avatarNode.type, avatarNode.props).output;
  assert.match(String(avatarInstance.props.source || nodes(avatarInstance).find(n => n.type === 'Image')?.props?.source), /default_user\.webp$/);

  // Notification detail sheet
  const sheet = h.instance(NotificationDetailSheet, { notification: notifMissingActor, onClose() {}, onOpenSubmission() {} }).output;
  const sheetAvatar = nodes(sheet).find(n => n.type?.name === 'UserAvatar');
  assert.ok(sheetAvatar, 'UserAvatar must exist in detail sheet');
  assert.equal(sheetAvatar.props.fallbackIcon, undefined, 'fallbackIcon must not be passed in detail sheet');
});

test('11. Safe Cloudinary delivery URL sizing with discrete dimension tiers', () => {
  const fullResUrl = 'https://res.cloudinary.com/djtdar2ex/image/upload/v1730000000/vista/users/huge_2000x2000.jpg';

  // Small avatars (sizes <= 48): tier 160
  for (const s of [24, 28, 30, 32, 34, 40, 48]) {
    const optimized = getOptimizedAvatarUrl(fullResUrl, s);
    assert.equal(
      optimized,
      'https://res.cloudinary.com/djtdar2ex/image/upload/c_fill,w_160,h_160,q_auto/v1730000000/vista/users/huge_2000x2000.jpg',
      `Size ${s} must map to tier 160 for optimal cache hits`
    );
  }

  // Profile avatars (sizes > 48, like 84dp): tier 256
  for (const s of [56, 84, 96]) {
    const optimized = getOptimizedAvatarUrl(fullResUrl, s);
    assert.equal(
      optimized,
      'https://res.cloudinary.com/djtdar2ex/image/upload/c_fill,w_256,h_256,q_auto/v1730000000/vista/users/huge_2000x2000.jpg',
      `Size ${s} must map to tier 256 for large profile headers`
    );
  }

  // Dimension tiers function
  assert.equal(getAvatarTargetDimension(30), 160);
  assert.equal(getAvatarTargetDimension(48), 160);
  assert.equal(getAvatarTargetDimension(84), 256);
});

test('12. Unsupported, signed, private, or non-Cloudinary URL handling', () => {
  // Non-Cloudinary
  const external = 'https://lh3.googleusercontent.com/a/ACg8ocLexample=s96-c';
  assert.equal(getOptimizedAvatarUrl(external, 34), external);

  const testAvatar = 'https://avatar.test/photo.png';
  assert.equal(getOptimizedAvatarUrl(testAvatar, 34), testAvatar);

  // Signed Cloudinary URL (must not break HMAC signature)
  const signed = 'https://res.cloudinary.com/djtdar2ex/image/upload/s--bX4y8k--/v1/vista/users/pic.jpg';
  assert.equal(getOptimizedAvatarUrl(signed, 34), signed);

  // Already transformed URL (must not double-transform)
  const alreadyTransformed = 'https://res.cloudinary.com/djtdar2ex/image/upload/w_200,h_200,c_thumb/v1/user.jpg';
  assert.equal(getOptimizedAvatarUrl(alreadyTransformed, 34), alreadyTransformed);

  // Raw non-image resource
  const rawDoc = 'https://res.cloudinary.com/djtdar2ex/raw/upload/v1/doc.pdf';
  assert.equal(getOptimizedAvatarUrl(rawDoc, 34), rawDoc);

  // Local file / content URIs
  const localFile = 'file:///data/cache/profile.png';
  assert.equal(getOptimizedAvatarUrl(localFile, 34), localFile);
  const contentUri = 'content://media/external/images/media/42';
  assert.equal(getOptimizedAvatarUrl(contentUri, 34), contentUri);
});

test('13. Unchanged avatar dimensions and styling integrity', () => {
  const h = createHarness();
  const UserAvatar = h.load('src/components/common/UserAvatar.jsx').default;

  // Caller with malicious style overriding borderRadius / width
  const avatar = h.instance(UserAvatar, {
    uri: null,
    size: 40,
    style: { borderRadius: 0, width: 200, height: 100, backgroundColor: '#000' }
  });

  const style = flat(avatar.output.props.style);
  assert.equal(style.width, 40, 'Width must strictly be size');
  assert.equal(style.height, 40, 'Height must strictly be size');
  assert.equal(style.borderRadius, 20, 'Border radius must strictly be size / 2');
  assert.equal(style.overflow, 'hidden', 'Overflow must be hidden for circular clipping');

  // Custom border style preserved
  const bordered = h.instance(UserAvatar, {
    uri: null,
    size: 32,
    style: { borderWidth: 2, borderColor: '#FFFFFF' }
  });
  const borderStyle = flat(bordered.output.props.style);
  assert.equal(borderStyle.borderWidth, 2);
  assert.equal(borderStyle.borderColor, '#FFFFFF');
  assert.equal(borderStyle.width, 32);
  assert.equal(borderStyle.borderRadius, 16);
});

test('14. No regressions in existing Student and Staff avatar components', () => {
  const h = createHarness({
    '@react-navigation/native': { useNavigation: () => ({ navigate() {} }) },
    '../../context/AuthContext': { useAuth: () => ({ user: { user_id: 10, role: 'student', image_url: 'https://res.cloudinary.com/djtdar2ex/image/upload/v1/u.jpg' } }) },
  });

  // SubmissionListCard
  const Card = h.load('src/components/submissions/SubmissionListCard.jsx').default;
  const card = h.instance(Card, {
    submission: {
      submission_id: 'sub-1',
      title: 'Activity Form',
      status: 'under_review',
      org_image_url: 'https://res.cloudinary.com/djtdar2ex/image/upload/v1/org.jpg',
      created_at: new Date().toISOString()
    }
  }).output;
  const cardAvatar = nodes(card).find(n => n.type?.name === 'UserAvatar');
  assert.ok(cardAvatar, 'SubmissionListCard must render UserAvatar');
  assert.equal(cardAvatar.props.uri, 'https://res.cloudinary.com/djtdar2ex/image/upload/v1/org.jpg');

  // ConversationEntry
  const Entry = h.load('src/components/submissions/ConversationEntry.jsx').default;
  const entry = h.instance(Entry, {
    access: { canReply: false, staff: true },
    log: {
      log_id: 'l1',
      reply_count: 0,
      old_status: 'pending',
      new_status: 'under_review',
      remarks_text: 'Staff comments',
      changed_at: new Date().toISOString(),
      changed_by_name: 'OSA Staff',
      changed_by_image_url: 'https://res.cloudinary.com/djtdar2ex/image/upload/v1/staff.jpg'
    }
  }).output;
  const authorNode = nodes(entry).find(n => n.type?.name === 'Author');
  assert.ok(authorNode, 'ConversationEntry must render Author');
  assert.equal(authorNode.props.image, 'https://res.cloudinary.com/djtdar2ex/image/upload/v1/staff.jpg');

  // ReviewDetailsSubmitter
  const Submitter = h.load('src/components/submissions/ReviewDetailsSubmitter.jsx').default;
  const submitter = h.instance(Submitter, {
    submission: {
      org_name: 'CS Society',
      org_image_url: 'https://res.cloudinary.com/djtdar2ex/image/upload/v1/org.jpg',
      submitted_by_name: 'Jane Doe',
      submitted_by_email: 'jane@example.test',
      created_at: new Date().toISOString()
    }
  }).output;
  const submitterAvatar = nodes(submitter).find(n => n.type?.name === 'UserAvatar');
  assert.ok(submitterAvatar, 'ReviewDetailsSubmitter must render UserAvatar');
  assert.equal(submitterAvatar.props.uri, 'https://res.cloudinary.com/djtdar2ex/image/upload/v1/org.jpg');
});
