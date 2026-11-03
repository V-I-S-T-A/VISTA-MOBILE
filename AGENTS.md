# VISTA Android mobile instructions

Scope: this React Native/Expo Android repository and all its subdirectories.
Before work, read `../AGENTS.md` when present for the full permanent VISTA policy
and regression matrix. Codex project discovery may stop at this Git root; this
entry point supplies local discovery. It supplements, not replaces or weakens,
the parent policy. The safeguards below also apply in standalone checkouts.

## Required safeguards

- Audit applicable instructions, specifications, implementation, dependencies,
  tests and staged/unstaged/untracked Git state. Local uncommitted code is the
  baseline. Preserve unrelated changes and all approved functionality. Limit work
  to the request; no unsolicited features, refactors, redesigns or reorganization.
  Verify consumers before changing contracts/validation/roles, and obtain approval
  for substantial necessary out-of-scope work.
- New submissions must persist **On Process** through the existing backend canonical
  status/mapping. Do not simulate success or status in local state without a saved
  entry. Initial status assignment must not generate a duplicate transition event.
- Creation and genuine supported status changes require **web/Android system
  notifications, native Android push for eligible devices, and email/Gmail** to
  established recipients. Preserve templates, navigation, history and read state.
  Push must not replace email or system alerts. No private-data broadcasts.
- Preserve automatic Expo/FCM device registration, permissions, token lifecycle,
  authentication and account isolation on logout/switching. No manual registration.
  Denied permission or missing devices must not fail creation. Deployed delivery
  must not depend on an open app, a frontend route or a developer's laptop.
- Persist and freshly retrieve statuses and remarks, including same-status notes;
  preserve history and avoid duplicate records/events on retries/concurrent work.
  Remarks-only changes follow approved notification rules, not extra status alerts.
  Dispatch after commit, never on rollback; preserve independent channel handling
  and appropriate existing retries. Queueing is not proof of delivery.
- Preserve student/staff workflows, roles, navigation, responsive UI/loading/errors,
  attachments and staff-only file visibility, returned/rejected behavior, archiving,
  audit trails, backend contracts and background integrations.
- Use proportionate behavior/regression tests, including persistence after fresh
  reads/reopening, authorization, account isolation, duplicates and affected flows.
  Maintain creation/all-status-transition/same-status/rollback coverage across the
  relevant system. Use isolated data and mocked delivery for automated tests.
  Report physical-device/background/release checks separately; a build alone does
  not prove runtime behavior or native delivery.
- Preserve team/Akane environment conventions. No personal paths, phone IPs or
  credentials in shared configuration/Git/logs. Keep development/release separation,
  correct deployed release API, Expo ownership/package ID and Firebase/private keys.
  Reuse architecture; avoid unnecessary dependencies or duplicated systems.
- Without explicit authorization: no commits/pushes/PRs/merges/deployments, production
  migrations/data deletion, Railway setting/service changes, credential rotation,
  destructive infrastructure actions, resets or discarded local work.
- Before completion reread specifications/instructions, inspect changed files and
  final diff, and verify requested/affected behavior. Report goal, implementation
  and files/reasons, preserved/unverified behavior, tests/results, limitations and
  local/Git/deployment status. Never confuse mocks, queueing, provider acceptance,
  actual device receipt and deployed end-to-end success.

## Mobile focus

Check auth lifecycle, SecureStore, API environment selection, notification runtime,
device binding and affected staff/student screens as appropriate. Use existing
global components and design conventions; UI requests do not authorize business-
logic changes. Distinguish Metro/JavaScript reload from native rebuild requirements.
These instructions define protected standards, not current implementation proof.
