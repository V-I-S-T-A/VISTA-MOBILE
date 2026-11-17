const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHarness,nodes,textOf}=require('./helpers/mobileComponentHarness.cjs');
const flat=s=>Object.assign({},...(Array.isArray(s)?s:[s]));
test('original compact conversation appearance preserves thread targets, compact text and read-only guards for both roles',()=>{
 for(const role of ['staff','student']){
  const reply={reply_id:'child',parent_reply:'root',author_name:'A very long author name that must wrap naturally',message:'Long message '.repeat(50),created_at:'2026-11-01T01:00:00Z'};
  const query={data:{pages:[{results:[reply],count:1}]},isPending:false,isError:false};
  const h=createHarness({'@tanstack/react-query':{useInfiniteQuery:()=>query},'../../services/reviewLogsService':{reviewLogsService:{}}});
  const {default:Entry,ThreadedReply,MessageText}=h.load('src/components/submissions/ConversationEntry.jsx');
  const log={log_id:'log',new_status:'approved',old_status:'approved',can_reply:true,reply_count:1,remarks_text:'Original review text'};
  let selected;const entry=h.instance(Entry,{log,access:{canReply:true,staff:role==='staff'},conversation:{selectTarget:(...v)=>{selected=v;}},onAccessLost(){}});
  const card=flat(entry.output.props.style);assert.equal(card.padding,undefined);assert.equal(card.paddingHorizontal,12);assert.equal(card.paddingVertical,8);assert.equal(card.marginBottom,8);assert.equal(card.height,undefined);assert.equal(card.minHeight,undefined);
  const toggle=()=>nodes(entry.output).find(n=>n.props?.accessibilityState?.expanded!==undefined);
  toggle().props.onPress();entry.render();
  const child=nodes(entry.output).find(n=>n.type===ThreadedReply);child.props.onReply(reply);assert.equal(selected[0],log);assert.equal(selected[1],reply);
  const nested=h.instance(ThreadedReply,{reply,canReply:true,onReply:v=>{selected=v;}});
  assert.equal(flat(nested.output.props.style).paddingHorizontal,0);assert.equal(flat(nested.output.props.style).paddingVertical,2);assert.equal(flat(nested.output.props.style).paddingRight,10);
  assert.ok(!nodes(nested.output).some(n=>n.type?.name==='UserAvatar'));assert.ok(!textOf(nested.output).includes('Replying to'));
  const message=nodes(nested.output).find(n=>n.type===MessageText);assert.equal(message.props.message,reply.message);
  const rendered=h.instance(MessageText,{message:reply.message}).output;assert.equal(rendered.props.style.fontSize,13);assert.equal(rendered.props.numberOfLines,undefined);
  nodes(nested.output).find(n=>n.type?.name==='ReplyButton').props.onPress();assert.equal(selected,reply);
  toggle().props.onPress();entry.render();assert.ok(!nodes(entry.output).some(n=>n.type===ThreadedReply));
  nested.render({reply,canReply:false});assert.ok(!nodes(nested.output).some(n=>n.type?.name==='ReplyButton'));
 }
});
test('status-only entries reserve no empty action gap',()=>{
 const h=createHarness({'@tanstack/react-query':{useInfiniteQuery:()=>({})},'../../services/reviewLogsService':{reviewLogsService:{}}});
 const Entry=h.load('src/components/submissions/ConversationEntry.jsx').default;
 const tree=h.instance(Entry,{log:{new_status:'approved',reply_count:0},access:{canReply:false},onAccessLost(){}}).output;
 const emptyActions=nodes(tree).find(n=>flat(n.props?.style).flexDirection==='row' && flat(n.props?.style).gap===8 && flat(n.props?.style).marginTop===undefined);
 assert.ok(emptyActions);
});

