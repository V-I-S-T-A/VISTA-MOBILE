import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constants/roles";
import SplashScreen from "../screens/SplashScreen";
import AuthNavigator from "./AuthNavigator";
import StudentNavigator from "./StudentNavigator";
import StaffNavigator from "./StaffNavigator";

export default function RootNavigator() {
  const { user, role } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) return <SplashScreen />;
  if (!user) return <AuthNavigator />;

  return role === ROLES.STAFF ? <StaffNavigator /> : <StudentNavigator />;
}
