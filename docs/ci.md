# Mobile continuous integration

## What runs

`Mobile CI` runs on every pull request targeting `main`, pushes to `main`, and manual `workflow_dispatch` runs. Fast jobs run independently, so a lint failure does not hide test or bundle results. Superseded runs for the same PR/ref are cancelled.

See the [hardening and readiness review](ci-readiness.md) for the hook/security investigation, assertion-quality evidence and final local validation results.

| Check | What a failure means | Local command |
| --- | --- | --- |
| Lint and static validation | Invalid JS/JSX, undefined identifiers, hook ordering, broken/case-sensitive imports or assets, a mismatched lockfile, or invalid workflow structure | `npm run lint` and `npm run validate:project` |
| Regression tests | An existing student/staff, authentication, cache, notification-controller, attachment, navigation, motion, refresh, or layout regression assertion failed | `npm test` |
| Expo config and Android JS bundle | App configuration/plugin resolution failed, installed packages do not match Expo's expected versions, or Metro cannot build production Android JavaScript/assets | `npm run validate:expo` and `npm run bundle:android:ci` |
| Dependency security audit | The locked non-development dependency tree contains a high/critical advisory, or npm's advisory service is unavailable | `npm run audit:ci` |

The app currently contains JavaScript/JSX, not application TypeScript. ESLint validates the existing language, and the additional static check parses source/config and validates relative references with exact filename case even on Windows. `typescript` being installed does not make this a type-checked project. Add TypeScript lint/type-check configuration when introducing application `.ts`/`.tsx` files.

ESLint uses the core recommended correctness rules plus React hook ordering. Unused variables/imports are not a gate for this legacy JSX codebase; exhaustive dependency/style/formatting rules are not introduced as part of CI. Hook-order checks apply to app code, not the test harness's ordinary calls to mocked hook functions. This does not exclude any tests.

`Android native verification` is a separate workflow and starts on every PR targeting `main`, push to `main`, and manual run. Its stable `Android debug build` check always completes. `scripts/ci/native-changes.cjs` compares the PR from its merge base (or the complete push range) and only enables expensive native steps when Android, Gradle, Expo/autolinking config, dependency/lockfile, native artwork/plugin, integration script or build-workflow inputs change. Manual and initial-main runs always build. UI-only changes record an explicit summary and skip compilation, rather than filtering out the entire check and leaving required checks pending. Failed change detection fails the check instead of skipping verification.

When required, it builds the checked-in Android project using Java 17, the Gradle wrapper, SDK 36 and one ARM64 ABI, then runs Android lint. It does not run Expo prebuild or regenerate/replace the approved native project. Native changes and check names are covered by regression tests.

SDK setup resolves `cmdline-tools/latest/bin/sdkmanager` under the runner's `ANDROID_SDK_ROOT` or `ANDROID_HOME`, and fails clearly when unavailable. The first hosted run showed that the SDK manager is not necessarily on the shell's PATH; this does not require a change to the application's Android project.

The debug APK is only a compile/package verification result, not a distributable release. Debug builds omit production Firebase setup; release validation remains protected by the existing Firebase guard. Actual splash rendering, gestures, keyboard behavior, camera/scanner integration, signing/update continuity and device notification delivery still need device/release checks. No emulator or production service is contacted by these regression tests.

## Contributor setup

Use Node 22 LTS (see `.node-version`) and install the exact dependency graph with `npm ci`. The postinstall native patches run as they do for the app; a broken splash patch must fail rather than silently ship. GitHub uses Ubuntu 24.04, so imports and filenames must match case exactly.

The complete `tests/` directory and helpers must be included in the Git changes with this pipeline. Previously these were local-only. The runner discovers every top-level `*.test.cjs` suite and fails if no tests exist. It propagates failures without skips, quarantine lists or `continue-on-error`. The mocked test harness does not prove live backend persistence or actual notification delivery. Its network preloader rejects real fetch/HTTP requests; tests must inject fixtures rather than call Railway, Google Drive, push or email providers.

Tests and verification helpers remain excluded from EAS packages through `.easignore`; versioning the regression suite for CI does not bundle it into the APK. `dist/ci` bundle outputs and native build/cache outputs are ignored and must stay out of commits. Do not run `npm ci` over a development session if replacing its installed dependencies would disrupt that session.

For an optional full workflow syntax check, run `actionlint .github/workflows/mobile-ci.yml .github/workflows/android-native.yml` with a verified official actionlint installation. The CI static job and regression tests also validate YAML, permissions, pinned actions, triggers, required jobs and test discovery.

## Credentials, permissions and caches

