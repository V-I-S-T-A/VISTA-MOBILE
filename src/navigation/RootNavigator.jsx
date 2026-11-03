import { View } from "react-native";
import * as NativeSplash from "expo-splash-screen";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constants/roles";
import SplashScreen from "../screens/SplashScreen";
import AuthNavigator from "./AuthNavigator";
import StudentNavigator from "./StudentNavigator";
import StaffNavigator from "./StaffNavigator";

export default function RootNavigator() {
  const { user, role, isRestoring, restoreError, retryRestore } = useAuth();

  if (isRestoring) return null;
  let screen;
  if (restoreError) {
    screen = <SplashScreen error={restoreError.message} onRetry={retryRestore} />;
  } else if (!user) {
    screen = <AuthNavigator />;
  } else if (role === ROLES.STAFF || role === ROLES.ADMIN) {
    screen = <StaffNavigator />;
  } else {
    screen = <StudentNavigator />;
  }

  // Hide only once real content (including the recoverable error state) lays out.
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} onLayout={() => { NativeSplash.hideAsync().catch(() => {}); }}>
      {screen}
    </View>
  );
}
