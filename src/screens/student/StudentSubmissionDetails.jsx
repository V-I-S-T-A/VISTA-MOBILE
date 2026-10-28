import { Text } from "../../components/common/FontText";
import { ActivityIndicator, ScrollView, TouchableOpacity, View, RefreshControl } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StudentHeader from "../../components/students/StudentHeader";
import StudentBottomNav from "../../components/student/StudentBottomNav";
import ReviewDetailsSubmitter from "../../components/submissions/ReviewDetailsSubmitter";
import SubmissionDetailsRemarks from "../../components/submissions/SubmissionDetailsRemarks";
import SubmissionStatusHistory from "../../components/submissions/SubmissionStatusHistory";
import { useSubmission } from "../../hooks/useSubmissions";
import SubmissionDocuments from "../../components/submissions/SubmissionDocuments";
import SubmissionStatusBadge from "../../components/submissions/SubmissionStatusBadge";
import { PADDING_HORIZONTAL } from "../../constants/spacing";
import BackButton from "../../components/common/BackButton";
import { useScreenRefresh } from "../../hooks/useScreenRefresh";

export default function StudentSubmissionDetails({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const summary = route.params?.submission;
  const { data, isLoading } = useSubmission(summary?.submission_id);
  const submission = data || summary;
  const { refreshing, onRefresh } = useScreenRefresh([["submissions", summary?.submission_id], ["review-logs", summary?.submission_id]]);

  return (
    <View className="flex-1 bg-[#F3F3F3]" style={{ paddingTop: insets.top }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        className="flex-1 pt-4"
        style={{ paddingHorizontal: PADDING_HORIZONTAL }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <StudentHeader />
        <View className="flex-row items-center mb-5">
          <BackButton />
          <Text className="text-vistaNavy font-medium ml-3">Track Details</Text>
        </View>
        {!submission ? (
          <View className="py-10 items-center">
            <Text className="text-gray-500">No submission selected.</Text>
          </View>
        ) : (
          <>
            <Text className="text-2xl font-extrabold text-vistaNavy">
              Track Details
            </Text>
            <Text className="text-vistaNavy text-sm mb-6">
              Reviewing processing status.
            </Text>
            {isLoading ? (
              <View className="py-4">
                <ActivityIndicator />
              </View>
            ) : null}
            <View className="bg-[#245EA9] rounded-3xl p-6 mb-5">
              <Text className="text-white font-extrabold text-[22px] leading-8">
                {submission.org_name ? `${submission.org_name}: ` : ""}
                {submission.title || "Untitled Submission"}
              </Text>
            </View>
            <View className="mb-5">
              <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                Current status
              </Text>
              <SubmissionStatusBadge status={submission.status} />
            </View>
            <View className="bg-white rounded-3xl p-5 mb-6 border border-gray-300 flex-row">
              <Feather name="info" size={20} color="#1E3A68" />
              <Text className="text-gray-600 text-sm leading-6 flex-1 ml-3">
                Track each status update and reviewer remark for this
                submission.
              </Text>
            </View>
            <ReviewDetailsSubmitter
              submission={submission}
              showDocumentType
            />
            <SubmissionDocuments documents={submission.documents || []} />
            <SubmissionStatusHistory submissionId={submission.submission_id} />
            <SubmissionDetailsRemarks
              submissionId={submission.submission_id}
            />
          </>
        )}
      </ScrollView>
      <StudentBottomNav
        activeTab="tracker"
        onHomePress={() => navigation.navigate("StudentHome")}
        onTrackerPress={() => navigation.navigate("StudentTracker")}
      />
    </View>
  );
}
