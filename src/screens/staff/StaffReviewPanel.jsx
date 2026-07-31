import { View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StaffBottomNav from "../../components/staff/StaffBottomNav";
import StaffReviewHeader from "./reviewPanel/StaffReviewHeader";
import StaffReviewBanner from "./reviewPanel/StaffReviewBanner";
import StaffReviewList from "./reviewPanel/StaffReviewList";
import StaffReviewPagination from "./reviewPanel/StaffReviewPagination";

export default function StaffReviewPanel({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#F3F3F3]" style={{ paddingTop: insets.top }}>
      <ScrollView 
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <StaffReviewHeader />
        <StaffReviewBanner />
        <StaffReviewList />
        <StaffReviewPagination />
      </ScrollView>

      <StaffBottomNav
        activeTab="reports"
        onHomePress={() => navigation?.navigate("StaffHome")}
        onProfilePress={() => navigation?.navigate("StaffDocumentEntry")}
        onReportsPress={() => navigation?.navigate("StaffReviewPanel")}
      />
    </View>
  );
}
