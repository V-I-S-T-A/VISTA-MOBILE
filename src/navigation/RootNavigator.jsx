import { View } from "react-native";
import * as NativeSplash from "expo-splash-screen";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constants/roles";
import SplashScreen from "../screens/SplashScreen";
import AuthNavigator from "./AuthNavigator";
import StudentNavigator from "./StudentNavigator";
import StaffNavigator from "./StaffNavigator";
import OfflineBanner from '../components/common/OfflineBanner';
import { compact, nav, space } from '../theme/tokens';
import useOnboarding from '../hooks/useOnboarding';

export default function RootNavigator() {
  const { user, role, isRestoring, restoreError, retryRestore } = useAuth();
  const onboarding = useOnboarding();
  // Android animates its existing native splash at handoff. Do not mount a
  // second React splash between the OS launch screen and onboarding.
  if (isRestoring) return null;
  if (!restoreError && !onboarding.ready) return null;
  let screen;
  if (restoreError) {
    screen = <SplashScreen error={restoreError.message} onRetry={retryRestore} />;
  } else if (!onboarding.completed || !user) {
    screen = <AuthNavigator onboarding={onboarding} authenticated={Boolean(user)} />;
  } else if (role === ROLES.STAFF || role === ROLES.ADMIN) {
    screen = <StaffNavigator />;
  } else {
    screen = <StudentNavigator />;
  }

  // Hide only once real content (including the recoverable error state) lays out.
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} onLayout={() => { NativeSplash.hideAsync().catch(() => {}); }}>
      <View style={{ flex: 1 }}>{screen}</View>
      {user && onboarding.completed && !restoreError ? <OfflineBanner bottomOffset={compact.navHeight + nav.actionLift + space.lg} /> : null}
    </View>
  );
}
