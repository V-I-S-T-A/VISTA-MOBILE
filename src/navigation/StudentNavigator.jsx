import { withTabBackBoundaries } from './tabBackPolicy.cjs';
import { bottomNavLayout } from './PersistentBottomNav';
import { createPushStackNavigator } from './createPushStackNavigator';
import { Platform } from 'react-native';
import StudentHomeScreen from "../screens/student/StudentHomeScreen";
import StudentTrackerScreen from "../screens/student/StudentTrackerScreen";
import StudentSubmissionDetails from "../screens/student/StudentSubmissionDetails";
import StudentProfile from "../screens/student/StudentProfile";
import StudentNotificationsScreen from "../screens/student/StudentNotificationsScreen";
import SettingsScreen from "../screens/shared/SettingsScreen";
import UserGuideScreen from "../screens/shared/UserGuideScreen";
import AppTourScreen from '../screens/shared/AppTourScreen';
import LegalDocumentScreen from "../screens/shared/LegalDocumentScreen";
import NotificationPreferencesScreen from "../screens/shared/NotificationPreferencesScreen";
import { useAuth } from '../context/AuthContext';
import useReducedMotion from '../hooks/useReducedMotion';
import { colors, motion } from '../theme/tokens';

const Stack = createPushStackNavigator();
// Keep tab state mounted across revisits; detail routes retain distinct keys.
const mainTabId = () => 'main-tab';

export default function StudentNavigator() {
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const pushAnimation = reducedMotion ? 'none' : Platform.OS === 'ios' ? 'simple_push' : 'ios_from_right';
  const detailOptions = { animation: pushAnimation, animationDuration: motion.page };
  return (
    <Stack.Navigator UNSTABLE_router={withTabBackBoundaries} layout={bottomNavLayout} initialRouteName={user?.is_first_login ? 'StudentProfile' : 'StudentHome'} screenOptions={{ headerShown: false, navigationBarHidden: true, animation: pushAnimation, animationDuration: motion.tab, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="StudentHome" component={StudentHomeScreen} getId={mainTabId} options={{ bottomNav: true, gestureEnabled: false }} />
      <Stack.Screen name="StudentTracker" component={StudentTrackerScreen} getId={mainTabId} options={{ bottomNav: true, gestureEnabled: false }} />
      <Stack.Screen
        name="StudentSubmissionDetails"
        component={StudentSubmissionDetails}
        options={{ ...detailOptions, bottomNav: false }}
      />
      <Stack.Screen name="StudentProfile" component={StudentProfile} options={detailOptions} />
      <Stack.Screen name="StudentNotifications" component={StudentNotificationsScreen} getId={mainTabId} options={{ bottomNav: true, gestureEnabled: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={detailOptions} />
      <Stack.Screen name="StudentSettings" component={SettingsScreen} options={detailOptions} />
      <Stack.Screen name="UserGuide" component={UserGuideScreen} options={detailOptions} />
      <Stack.Screen name="AppTour" component={AppTourScreen} options={detailOptions} />
      <Stack.Screen name="LegalDocument" component={LegalDocumentScreen} options={detailOptions} />
      <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} options={detailOptions} />
    </Stack.Navigator>
  );
}
