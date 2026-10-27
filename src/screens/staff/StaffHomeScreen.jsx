import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StaffBottomNav from "../../components/staff/StaffBottomNav";
import StaffHomeContent from "./home/StaffHomeContent";
import {PADDING_HORIZONTAL} from "../../constants/spacing";
import { openDocumentEntryWithAttachment } from "../../utils/openDocumentEntryWithAttachment";

export default function StaffHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#F3F3F3]">
      <View
        className="flex-1 bg-[#F3F3F3]"
        style={{ paddingTop: insets.top, paddingHorizontal: PADDING_HORIZONTAL }}
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
