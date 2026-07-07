# V.I.S.T.A. — Expo SDK 54 Project

Role-based (Student / Staff) React Native app using Expo, NativeWind (Tailwind), and React Navigation.

## Stack
- Expo SDK **54.0.2**
- React Native **0.81.4**
- React **19.1.0**
- NativeWind **4.1.23**
- React Navigation (native-stack)

## Setup

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** (make sure your Expo Go app is updated — SDK 54 requires the matching Expo Go build).

## Folder structure

```
vista-app/
├── App.jsx
├── app.json
├── babel.config.js
├── metro.config.js          # required for NativeWind v4
├── tailwind.config.js
├── global.css
├── src/
│   ├── navigation/
│   │   ├── RootNavigator.jsx    # shows splash → routes by role
│   │   ├── AuthNavigator.jsx
│   │   ├── StudentNavigator.jsx
│   │   └── StaffNavigator.jsx
│   ├── screens/
│   │   ├── SplashScreen.jsx
│   │   ├── auth/LoginScreen.jsx
│   │   ├── student/StudentHomeScreen.jsx
│   │   └── staff/StaffHomeScreen.jsx
│   ├── context/AuthContext.jsx
│   ├── constants/roles.js
│   ├── services/            # add API calls here
│   └── assets/              # logo, splash, login illustration
```

## Testing role routing

The login screen has a temporary rule (in `LoginScreen.jsx`) since there's no backend yet:
- Any email containing **"staff"** (e.g. `staff@vista.com`) logs in as **Staff** → Staff Dashboard
- Any other email logs in as **Student** → Student Home

Replace this logic in `handleSignIn()` once you wire up a real auth API in `src/services/`.

## Notes specific to SDK 54

- **Edge-to-edge is forced on Android** (cannot be disabled) — screens use `useSafeAreaInsets()` from `react-native-safe-area-context` to avoid content being hidden behind system bars.
- `newArchEnabled: true` is set in `app.json` (default for SDK 54). Set to `false` if you need the Legacy Architecture — SDK 54 is the last version that supports disabling it.
- If you add `react-native-reanimated`, also install `react-native-worklets` — Reanimated 4.1+ requires it as a peer dependency.

## Next steps
- Wire `handleSignIn` to a real authentication API
- Build out remaining Student screens (grades, schedule)
- Build out remaining Staff screens (attendance, reports)
- Add bottom tab navigation (currently a static bar on the Staff dashboard — swap for `@react-navigation/bottom-tabs` when more staff screens exist)
