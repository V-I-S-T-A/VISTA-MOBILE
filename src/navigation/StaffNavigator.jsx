import { withTabBackBoundaries } from './tabBackPolicy.cjs';
import { bottomNavLayout } from './PersistentBottomNav';
import { createPushStackNavigator } from './createPushStackNavigator';
import { Platform } from 'react-native';
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
import AppTourScreen from '../screens/shared/AppTourScreen';
import LegalDocumentScreen from "../screens/shared/LegalDocumentScreen";
import NotificationPreferencesScreen from "../screens/shared/NotificationPreferencesScreen";
import { useAuth } from '../context/AuthContext';
import useReducedMotion from '../hooks/useReducedMotion';
import { colors, motion } from '../theme/tokens';

const Stack = createPushStackNavigator();
// React Navigation 7 otherwise pushes another copy on every tab revisit.
const mainTabId = () => 'main-tab';

export default function StaffNavigator() {
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const pushAnimation = reducedMotion ? 'none' : Platform.OS === 'ios' ? 'simple_push' : 'ios_from_right';
  const detailOptions = { animation: pushAnimation, animationDuration: motion.page };
  return (
    <Stack.Navigator UNSTABLE_router={withTabBackBoundaries} layout={bottomNavLayout} initialRouteName={user?.is_first_login ? 'StaffProfile' : 'StaffHome'} screenOptions={{ headerShown: false, navigationBarHidden: true, animation: pushAnimation, animationDuration: motion.tab, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="StaffHome" component={StaffHomeScreen} getId={mainTabId} options={{ bottomNav: true, gestureEnabled: false }} />
      <Stack.Screen
        name="StaffDocumentEntry"
        component={StaffDocumentEntry}
        getId={mainTabId}
        options={{ bottomNav: true, gestureEnabled: false }}
      />
      <Stack.Screen name="StaffSubmissionConfirmation" component={StaffSubmissionConfirmation} options={detailOptions} />
      <Stack.Screen
        name="StaffAnalysisResults"
        component={StaffAnalysisResults}
        options={{ ...detailOptions, bottomNav: true }}
      />
      <Stack.Screen
        name="StaffReviewPanel"
        component={StaffReviewPanel}
        getId={mainTabId}
        options={{ bottomNav: true, gestureEnabled: false }}
      />
      <Stack.Screen
        name="ReviewPanelDetails"
        component={ReviewPanelDetails}
        options={{ ...detailOptions, bottomNav: false }}
      />
      <Stack.Screen
        name="GDriveSync"
        component={GDriveSync}
        getId={mainTabId}
        options={{ bottomNav: true, gestureEnabled: false }}
      />
      <Stack.Screen
        name="StaffSubmissionHistory"
        component={StaffSubmissionHistory}
        options={{ ...detailOptions, bottomNav: true }}
      />
      <Stack.Screen
        name="StaffProfile"
        component={StaffProfile}
        options={detailOptions}
      />
      <Stack.Screen name="StaffNotifications" component={NotificationsScreen} options={{ ...detailOptions, bottomNav: user?.role !== 'admin' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={detailOptions} />
      <Stack.Screen name="StaffSettings" component={SettingsScreen} options={detailOptions} />
      <Stack.Screen name="UserGuide" component={UserGuideScreen} options={detailOptions} />
      <Stack.Screen name="AppTour" component={AppTourScreen} options={detailOptions} />
      <Stack.Screen name="LegalDocument" component={LegalDocumentScreen} options={detailOptions} />
      <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} options={detailOptions} />
    </Stack.Navigator>
  );
}
