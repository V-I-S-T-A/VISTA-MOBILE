import { View } from "react-native";
import { useStaffLayout } from "../../theme/layout";
import StaffBottomNav from "../../components/staff/StaffBottomNav";
import StaffDocumentEntryContent from "./docEntry/StaffDocumentEntryContent";
import { openDocumentEntryWithAttachment } from "../../utils/openDocumentEntryWithAttachment";

export default function StaffDocumentEntry({ navigation, route }) {
  const screenLayout = useStaffLayout();

  return (
    <View className="flex-1 bg-[#F3F3F3]">
      <View
        className="flex-1 bg-[#F3F3F3]"
        style={screenLayout.body}
      >
        <StaffDocumentEntryContent
          navigation={navigation}
          initialAttachment={route?.params?.attachment}
          onLogPhysicalDocPress={() => navigation.navigate("StaffReviewPanel")}
        />
      </View>
      <StaffBottomNav
        activeTab="profile"
        onScanPress={() => openDocumentEntryWithAttachment(navigation)}
        onHomePress={() => navigation.navigate("StaffHome")}
        onProfilePress={() => navigation.navigate("StaffDocumentEntry")}
        onReportsPress={() => navigation.navigate("StaffReviewPanel")}
        onCloudPress={() => navigation.navigate("GDriveSync")}
      />
    </View>
  );
}
