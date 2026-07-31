import { View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StaffBottomNav from "../../../components/staff/StaffBottomNav";
import StaffReviewHeader from "../reviewPanel/StaffReviewHeader";
import SubmissionHistoryTop from "./submissionHistory/SubmissionHistoryTop";
import SubmissionHistorySearch from "./submissionHistory/SubmissionHistorySearch";
import SubmissionHistoryList from "./submissionHistory/SubmissionHistoryList";
import SubmissionHistoryPagination from "./submissionHistory/SubmissionHistoryPagination";

export default function StaffSubmissionHistory({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#F3F3F3]" style={{ paddingTop: insets.top }}>
      <ScrollView 
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <StaffReviewHeader />
        <SubmissionHistoryTop />
        <SubmissionHistorySearch />
        <SubmissionHistoryList />
        <SubmissionHistoryPagination />
      </ScrollView>

      <StaffBottomNav
        activeTab="home"
        onHomePress={() => navigation?.navigate("StaffHome")}
        onProfilePress={() => navigation?.navigate("StaffDocumentEntry")}
        onReportsPress={() => navigation?.navigate("StaffReviewPanel")}
        onCloudPress={() => navigation?.navigate("GDriveSync")}
      />
    </View>
  );
}
