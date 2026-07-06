import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StaffHomeScreen from "../screens/staff/StaffHomeScreen";

const Stack = createNativeStackNavigator();

export default function StaffNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StaffHome" component={StaffHomeScreen} />
    </Stack.Navigator>
  );
}
