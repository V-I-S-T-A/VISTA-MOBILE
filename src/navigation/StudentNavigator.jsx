import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StudentHomeScreen from "../screens/student/StudentHomeScreen";
import StudentTrackerScreen from "../screens/student/StudentTrackerScreen";
import StudentSubmissionDetails from "../screens/student/StudentSubmissionDetails";
import StudentProfile from "../screens/student/StudentProfile";
import StudentNotificationsScreen from "../screens/student/StudentNotificationsScreen";
import SettingsScreen from "../screens/shared/SettingsScreen";
import UserGuideScreen from "../screens/shared/UserGuideScreen";
import LegalDocumentScreen from "../screens/shared/LegalDocumentScreen";
import NotificationPreferencesScreen from "../screens/shared/NotificationPreferencesScreen";
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

export default function StudentNavigator() {
  const { user } = useAuth();
  return (
    <Stack.Navigator initialRouteName={user?.is_first_login ? 'StudentProfile' : 'StudentHome'} screenOptions={{ headerShown: false, navigationBarHidden: true, animation: "none", contentStyle: { backgroundColor: "#F3F3F3" } }}>
      <Stack.Screen name="StudentHome" component={StudentHomeScreen} />
      <Stack.Screen name="StudentTracker" component={StudentTrackerScreen} />
      <Stack.Screen
        name="StudentSubmissionDetails"
        component={StudentSubmissionDetails}
      />
      <Stack.Screen name="StudentProfile" component={StudentProfile} />
      <Stack.Screen name="StudentNotifications" component={StudentNotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="StudentSettings" component={SettingsScreen} />
      <Stack.Screen name="UserGuide" component={UserGuideScreen} />
      <Stack.Screen name="LegalDocument" component={LegalDocumentScreen} />
      <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
    </Stack.Navigator>
  );
}
