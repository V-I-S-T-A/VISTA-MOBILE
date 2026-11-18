# Maintained picomatch source backport

GHSA-fc5q-39xc-vjpf / CVE-2026-112366 reports ReDoS in repeated single-branch wildcard extglobs. As reviewed on 2026-11-18, the official latest release is 4.0.7 and the advisory lists no fixed release. VISTA's lockfile installs 2.3.2 and 4.0.5; both remain on the same names, versions, upstream tarballs and dependency graph. No npm aliases or major framework upgrades are used.

## Provenance and behavior

- 2.3.2 upstream revision: `81cba8d4b767cab3cb29d26eb4f691eed75b73b2`.
- 4.0.5 upstream revision: `4f41a8edade7a5ab19832f7b40ecce46b288767f`.
- Collapse/capture safeguard adapted from [upstream PR 246](https://github.com/micromatch/picomatch/pull/246), commit `f03bec2c02e46f063fbfdc161aae1d0f854b2565`. This proposal is not an upstream release. VISTA also adds a conservative fallback for unquoted ordinary wildcard stars in other single-branch repetitions, including `+(*[ab])` and `+(*?a)`, which the proposal alone did not protect.
- Both JSON manifests contain exact before/after source SHA-256 values, original npm tarball integrity, and exact replacements. The pristine source hashes were compared with the referenced upstream source snapshots. Original MIT licensing is retained in LICENSE.

The backport changes only `lib/parse.js`. A simple repeated literal/star branch collapses to a single branch (`+(*a)` becomes `*a`; `*(*a)` becomes optional `*a`), removing ambiguous outer repetition. Capture mode and unsupported complex wildcard branches use picomatch's existing literal fallback. Escaped/quoted stars, ordinary glob APIs, and the existing 4.x character-class safeguards are retained. Explicit `maxExtglobRecursion: false` still opts out of the library's safeguard; VISTA's production configuration does not set that option. This patch does not certify arbitrary user-supplied regex/glob syntax as safe.

## Installation and security gate

`scripts/apply-native-patches.js` invokes `scripts/patch-picomatch.cjs` during the existing postinstall. It checks every locked copy, the installed name/version, tarball integrity and exact source bytes before writing. Reapplication is idempotent. Missing manifests, different versions/integrity, changed upstream source or tampered installed patches fail explicitly.

The security workflow runs the real `npm ci`, then `npm run audit:ci`. The gate re-verifies every installed patch and runs npm's original lockfile audit at the high threshold. It prints the unmodified npm JSON. Only the exact advisory URL, package and range are classified as source-remediated, including inherited meta-findings, after source verification. Every other high/critical advisory, changed affected range, malformed report, unresolved advisory chain or service failure still fails the job. Moderate findings remain reported. `npm run audit:versions` deliberately retains npm's original version-only failure while the published versions remain flagged; the application does not claim a clean upstream version audit.

Security regressions reproduce the vulnerable original in isolated child processes, require the patch to complete adversarial cases within a deadline, compare normal matches/capture APIs, and exercise negative controls for patch removal, source tampering and unrelated high/critical findings. No tests or security thresholds are disabled. The original proposal was extended because additional probes still stalled before the fallback was added.

## Maintenance and retirement

Do not change hashes or the recognized advisory just to make CI green. Any patch/version change needs source review, the security regressions, the full VISTA suite, lint/static/Expo checks, a JavaScript export and clean postinstall verification. A missing/new version intentionally fails until reviewed. When official fixed releases compatible with both families are available, update the lockfile, validate them, and remove the backport plus the source-remediation classification together. Future high/critical advisories do not inherit this recognition.

Local compatibility evidence: all 1,977 4.x upstream assertions passed; the 2.x suite had 1,970/1,972 pass on Windows both before and after the change (the same two pre-existing POSIX-regex string expectations). No upstream test was skipped or altered. Installed consumer behavior and all VISTA tests are validated separately. GitHub-hosted Linux execution and native build verification remain separate checks.

References: [GitHub advisory](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), [upstream 2.x proposal](https://github.com/micromatch/picomatch/pull/246), [related 4.x proposal](https://github.com/micromatch/picomatch/pull/237).
