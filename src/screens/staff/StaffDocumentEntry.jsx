import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StaffBottomNav from "../../components/staff/StaffBottomNav";
import StaffDocumentEntryContent from "./docEntry/StaffDocumentEntryContent";

export default function StaffDocumentEntry({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#F3F3F3]" style={{ paddingTop: insets.top }}>
      <StaffDocumentEntryContent
        onLogPhysicalDocPress={() => navigation.navigate("StaffAnalysisResults")}
      />

      <StaffBottomNav
        activeTab="profile"
        onHomePress={() => navigation.navigate("StaffHome")}
        onProfilePress={() => navigation.navigate("StaffDocumentEntry")}
      />
    </View>
  );
}