test('original compact vertical spacing is restored exactly',()=>{
 const h=createHarness({'@tanstack/react-query':{useInfiniteQuery:()=>({data:{pages:[]}})},'../../services/reviewLogsService':{reviewLogsService:{}}});
 const {default:Entry,ThreadedReply}=h.load('src/components/submissions/ConversationEntry.jsx');
 const entry=h.instance(Entry,{log:{new_status:'approved',reply_count:1,remarks_text:'Message'},access:{canReply:false},onAccessLost(){}});
 const styles=()=>nodes(entry.output).map(n=>flat(n.props?.style));
 assert.ok(styles().some(s=>s.paddingTop===4 && s.padding===0));
 assert.ok(styles().some(s=>s.paddingVertical===4 && s.paddingHorizontal===6 && s.gap===4));
 nodes(entry.output).find(n=>n.props?.accessibilityState?.expanded!==undefined).props.onPress();entry.render();
 assert.ok(styles().some(s=>s.borderLeftWidth===1 && s.paddingLeft===6 && s.gap===2 && s.marginTop===undefined));
 const reply=h.instance(ThreadedReply,{reply:{author_name:'Author',message:'Message'},canReply:true,onReply(){}}).output;
 const identity=reply.props.children[0];assert.equal(flat(identity.props.style).marginBottom,undefined);
 const action=nodes(reply).find(n=>n.type?.name==='ReplyButton');assert.equal(action.props.style,undefined);
});

test('nested replies render compact author timestamp row, body line-height, and compact action button', () => {
  const h = createHarness();
  const { ThreadedReply } = h.load('src/components/submissions/ConversationEntry.jsx');
  const reply = {
    reply_id: 'r-1',
    author_name: 'Jane Doe',
    created_at: new Date(Date.now() - 300000).toISOString(),
    message: 'Thanks for the quick review!',
  };
  let repliedTo;
  const tree = h.instance(ThreadedReply, { reply, canReply: true, onReply: r => { repliedTo = r; } }).output;

  // Author & Time row
  const timeNode = nodes(tree).find(n => n.type === 'Text' && textOf(n).includes('ago'));
  assert.ok(timeNode, 'Relative timestamp exists');
  assert.equal(flat(timeNode.props.style).marginTop, 0, 'Nested reply timestamp has 0 marginTop to align level with author name');

  // Reply Button is compact
  const replyButton = nodes(tree).find(n => n.type?.name === 'ReplyButton');
  assert.ok(replyButton, 'Reply button exists');
  assert.equal(replyButton.props.compact, true, 'Nested reply uses compact ReplyButton mode');

  // Render the ReplyButton component to verify its inner compact styles
  const buttonInstance = h.instance(replyButton.type, replyButton.props).output;
  const buttonStyle = flat(buttonInstance.props.style);
  assert.equal(buttonStyle.minHeight, 48, 'Compact reply button has 20dp minHeight (not 48dp)');
  assert.equal(buttonStyle.marginTop, undefined, 'Compact reply button has tight marginTop close to message text');
  assert.equal(buttonInstance.props.hitSlop?.top, 8, 'Maintains safe touch target via hitSlop');
  assert.equal(buttonInstance.props.hitSlop?.bottom, 8);

  // Text inside compact ReplyButton
  const linkText = nodes(buttonInstance).find(n => n.type === 'Text' && textOf(n) === 'Reply');
  assert.ok(linkText);
  assert.equal(flat(linkText.props.style).fontSize, 12, 'Compact reply link uses 11sp font size');

  // OnPress continues working
  buttonInstance.props.onPress();
  assert.equal(repliedTo, reply, 'Compact reply button triggers onReply callback');
});

