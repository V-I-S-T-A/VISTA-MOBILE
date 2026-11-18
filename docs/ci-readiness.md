# CI hardening review — 2026-11-18

The local pipeline passes its checks after minimal hook and build-tool security fixes. GitHub-hosted native compilation, clean installation, caching and remote branch rules have not been executed or verified by this local review.

## Hook findings

| File | Finding and minimal fix |
| --- | --- |
| `src/components/common/BottomNavFrame.jsx:67` | `useIsOverlayOpen()` was inside an import-availability ternary. Call it unconditionally. The exported hook already handles a missing overlay provider. Navbar visibility, keyboard compensation, gestures and positioning calculations were not changed. |
| `src/navigation/PersistentBottomNav.jsx:11` | `useIsFocused()` was conditional. React Navigation supplies this import; call it at the top level. The existing focused-page publication and stale-owner cleanup remain intact. |
| `src/theme/layout.js:8` | `useWindowDimensions()` was conditional. React Native supplies the hook; call it unconditionally, retaining the same inset and clearance calculation. |

These were formal Rules of Hooks violations, although the imported module availability is normally constant, so this review did not establish an observed render-order crash. Three one-line changes remove the unsupported pattern rather than disabling lint. See [React's Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks).

## Security investigation and remediation

| Finding | Dependency path and version before | Compatible remediation |
| --- | --- | --- |
| image-size ICNS parser denial of service | Expo 54 → `@expo/metro-config@54.0.17` → `@expo/metro@54.2.0` → `metro@0.83.3` → `image-size@1.2.1`; React Native's community CLI also reaches Metro. | No patched 1.x version exists. Instead of overriding image-size to its incompatible 2.x API, use upstream Metro **0.83.8** across the coordinated Metro family. This patch removes image-size entirely. `package.json` overrides and the lockfile keep the family aligned. |
| PostCSS source-map file disclosure and related advisories | Expo's Metro config pins `~8.4.32`, which installed **8.4.49**. Tailwind's separate root **8.5.25** was already patched. | Override all existing PostCSS 8.x consumers to **8.5.33**. Verify actual Expo resolution and a CSS transform, rather than assuming an override took effect. |

References: [image-size advisory](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr), [Metro 0.83.8 asset code](https://github.com/react/metro/blob/v0.83.8/packages/metro/src/Assets.js), [PostCSS source-map follow-up](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp).

Expo/React Native SDK versions, direct application dependency specifications and the checked-in Android project are preserved. Metro's upstream patch updates its own internal dependencies; these changes have production-bundle and asset-decoding coverage, but do not substitute for native/device verification. The original PostCSS vulnerability was a Node build-tool risk and image-size was used by the bundler. The generated Android source map contains neither parser module in the device runtime (1,822 source-map entries inspected). This is evidence about this export, not a blanket statement that processing untrusted build assets is safe.

The existing high/critical audit gate is unchanged. It now passes with **zero high/critical findings**. **16 moderate dependency findings** remain in Expo tooling's glob/minimatch dependency paths; they are still printed by npm. No ignore list, `continue-on-error`, forced SDK upgrade, or fake passing audit was added.

## Regression assertion quality

All existing suites remain enabled. Updated assertions check current behavior rather than old child indexes or old styling literals:

- Detail footer tests cover zero and 34dp insets, keyboard-open removal and restoration, while retaining composer/back navigation and role checks.
- Sheet tests require retained draft content, delayed focus restoration after exit, Android Back consumption during exit, release of handlers, interrupted/reopened animation safety and reduced motion.
- Button/avatar tests follow the animated wrapper and recursively flatten styles, checking the fixed touch target, compact inner surface and stable circular geometry.
- Error-state tests render the shared ContentState, invoke its actual Retry action, and check cached content/stale warnings.
- Student-only Add link and staff-only status update tests assert both authorized behavior and absence for the other role.

Six deliberate regressions were injected only into file reads inside isolated worker processes: added footer gap, smaller compact surface, premature focus restoration, removed Retry callback, reversed link-role presentation and a staff status action supplied to a student. All six caused the corresponding tests to fail. Application files were never changed on disk for these probes. These tests protect their asserted behavior; the custom mock harness does not establish physical rendering, live persistence or external delivery.

## Native triggers and stable checks

Both workflows trigger on PRs targeting `main`, pushes to `main`, and manual runs. Their stable job/check names are:

1. `Lint and static validation`
2. `Regression tests`
3. `Expo config and Android JS bundle`
4. `Dependency security audit`
5. `Android debug build`

There are no top-level path filters. The native check always exists and its detector uses complete Git history to compare the PR merge-base/head or the entire push range. It includes package manifests/lockfiles, Expo and autolinking config, all Android source/resources/Gradle/wrapper files, plugins, native branding assets, integration scripts and native-workflow inputs. Manual runs always compile. UI-only changes skip expensive steps with an explicit summary. Missing SHAs or failed Git diffs fail closed. Tests cover the input matrix, range selection, invalid-SHA rejection, manual execution and the skipped result.

The workflow-defined names and skip behavior are verified locally. Actual `main` branch rulesets/required-check configuration have not been read or changed; maintainers must verify the registered contexts on GitHub after the first run. Other GitHub mechanisms such as approval requirements or explicit commit-message CI skips remain platform concerns.

## Permissions and environment

Both workflows have only `contents: read` and disable checkout credential persistence. No secrets, EAS credentials, production API token, Firebase JSON or release signing key are supplied. No privileged `pull_request_target` workflow is used. Native verification uses the existing standard debug build/signing path, checks that Firebase JSON is absent, and leaves the release guard intact. Gradle cache writes are restricted to `main`. No publishing, artifact upload or deployment occurs.

## Local validation results

| Check | Result |
| --- | --- |
| ESLint, including app hook ordering | Passed; zero errors/warnings |
| Full regression suite | **453 passed, zero failed, zero skipped** |
| Deliberate in-memory regression probes | Six of six caught |
| Static source/config/reference/lock/workflow validation | Passed, 203 source/config files |
| Expo configuration and SDK dependency check | Passed with Firebase configuration explicitly absent |
| Production Android JavaScript export | Passed, 1,815 modules and 80 assets |
| Dependency resolution (`npm ls --all`) | Passed, no invalid dependency-tree entries |
| Native patch postinstall | Passed |
| Workflow syntax (`actionlint` 1.7.12) | Passed |
| Non-development dependency security gate | Passed; 16 moderate findings remain |
| Git whitespace check | Passed |

Local tests ran on Windows with Node 26. GitHub uses Ubuntu 24.04 and Node 22 LTS. Clean runner `npm ci`, actual SDK/Gradle compilation and Android lint, runner caches, PR status registration, remote branch protection, and physical-device behavior require GitHub/device verification. No APK was built locally.

All earlier local Git changes remain. No branch switch, reset, repository file deletion, commit, push, merge, production operation or deployment was performed. CI definitions, tests, documentation and fixes are still local and uncommitted.
