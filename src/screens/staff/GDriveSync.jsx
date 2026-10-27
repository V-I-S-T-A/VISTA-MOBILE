import { View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StaffBottomNav from "../../components/staff/StaffBottomNav";
import StaffReviewHeader from "./reviewPanel/StaffReviewHeader";
import GDriveSyncTop from "./gdriveSync/GDriveSyncTop";
import GDriveSyncFeatures from "./gdriveSync/GDriveSyncFeatures";
import GDriveSyncLoginCard from "./gdriveSync/GDriveSyncLoginCard";
import { PADDING_HORIZONTAL } from "../../constants/spacing";
import { openDocumentEntryWithAttachment } from "../../utils/openDocumentEntryWithAttachment";

export default function GDriveSync({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#F3F3F3]">
      <View
        className="flex-1 bg-[#F3F3F3]"
        style={{
          paddingTop: insets.top,
          paddingHorizontal: PADDING_HORIZONTAL,
        }}
      >
        <ScrollView
          className="flex-1 pt-4"
          contentContainerStyle={{ paddingBottom: 20 }}
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
