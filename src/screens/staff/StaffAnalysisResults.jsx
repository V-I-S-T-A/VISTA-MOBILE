import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StaffBottomNav from "../../components/staff/StaffBottomNav";
import StaffAnalysisResultsContent from "./analysisResults/StaffAnalysisResultsContent";

export default function StaffAnalysisResults({ navigation }) {
  const insets = useSafeAreaInsets();

  const goToDocumentEntry = () => navigation.navigate("StaffDocumentEntry");

  return (
    <View className="flex-1 bg-[#F3F3F3]" style={{ paddingTop: insets.top }}>
      <StaffAnalysisResultsContent
        onBackPress={goToDocumentEntry}
        onRedoPress={goToDocumentEntry}
      />

      <StaffBottomNav
        activeTab="profile"
        onHomePress={() => navigation.navigate("StaffHome")}
        onProfilePress={() => navigation.navigate("StaffDocumentEntry")}
      />
    </View>
  );
}