test('Track Details header, ticket, and conversation spacing are tightly bounded', () => {
  const h = createHarness();
  const Ticket = h.load('src/components/submissions/SubmissionTicket.jsx').default;
  const ticketTree = h.instance(Ticket, {
    submission: {
      submission_id: 'sub-1',
      title: 'Title',
      status: 'under_review',
      documents: [],
    },
    viewerRole: 'student',
    access: { owner: true },
    user: { user_id: 1, role: 'student' },
  }).output;

  const ticketStyle = flat(ticketTree.props.style);
  assert.equal(ticketStyle.marginBottom, 16, 'Ticket bottom margin is tightly bounded to 10dp');

  // Verify ConversationEntry action buttons use content-responsive 24dp height with hitSlop
  const { default: Entry } = h.load('src/components/submissions/ConversationEntry.jsx');
  const entry = h.instance(Entry, {
    log: { log_id: 'l1', new_status: 'under_review', can_reply: true, reply_count: 2, remarks_text: 'Remarks' },
    access: { canReply: true },
    onReply() {},
    onAccessLost() {},
  });

  const replyButton = nodes(entry.output).find(n => n.type?.name === 'ReplyButton');
  assert.ok(replyButton);
  const btn = h.instance(replyButton.type, replyButton.props).output;
  const btnStyle = flat(btn.props.style);
  assert.equal(btnStyle.minHeight, 48, 'Primary reply button uses content-responsive 24dp minHeight');
  assert.equal(btn.props.hitSlop?.top, 8, 'ReplyButton preserves safe touch target via hitSlop');

  const viewReplies = nodes(entry.output).find(n => n.type === 'TouchableOpacity' && textOf(n).includes('View replies'));
  assert.ok(viewReplies);
  assert.equal(flat(viewReplies.props.style).minHeight, 48, 'View replies preserves safe touch target via hitSlop');
});

test('Track Details page layout bounds gaps and removes excess bottom padding', () => {
  const owner = { user_id: 7, role: 'student', org_id: 1, org_joined_at: '2026-10-01' };
  const submission = { submission_id: 'sub-a', submitted_by: 7, status: 'approved', title: 'Test', documents: [] };
  const log = { log_id: 'log-1', can_reply: true, reply_count: 0, remarks_text: 'Done.' };
  const query = { data: submission, isPending: false, isError: false, isFetchedAfterMount: true };
  const component = name => ({ default: name, __esModule: true });
  const h = createHarness({
    '@tanstack/react-query': { useQuery: () => query, useQueryClient: () => ({}) },
    '../../context/AuthContext': { useAuth: () => ({ user: owner }) },
    '../../theme/layout': { useStaffLayout: () => ({ body: {}, horizontal: {} }), panelStyles: { touch: { minHeight: 48 } }, useBottomNavClearance: () => 68 },
    '../common/Skeleton': { DetailsSkeleton: 'DetailsSkeleton' },
    '../common/SubPageHeader': component('SubPageHeader'),
    '../common/PageHeading': component('PageHeading'),
    '../staff/StaffBottomNav': component('StaffBottomNav'),
    '../students/StudentBottomNav': component('StudentBottomNav'),
    '../staff/DriveArchiveCard': component('DriveArchiveCard'),
    '../../services/submissionsService': { submissionsService: {} },
    '../../services/usersService': { usersService: {} },
    '../../utils/openDocumentEntryWithAttachment': {},
    '../../hooks/useSubmissionConversation': { default: () => ({ hasReply: true, target: { log, name: 'Staff' }, entries: [log], logs: {} }), __esModule: true },
    './ReviewDriveTask': component('ReviewDriveTask'),
    './SubmissionTicket': component('SubmissionTicket'),
    './SubmissionConversation': component('SubmissionConversation'),
    './ReplyComposer': component('ReplyComposer'),
    './StaffStatusSheet': component('StaffStatusSheet'),
  });

  const Screen = h.load('src/components/submissions/SubmissionDetailsScreen.jsx').default;
  const outer = h.instance(Screen, { route: { params: { submission } }, navigation: {} });
  const tree = h.instance(outer.output.type, outer.output.props).output;

  // PageHeading must be compact
  const heading = nodes(tree).find(n => n.type === 'PageHeading');
  assert.ok(heading);
  assert.equal(heading.props.compact, true, 'PageHeading uses compact mode');

  // Sticky SubPageHeader stays outside ScrollView
  const subHeader = nodes(tree).find(n => n.type === 'SubPageHeader');
  assert.ok(subHeader, 'Sticky SubPageHeader must render above ScrollView');

  // ScrollView paddingBottom with active composer is compact (12dp, not 116dp+)
  const scroll = nodes(tree).find(n => n.type === 'ScrollView');
  assert.ok(scroll);
  assert.equal(nodes(scroll).some(n => n.type === 'SubPageHeader'), false, 'SubPageHeader must be sticky outside ScrollView');
  assert.equal(scroll.props.contentContainerStyle.paddingBottom, 8, 'ScrollView bottom padding is 12dp when composer is active');
});
