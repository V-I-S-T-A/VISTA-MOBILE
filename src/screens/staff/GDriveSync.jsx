import { View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StaffBottomNav from "../../components/staff/StaffBottomNav";
import StaffReviewHeader from "./reviewPanel/StaffReviewHeader";
import GDriveSyncTop from "./gdriveSync/GDriveSyncTop";
import GDriveSyncFeatures from "./gdriveSync/GDriveSyncFeatures";
import GDriveSyncLoginCard from "./gdriveSync/GDriveSyncLoginCard";

export default function GDriveSync({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#F3F3F3]" style={{ paddingTop: insets.top }}>
      <ScrollView 
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <StaffReviewHeader />
        <GDriveSyncTop />
        <GDriveSyncFeatures />
        <GDriveSyncLoginCard />
      </ScrollView>

      <StaffBottomNav
        activeTab="cloud"
        onHomePress={() => navigation?.navigate("StaffHome")}
        onProfilePress={() => navigation?.navigate("StaffDocumentEntry")}
        onReportsPress={() => navigation?.navigate("StaffReviewPanel")}
        onCloudPress={() => navigation?.navigate("GDriveSync")}
      />
    </View>
  );
}
