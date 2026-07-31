import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StaffHomeScreen from "../screens/staff/StaffHomeScreen";
import StaffDocumentEntry from "../screens/staff/StaffDocumentEntry";
import StaffAnalysisResults from "../screens/staff/StaffAnalysisResults";
import StaffReviewPanel from "../screens/staff/StaffReviewPanel";
import ReviewPanelDetails from "../screens/staff/ReviewPanelDetails";
import GDriveSync from "../screens/staff/GDriveSync";

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
    </Stack.Navigator>
  );
}