import { View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StaffBottomNav from "../../components/staff/StaffBottomNav";
import StaffReviewHeader from "./reviewPanel/StaffReviewHeader";
import ReviewDetailsTopSection from "./reviewPanel/reviewPanelDetails/ReviewDetailsTopSection";
import ReviewDetailsTitleCard from "./reviewPanel/reviewPanelDetails/ReviewDetailsTitleCard";
import ReviewDetailsSubmitter from "./reviewPanel/reviewPanelDetails/ReviewDetailsSubmitter";
import ReviewDetailsActionCard from "./reviewPanel/reviewPanelDetails/ReviewDetailsActionCard";

export default function ReviewPanelDetails({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#F3F3F3]" style={{ paddingTop: insets.top }}>
      <ScrollView 
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <StaffReviewHeader />
        <ReviewDetailsTopSection />
        <ReviewDetailsTitleCard />
        <ReviewDetailsSubmitter />
        <ReviewDetailsActionCard />
      </ScrollView>

      <StaffBottomNav
        activeTab="reports"
        onHomePress={() => navigation?.navigate("StaffHome")}
        onProfilePress={() => navigation?.navigate("StaffDocumentEntry")}
        onReportsPress={() => navigation?.navigate("StaffReviewPanel")}
        onCloudPress={() => navigation?.navigate("GDriveSync")}
      />
    </View>
  );
}
