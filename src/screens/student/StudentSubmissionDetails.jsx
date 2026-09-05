import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StudentHeader from "../../components/students/StudentHeader";
import StudentBottomNav from "../../components/student/StudentBottomNav";
import SubmissionDetailsCard from "../../components/submissions/SubmissionDetailsCard";
import SubmissionStatusHistory from "../../components/submissions/SubmissionStatusHistory";
import { useSubmission } from "../../hooks/useSubmissions";

export default function StudentSubmissionDetails({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const summary = route.params?.submission;
  const { data, isLoading } = useSubmission(summary?.submission_id);
  const submission = data || summary;

  return (
    <View className="flex-1 bg-[#F3F3F3]" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <StudentHeader />
        <View className="flex-row items-center mb-5">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-[#FFE35B] rounded-full px-3 py-1 mr-4"
          >
            <Text className="text-vistaNavy font-semibold">‹ Back</Text>
          </TouchableOpacity>
          <Text className="text-vistaNavy font-medium">Track Details</Text>
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
            <View className="bg-white rounded-3xl p-5 mb-6 border border-gray-300 flex-row">
              <Feather name="info" size={20} color="#1E3A68" />
              <Text className="text-gray-600 text-sm leading-6 flex-1 ml-3">
                Track each status update and reviewer remark for this
                submission.
              </Text>
            </View>
            <SubmissionDetailsCard submission={submission} />
            <SubmissionStatusHistory submissionId={submission.submission_id} />
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
