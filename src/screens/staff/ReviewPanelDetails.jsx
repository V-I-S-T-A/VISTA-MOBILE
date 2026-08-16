import { View, ScrollView, ActivityIndicator, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StaffBottomNav from "../../components/staff/StaffBottomNav";
import StaffReviewHeader from "./reviewPanel/StaffReviewHeader";
import ReviewDetailsTopSection from "./reviewPanel/reviewPanelDetails/ReviewDetailsTopSection";
import ReviewDetailsTitleCard from "./reviewPanel/reviewPanelDetails/ReviewDetailsTitleCard";
import ReviewDetailsSubmitter from "./reviewPanel/reviewPanelDetails/ReviewDetailsSubmitter";
import ReviewDetailsActionCard from "./reviewPanel/reviewPanelDetails/ReviewDetailsActionCard";
import DriveArchiveCard from "../../components/staff/DriveArchiveCard";
import { useSubmission } from "../../hooks/useSubmissions";

export default function ReviewPanelDetails({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const passedSubmission = route?.params?.submission;

  // Re-fetch the full detail (list items are the summary serializer and
  // don't carry every field the Drive card / action card need).
  const { data: submission, isLoading } = useSubmission(
    passedSubmission?.submission_id,
  );
  const current = submission || passedSubmission;

  return (
    <View className="flex-1 bg-[#F3F3F3]" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <StaffReviewHeader />
        <ReviewDetailsTopSection />

        {!current ? (
          <View className="py-10 items-center">
            <Text className="text-gray-500">No submission selected.</Text>
          </View>
        ) : (
          <>
            <ReviewDetailsTitleCard submission={current} />
            <ReviewDetailsSubmitter submission={current} />
            <DriveArchiveCard submission={current} />
            <ReviewDetailsActionCard
              submission={current}
              isLoading={isLoading}
            />
          </>
        )}
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