- All workflows use `contents: read`; checkout does not retain credentials. They use ordinary `pull_request`, never privileged `pull_request_target`.
- No repository secrets, Firebase JSON, production API token, EAS token or signing key are needed for PR validation. The native job verifies Firebase JSON is absent and uses the checked-in standard debug signing setup. Do not add a fabricated Firebase file or weaken the release-build guard.
- Actions are pinned to verified full commit hashes. Dependabot proposes weekly action/npm updates; it does not automatically merge them. Review Expo SDK/native package compatibility before accepting dependency changes, especially major upgrades.
- Node's action caches npm downloads keyed by the lockfile; every executable dependency installation still uses `npm ci`. Gradle caches reusable state, with cache writes restricted to `main`. No credentials/configuration cache encryption key is supplied, and no release keys are cached.
- There are no deployments, EAS commands, artifact uploads, package publishing or signing-credential changes.

## Interpreting the first run

Adding a workflow does not make existing defects green. After the hardening review:

- Existing UI assertions match the approved zero-inset footer, coordinated overlay exits/focus restoration, current skeletons/notice and animated button/avatar wrappers. The protected behavior is still asserted and every suite remains enabled. Six isolated in-memory regressions were deliberately introduced during review; the tests caught artificial footer gaps, shrunken button surfaces, premature focus restoration, disconnected Retry actions, reversed link-role permissions and a leaked staff status action. Application files were not mutated on disk during those checks.
- Three module-availability guards around hooks in `src/components/common/BottomNavFrame.jsx`, `src/navigation/PersistentBottomNav.jsx` and `src/theme/layout.js` were replaced with unconditional hook calls. The installed imports are guaranteed, the overlay hook handles a missing provider internally, and their results, navbar/keyboard calculations and focus behavior remain unchanged. Hooks lint is still enabled.
- `image-size@1.2.1` was pulled in by Metro 0.83.3, including Expo's `@expo/metro` wrapper and React Native's community CLI. No patched 1.x package exists. Instead of forcing incompatible image-size 2.x, the coordinated Metro family is overridden to upstream **0.83.8** (same existing minor), which removes image-size. Keep the family aligned; do not override only Metro itself and mix its tightly coupled internals.
- `@expo/metro-config@54.0.17` pinned PostCSS `~8.4.32`, installing vulnerable **8.4.49**. Tailwind's separate 8.5.25 copy was already patched. An override now consistently resolves all existing 8.x consumers to **8.5.33**. This stays within PostCSS major 8; CSS processing and actual Expo module resolution are tested. These overrides do not change the Expo SDK, React Native version, native configuration or role workflows.
- The unchanged `npm run audit:ci` gate passes with zero high/critical findings. **16 moderate dependency findings** remain in Expo tooling's glob/minimatch paths and are still reported. Do not use `npm audit fix --force` or suppress advisories. A production Android source-map inspection found neither postcss nor image-size parser modules in the app runtime; these findings concern dependency/build tooling and are not evidence of an exploitable device runtime. Builds still need trusted inputs.

See [image-size advisory](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr), [Metro 0.83.8 asset implementation](https://github.com/react/metro/blob/v0.83.8/packages/metro/src/Assets.js), and [PostCSS source-map advisory](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp). Tests verify the installed graph has no image-size, Expo resolves the patched PostCSS, and Metro still measures the actual bundled PNG/WebP assets.

Network/advisory-service outages fail visibly; rerun an infrastructure failure rather than masking it. Exact advisory results change over time.

## Enabling and requiring checks on GitHub

Workflows appear and start once the workflow files, helper scripts, configuration, package/lockfile changes and all regression tests are committed and pushed in the PR. `workflow_dispatch` normally appears in Actions once its workflow exists on the default branch. An existing PR can receive checks when these files are added to its head. GitHub may require a maintainer to approve a first-time fork contributor's run.

After the checks have run, maintainers can make the four always-running `Mobile CI` check names above required in the `main` branch ruleset. `Android debug build` is also a stable, always-present check: only its compilation steps are conditional, so a UI-only PR does not wait on a missing native check. The check names are asserted in tests and do not depend on matrix labels. This implementation does not change repository protection settings, and the actual remote ruleset configuration/check registration must be verified on GitHub. Do not add top-level path filters to a workflow that supplies a required check.

Workflow syntax, Expo/static checks and the production JS export can be checked locally. GitHub runner installation, clean `npm ci`, remote caches, SDK/Gradle compilation and the actual displayed PR check names still require a GitHub-hosted run. No native build-tool downloads are necessary on this laptop.

References: [GitHub workflow syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions), [Expo CLI dependency validation](https://docs.expo.dev/more/expo-cli/), [Gradle setup/caching](https://github.com/gradle/actions/blob/main/docs/setup-gradle.md).
