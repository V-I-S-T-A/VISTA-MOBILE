import useBottomNavScroll from '../../hooks/useBottomNavScroll';
import { useBottomNavClearance } from '../../theme/layout';
import { View, RefreshControl } from "react-native";
import { useStaffLayout } from "../../theme/layout";
import StaffBottomNav from "../../components/staff/StaffBottomNav";
import StaffReviewHeader from "./reviewPanel/StaffReviewHeader";
import GDriveSyncTop from "./gdriveSync/GDriveSyncTop";
import GDriveSyncFeatures from "./gdriveSync/GDriveSyncFeatures";
import GDriveSyncLoginCard from "./gdriveSync/GDriveSyncLoginCard";
import { openDocumentEntryWithAttachment } from "../../utils/openDocumentEntryWithAttachment";
import { useScreenRefresh } from "../../hooks/useScreenRefresh";
import { PullRefreshKeyboardAwareScrollView as KeyboardAwareScrollView } from '../../components/common/PullRefresh';

export default function GDriveSync({ navigation }) {
  const navScroll = useBottomNavScroll(navigation);
  const footerClearance = useBottomNavClearance();
  const screenLayout = useStaffLayout();
  const { refreshing, onRefresh } = useScreenRefresh([["drive"]]);

  return (
    <View className="flex-1 bg-[#F3F3F3]">
      <View
        className="flex-1 bg-[#F3F3F3]"
        style={screenLayout.body}
      >
        <KeyboardAwareScrollView {...navScroll.scrollProps}
          scrollHeader={<View className="pt-2"><StaffReviewHeader /></View>}
          alwaysBounceVertical overScrollMode="always"
          bottomOffset={footerClearance}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: footerClearance }}
          showsVerticalScrollIndicator={false}
        >
          <GDriveSyncTop />
          <GDriveSyncFeatures />
          <GDriveSyncLoginCard />
        </KeyboardAwareScrollView>
      </View>
      <StaffBottomNav scrollBehavior={navScroll}
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
