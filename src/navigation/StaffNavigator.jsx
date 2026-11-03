import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StaffHomeScreen from "../screens/staff/StaffHomeScreen";
import StaffDocumentEntry from "../screens/staff/StaffDocumentEntry";
import StaffAnalysisResults from "../screens/staff/StaffAnalysisResults";
import StaffReviewPanel from "../screens/staff/StaffReviewPanel";
import ReviewPanelDetails from "../screens/staff/ReviewPanelDetails";
import GDriveSync from "../screens/staff/GDriveSync";
import StaffSubmissionHistory from "../screens/staff/home/StaffSubmissionHistory";
import StaffProfile from "../screens/staff/StaffProfile";
import StaffSubmissionConfirmation from "../screens/staff/StaffSubmissionConfirmation";
import NotificationsScreen from "../screens/student/StudentNotificationsScreen";
import SettingsScreen from "../screens/shared/SettingsScreen";
import UserGuideScreen from "../screens/shared/UserGuideScreen";
import LegalDocumentScreen from "../screens/shared/LegalDocumentScreen";
import NotificationPreferencesScreen from "../screens/shared/NotificationPreferencesScreen";
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

export default function StaffNavigator() {
  const { user } = useAuth();
  return (
    <Stack.Navigator initialRouteName={user?.is_first_login ? 'StaffProfile' : 'StaffHome'} screenOptions={{ headerShown: false, navigationBarHidden: true, animation: "none", contentStyle: { backgroundColor: "#F3F3F3" } }}>
      <Stack.Screen name="StaffHome" component={StaffHomeScreen} />
      <Stack.Screen
        name="StaffDocumentEntry"
        component={StaffDocumentEntry}
      />
      <Stack.Screen name="StaffSubmissionConfirmation" component={StaffSubmissionConfirmation} />
      <Stack.Screen
        name="StaffAnalysisResults"
        component={StaffAnalysisResults}
      />
      <Stack.Screen
        name="StaffReviewPanel"
        component={StaffReviewPanel}
      />
      <Stack.Screen
        name="ReviewPanelDetails"
        component={ReviewPanelDetails}
      />
      <Stack.Screen
        name="GDriveSync"
        component={GDriveSync}
      />
      <Stack.Screen
        name="StaffSubmissionHistory"
        component={StaffSubmissionHistory}
      />
      <Stack.Screen
        name="StaffProfile"
        component={StaffProfile}
      />
      <Stack.Screen name="StaffNotifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="StaffSettings" component={SettingsScreen} />
      <Stack.Screen name="UserGuide" component={UserGuideScreen} />
      <Stack.Screen name="LegalDocument" component={LegalDocumentScreen} />
      <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
    </Stack.Navigator>
  );
}
