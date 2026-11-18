# Onboarding launch and replay behavior

Android startup keeps the existing native heartbeat splash visible while authentication and the local onboarding preference load. A missing completion flag opens the welcome page. Finishing either role tour, skipping a selected tour, or choosing **I already have an account** saves completion before continuing to login (or the existing authenticated role stack).

Later launches go directly from the same splash to login when signed out, or to the existing Student/Staff destination when signed in. The existing first-login profile requirement remains in place. Closing the app before completing or skipping leaves onboarding available on the next launch.

The installation-wide key `vista.onboarding.completed.v1` is separate from credentials. Logout and account changes do not clear it. It uses the already-installed Expo SecureStore; the current Android manifest and SecureStore library resources exclude that store from both cloud backup and device transfer. Android uninstall/clear-storage removes it, so a fresh installation shows onboarding again. No native configuration changes or additional dependencies are needed.

Settings > Help & support > **View app tour** reopens the bundled tour within the authenticated stack, initially selecting the user's role. Users can explore either role. **Back to Settings**, **Skip**, **Done**, or native back navigation return through that stack without signing out or resetting completion. Tour artwork remains bundled and works offline.

If preference access fails, sign-in remains available. A failed completion write only dismisses the tour for the current mount; a later cold launch can show it again. No authentication state is inferred from this preference. Web uses localStorage; iOS uses Keychain-backed SecureStore, which can survive uninstall/reinstall, so the Android reinstall guarantee does not extend to iOS.

## Verification

- `node --test tests/onboarding.test.cjs tests/settings-layout.test.cjs tests/splash-heartbeat.test.cjs`
- `npm test`, `npm run lint`, `npm run validate:project`, `npm run validate:expo`
- `npm run bundle:android:ci` checks JavaScript export without building an APK.
- Device checks: complete/skip then force-stop and reopen; sign out and reopen; replay each role from Settings; interrupt an unfinished tour; verify uninstall/reinstall in an isolated test installation. Do not uninstall a developer's working app to perform this check without authorization. Automated storage reset tests model reinstall but cannot prove physical Android backup/restore behavior.
