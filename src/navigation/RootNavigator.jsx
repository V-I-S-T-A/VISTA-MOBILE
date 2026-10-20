import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constants/roles";
import SplashScreen from "../screens/SplashScreen";
import AuthNavigator from "./AuthNavigator";
import StudentNavigator from "./StudentNavigator";
import StaffNavigator from "./StaffNavigator";

export default function RootNavigator() {
  const { user, role, isRestoring, restoreError, retryRestore } = useAuth();

  if (isRestoring) return <SplashScreen />;
  if (restoreError) {
    return <SplashScreen error={restoreError.message} onRetry={retryRestore} />;
  }
  if (!user) return <AuthNavigator />;

  if (role === ROLES.STAFF || role === ROLES.ADMIN) {
    return <StaffNavigator />;
  }

  return <StudentNavigator />;
}