import { useBottomNavClearance } from '../../theme/layout';
import { View, ScrollView, RefreshControl } from "react-native";
import { useStaffLayout } from "../../theme/layout";
import StaffBottomNav from "../../components/staff/StaffBottomNav";
import StaffReviewHeader from "./reviewPanel/StaffReviewHeader";
import GDriveSyncTop from "./gdriveSync/GDriveSyncTop";
import GDriveSyncFeatures from "./gdriveSync/GDriveSyncFeatures";
import GDriveSyncLoginCard from "./gdriveSync/GDriveSyncLoginCard";
import { openDocumentEntryWithAttachment } from "../../utils/openDocumentEntryWithAttachment";
import { useScreenRefresh } from "../../hooks/useScreenRefresh";

export default function GDriveSync({ navigation }) {
  const footerClearance = useBottomNavClearance();
  const screenLayout = useStaffLayout();
  const { refreshing, onRefresh } = useScreenRefresh([["drive"]]);

  return (
    <View className="flex-1 bg-[#F3F3F3]">
      <View
        className="flex-1 bg-[#F3F3F3]"
        style={screenLayout.body}
      >
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          className="flex-1 pt-2"
          contentContainerStyle={{ paddingBottom: footerClearance }}
          showsVerticalScrollIndicator={false}
        >
          <StaffReviewHeader />
          <GDriveSyncTop />
          <GDriveSyncFeatures />
          <GDriveSyncLoginCard />
        </ScrollView>
      </View>
      <StaffBottomNav
        activeTab="cloud"
        onScanPress={() => openDocumentEntryWithAttachment(navigation)}
        onHomePress={() => navigation?.navigate("StaffHome")}
        onProfilePress={() => navigation?.navigate("StaffDocumentEntry")}
        onReportsPress={() => navigation?.navigate("StaffReviewPanel")}
        onCloudPress={() => navigation?.navigate("GDriveSync")}
      />
    </View>
  );
}
