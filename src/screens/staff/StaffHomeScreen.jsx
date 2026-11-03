import { View } from "react-native";
import { useStaffLayout } from "../../theme/layout";
import StaffBottomNav from "../../components/staff/StaffBottomNav";
import StaffHomeContent from "./home/StaffHomeContent";
import { openDocumentEntryWithAttachment } from "../../utils/openDocumentEntryWithAttachment";

export default function StaffHomeScreen({ navigation }) {
  const screenLayout = useStaffLayout();

  return (
    <View className="flex-1 bg-[#F3F3F3]">
      <View
        className="flex-1 bg-[#F3F3F3]"
        style={screenLayout.body}
      >
        <StaffHomeContent />
      </View>
      <StaffBottomNav
        activeTab="home"
        onScanPress={() => openDocumentEntryWithAttachment(navigation)}
        onHomePress={() => navigation.navigate("StaffHome")}
        onProfilePress={() => navigation.navigate("StaffDocumentEntry")}
        onReportsPress={() => navigation.navigate("StaffReviewPanel")}
        onCloudPress={() => navigation.navigate("GDriveSync")}
      />
    </View>
  );
}
