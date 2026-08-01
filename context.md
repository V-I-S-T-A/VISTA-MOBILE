# VISTA Mobile — Project Context

Overview

- The VISTA Mobile app is a React Native application for the VISTA platform. It supports both staff and student workflows, with staff features like document entry, OCR-assisted submission, and analysis results.
- The app communicates with the backend API for authentication, organization data, document types, categories, academic years, users, and submissions.

Tech stack

- React Native (Metro bundler)
- Navigation via React Navigation (`src/navigation`)
- Context API for auth/state (`src/context/AuthContext.jsx`)
- Tailwind-style utility classes via `tailwind.config.js` and global CSS (`global.css`)
- Metro/Babel configuration present in `metro.config.js` and `babel.config.js`

Key folders & files

- `App.jsx`: app entrypoint and root component
- `app.json`: Expo/React Native app configuration
- `src/`
  - `assets/`: static images and icons
  - `components/`: reusable UI components, especially `components/staff` for staff-facing screens
  - `config/api.js`: API endpoint definitions and client helpers
  - `constants/roles.js`: role definitions used for navigation and permission logic
  - `context/AuthContext.jsx`: authentication provider and user state management
  - `hooks/`: custom hooks such as `useOrganizations`, `useOrganizationUsers`, `useCategories`, and `useDocumentTypes`
  - `navigation/`: navigation stack definitions and route wiring
  - `screens/`: UI screens, including staff document entry under `screens/staff/docEntry`
  - `services/`: backend service modules for auth and domain data access

Service & API responsibilities

- `src/services/authService.js`: login/logout and token handling
- `src/services/academicYearsService.js`: fetch active academic year data
- `src/services/categoriesService.js`: fetch category options
- `src/services/documentTypesService.js`: fetch document type options
- `src/services/organizationsService.js`: fetch organizations for staff selection
- `src/services/usersService.js`: fetch organization users for the Submitted By field
- `src/services/submissionsService.js`: OCR autofill and submission creation

Primary features / flows

- Authentication with role-aware routing for staff and students
- Staff document entry flow with organization selection, document type, category, academic year, and submitted-by user selection
- OCR-assisted autofill of document entry fields using `submissions/autofill`
- Staff and student dashboards showing relevant submissions and analysis results

State & data

- `AuthContext` manages app-wide auth state and current user info
- Backend data is fetched through service wrappers and cached through custom hooks
- The document entry form is built in `src/screens/staff/docEntry/StaffDocumentEntryContent.jsx`

Styling & layout

- Global styling in `global.css`
- Tailwind-style class utilities defined in `tailwind.config.js`
- UI structure is modular, with feature-specific components in the `src/components` and `src/screens` folders

Environment & local setup

- Copy `.env.example` to `.env` and populate backend URLs / keys
- Install dependencies: `npm install`
- Run Metro: `npm start`
- Run on device/emulator: `npx react-native run-android` / `npx react-native run-ios` (if native toolchain is configured)

Notes for contributors

- Add screen components under `src/screens` and register them in the correct navigator
- Keep API endpoint configuration in `src/config/api.js`
- Put backend integration logic in `src/services` and use hooks to connect it to UI components
- Use `AuthContext` instead of passing auth state through many nested props

Where to look first

- App entry: `App.jsx`
- Auth logic: `src/context/AuthContext.jsx` and `src/services/authService.js`
- Staff document entry: `src/screens/staff/docEntry/StaffDocumentEntryContent.jsx`
- Shared select UX: `src/components/staff/SelectField.jsx`
- Backend-integrated services: `src/services/organizationsService.js`, `src/services/usersService.js`, `src/services/submissionsService.js`

If you want, I can also add a short developer checklist or expand this into a full contributor README.
