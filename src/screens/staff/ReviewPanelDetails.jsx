import { View, ScrollView, ActivityIndicator, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StaffBottomNav from "../../components/staff/StaffBottomNav";
import StaffReviewHeader from "./reviewPanel/StaffReviewHeader";
import ReviewDetailsTopSection from "./reviewPanel/reviewPanelDetails/ReviewDetailsTopSection";
import ReviewDetailsTitleCard from "./reviewPanel/reviewPanelDetails/ReviewDetailsTitleCard";
import ReviewDetailsSubmitter from "../../components/submissions/ReviewDetailsSubmitter";
import ReviewDetailsActionCard from "./reviewPanel/reviewPanelDetails/ReviewDetailsActionCard";
import ReviewDetailsLogs from "./reviewPanel/reviewPanelDetails/ReviewDetailsLogs";
import ReviewDetailsRemarks from "./reviewPanel/reviewPanelDetails/ReviewDetailsRemarks";
import DriveArchiveCard from "../../components/staff/DriveArchiveCard";
import { useSubmission } from "../../hooks/useSubmissions";
import SubmissionDocuments from "../../components/submissions/SubmissionDocuments";
import { Feather } from "@expo/vector-icons";

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
            <View className="bg-white rounded-3xl p-4 mb-5 border border-gray-300 shadow-sm flex-row items-start">
              <Feather name="info" size={20} color="#1E3A68" />
              <View className="ml-3 flex-1">
                <Text className="text-vistaNavy text-sm font-bold mb-1">
                  Physical Submission Notice
                </Text>
                <Text className="text-gray-600 text-sm leading-6">
                  This record tracks paper files submitted at the OSA office.
                  Digital copies are not stored on this system.
                </Text>
              </View>
            </View>
            <ReviewDetailsTitleCard submission={current} />
            <SubmissionDocuments documents={current.documents || []} />
            <ReviewDetailsSubmitter submission={current} />
            <ReviewDetailsActionCard
              submission={current}
              isLoading={isLoading}
            />
            <DriveArchiveCard submission={current} />
            <ReviewDetailsLogs submissionId={current.submission_id} />
            <ReviewDetailsRemarks submissionId={current.submission_id} />
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
