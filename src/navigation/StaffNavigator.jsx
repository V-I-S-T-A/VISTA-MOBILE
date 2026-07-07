import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StaffHomeScreen from "../screens/staff/StaffHomeScreen";
import StaffDocumentEntry from "../screens/staff/StaffDocumentEntry";
import StaffAnalysisResults from "../screens/staff/StaffAnalysisResults";

const Stack = createNativeStackNavigator();

export default function StaffNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StaffHome" component={StaffHomeScreen} />
      <Stack.Screen
        name="StaffDocumentEntry"
        component={StaffDocumentEntry}
      />
      <Stack.Screen
        name="StaffAnalysisResults"
        component={StaffAnalysisResults}
      />
    </Stack.Navigator>
  );
}