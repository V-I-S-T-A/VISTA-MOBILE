import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StudentHomeScreen from "../screens/student/StudentHomeScreen";
import StudentTrackerScreen from "../screens/student/StudentTrackerScreen";
import StudentSubmissionDetails from "../screens/student/StudentSubmissionDetails";
import StudentProfile from "../screens/student/StudentProfile";

const Stack = createNativeStackNavigator();

export default function StudentNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentHome" component={StudentHomeScreen} />
      <Stack.Screen name="StudentTracker" component={StudentTrackerScreen} />
      <Stack.Screen
        name="StudentSubmissionDetails"
        component={StudentSubmissionDetails}
      />
      <Stack.Screen name="StudentProfile" component={StudentProfile} />
    </Stack.Navigator>
  );
}
