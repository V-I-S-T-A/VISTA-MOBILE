import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StudentHomeScreen from "../screens/student/StudentHomeScreen";

const Stack = createNativeStackNavigator();

export default function StudentNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentHome" component={StudentHomeScreen} />
    </Stack.Navigator>
  );
}
