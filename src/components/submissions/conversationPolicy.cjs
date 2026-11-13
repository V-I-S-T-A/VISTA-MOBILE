// Presentation guards complement server authorization; membership is never inferred locally.
const REPLY_MAX_LENGTH = 50;
const REPLY_LINK_MAX_LENGTH = 150;
const STATUS_TRANSITIONS = {
  pending: ['under_review', 'approved', 'rejected', 'resubmission_required'],
  under_review: ['approved', 'rejected', 'resubmission_required'],
  resubmission_required: ['under_review', 'pending', 'approved', 'rejected'],
  approved: ['under_review', 'resubmission_required', 'rejected'],
  rejected: ['under_review', 'resubmission_required', 'approved'],
};
function viewerScope(user) {
  return JSON.stringify([user?.user_id, user?.role, user?.org_id ?? null, user?.org_joined_at ?? null]);
}
function capabilities(submission, user) {
  const staff = ['staff', 'admin'].includes(user?.role);
  const owner = user?.role === 'student' && submission?.submitted_by != null && user?.user_id != null
    && String(submission.submitted_by) === String(user.user_id);
  return { staff, owner, canReply: staff || owner, viewOnly: user?.role === 'student' && !owner,
    banner: 'cosmic' };
}
function canReplyTo(log, access) { return access.canReply && log?.can_reply === true; }
function safeWebUrl(value) {
  if (typeof value !== 'string' || !/^https?:\/\/\S+$/i.test(value.trim())) return null;
  try { const url = new URL(value.trim()); return ['https:', 'http:'].includes(url.protocol.toLowerCase()) && url.hostname ? url.href : null; }
  catch { return null; }
}
function nextPage(page) { return page?.next ? (page.current_page || 1) + 1 : undefined; }
function uniqueRows(pages, field) {
  const seen = new Set();
  return (pages || []).flatMap(page => page.results || []).filter(row => {
    if (seen.has(row[field])) return false;
    seen.add(row[field]); return true;
  });
}
// Retain each unchanged request's token across ambiguous failures, even if the user
// temporarily edits another draft/target. These identifiers are not credentials.
function prepareReply(draft, link, logId, parentId, requests, createId) {
  const message = draft.trim();
  const url = link.trim();
  if (!message && !url) throw new Error('Enter a reply or add a link.');
  if ([...message].length > REPLY_MAX_LENGTH) throw new Error('Keep your reply to 50 characters or fewer.');
  if ([...url].length > REPLY_LINK_MAX_LENGTH) throw new Error('Keep the link to 150 characters or fewer.');
  if (url && !safeWebUrl(url)) throw new Error('Enter a valid HTTP or HTTPS link.');
  const submittedMessage = message && url ? `${message}\n${url}` : message || url;
  const signature = JSON.stringify([logId, parentId || null, submittedMessage]);
  if (!requests[signature]) requests[signature] = createId();
  return { message: submittedMessage, parent_reply: parentId || null, client_request_id: requests[signature] };
}
module.exports = { REPLY_MAX_LENGTH, REPLY_LINK_MAX_LENGTH, STATUS_TRANSITIONS, viewerScope, capabilities, canReplyTo, safeWebUrl, nextPage, uniqueRows, prepareReply };
