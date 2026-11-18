# Mobile error recovery

VISTA keeps recoverable request failures in their current screen or existing
dialog/sheet. Drafts and file selections remain available for a deliberate retry.
An unexpected React render/lifecycle failure uses a separate recovery view.

## Unexpected rendering errors

`AppErrorBoundary` encloses the app content, including its providers. The fallback
uses bundled artwork, shared colors/radii/dimensions, native text and a scrollable
layout. It does not require authentication, navigation, portals or loaded custom
fonts. Its fade respects the existing reduced-motion preference. Layout releases
an initial native splash so it cannot conceal the recovery action.

**Reopen VISTA** explicitly remounts the failed app view. The module-level query
client and stored credentials are not cleared. Cached conversation drafts survive;
local state belonging to a failed/unmounted component is not guaranteed to survive.
Recovery never automatically resends a submission, reply or status update. The
screen reminds users to check any recent update before sending it again.

A React boundary does not catch native crashes, module-import failures or arbitrary
asynchronous/event-handler exceptions. Existing request-level catch handlers remain
necessary. No crash-reporting service, telemetry dependency or credentials were added.

## File uploads

The two direct Cloudinary upload paths share `uploadAttachment`. Its **120-second**
deadline includes receiving/parsing the response. An AbortController cancels the
transport; a promise race also releases the caller if an older transport ignores
abort. Timers and external abort listeners are removed when the operation settles.
Late results from a cancelled/timed-out upload cannot continue attachment registration.

The creation confirmation overlay offers **Cancel file upload** only after the
submission exists and while the file is transferring. Once transfer finishes,
registration proceeds normally and cancellation disappears. If transfer fails or
is stopped, the created submission remains and the existing attachment-retry action
is used; the user is not offered another creation action for that entry.

The Staff update sheet offers the same action during On Process attachment staging.
Cancelling staging preserves remarks/selections and does not dispatch the status
mutation. Confirming a decision or saving/registering an attachment is not labelled
cancellable. Existing status/Drive journals and fresh-read verification are retained.
Leaving during preparation prevents a late file upload from starting on that view.

Stopping the local transfer does not prove Cloudinary has deleted any bytes it may
already have received. The app does not automatically retry provider uploads or
claim that a timed-out mutation was rolled back.

## API messages

`normalizeApiError` preserves status/code, extracts readable nested validation
messages and exposes bounded `fieldErrors` for callers. Response metadata, HTML
pages and server-exception text are not selected as user-facing validation messages.
Server failures use a generic recovery message. Offline errors, timeouts,
cancellation, permission failures and rate limits remain distinguishable. The
authentication interceptor and request retry policy are unchanged.

## Verification and phone QA

Automated coverage is in `error-recovery.test.cjs` and
`attachment-upload-recovery.test.cjs`; existing offline, session, conversation,
Staff update and navigation regressions remain enabled. Upload tests inject local
transports and deterministic deadlines rather than contact Cloudinary or Railway.
Boundary tests exercise its lifecycle/reset contract and fallback controls, not a
native-renderer crash injection.

On a test account, check a failed form request, a cancelled/stalled file upload,
the subsequent attachment-only retry, Staff staging cancellation, retained drafts,
and Android Back/keyboard positioning. Reopen/refresh the test entry to confirm the
persisted state. Use an isolated development fixture for render-crash injection;
do not deliberately crash an active submission to test the recovery screen. Verify
large system text and reduced motion on the phone separately from mocked tests.
