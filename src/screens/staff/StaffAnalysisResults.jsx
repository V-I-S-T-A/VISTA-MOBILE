import useBottomNavScroll from '../../hooks/useBottomNavScroll';
import { View } from "react-native";
import { useStaffLayout } from "../../theme/layout";
import StaffBottomNav from "../../components/staff/StaffBottomNav";
import StaffAnalysisResultsContent from "./analysisResults/StaffAnalysisResultsContent";
import { openDocumentEntryWithAttachment } from "../../utils/openDocumentEntryWithAttachment";

export default function StaffAnalysisResults({ navigation }) {
  const navScroll = useBottomNavScroll(navigation);
  const screenLayout = useStaffLayout();

  const goToDocumentEntry = () => navigation.navigate("StaffDocumentEntry");

  return (
    <View className="flex-1 bg-[#F3F3F3]" style={screenLayout.top}>
      <View className="flex-1" style={screenLayout.horizontal}>
      <StaffAnalysisResultsContent navScroll={navScroll}
        onBackPress={goToDocumentEntry}
        onRedoPress={goToDocumentEntry}
      />

      </View>
      <StaffBottomNav scrollBehavior={navScroll}
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
