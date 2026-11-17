const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, nodes } = require('./helpers/mobileComponentHarness.cjs');
const component = name => ({ __esModule: true, default: name });

for (const role of ['staff', 'student']) for (const bottom of [0, 34]) {
  test(`${role} details omit the navbar, retain back/composer controls and respect ${bottom}dp safe area`, () => {
    const user = { user_id: 7, role, org_id: 1 };
    const submission = { submission_id: 'layout-fixture', submitted_by: 7, status: 'approved' };
    const log = { log_id: 'review-fixture', can_reply: true, reply_count: 1 };
    const progress = { value: 0 };
    const h = createHarness({
      '../../context/AuthContext': { useAuth: () => ({ user }) },
      '@tanstack/react-query': { useQuery: () => ({ data: submission, isFetchedAfterMount: true }), useQueryClient: () => ({}) },
      'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 24, right: 0, bottom, left: 0 }) },
      'react-native-keyboard-controller': { KeyboardAvoidingView: 'KeyboardAvoidingView', useReanimatedKeyboardAnimation: () => ({ progress }) },
      '../../hooks/useSubmissionConversation': { __esModule: true, default: () => ({ hasReply: true, target: { log }, entries: [log], logs: {} }) },
      '../staff/DriveArchiveCard': component('DriveArchiveCard'),
      './SubmissionTicket': component('SubmissionTicket'), './SubmissionConversation': component('SubmissionConversation'),
      './ReplyComposer': component('ReplyComposer'), './StaffStatusSheet': component('StaffStatusSheet'), './ReviewDriveTask': component('ReviewDriveTask'),
    });
    const Page = h.load('src/components/submissions/SubmissionDetailsScreen.jsx').default;
    const outer = h.instance(Page, { navigation: {}, route: { params: { submission } } });
    const details = h.instance(outer.output.type, outer.output.props);
    assert.ok(nodes(details.output).some(n => n.type?.name === 'SubPageHeader'));
    const composer = nodes(details.output).find(n => n.type === 'ReplyComposer');
    assert.ok(composer);
    assert.equal(typeof composer.props.onStatus, role === 'staff' ? 'function' : 'undefined');
    assert.ok(!nodes(details.output).some(n => /BottomNav/.test(n.type?.name || String(n.type))));
    const gap = () => nodes(details.output).find(n => n.type === 'AnimatedView').props.style.height;
    assert.equal(gap(), bottom, 'Use the device inset without adding a gap below the composer');
    progress.value = 1; details.render();
    assert.equal(gap(), 0, 'Keyboard avoidance handles the bottom while typing');
    progress.value = 0; details.render(); assert.equal(gap(), bottom);
    details.unmount(); outer.unmount();
  });
}
