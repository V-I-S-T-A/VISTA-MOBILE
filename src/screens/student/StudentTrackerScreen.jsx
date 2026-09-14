import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StudentHeader from "../../components/students/StudentHeader";
import StudentBottomNav from "../../components/student/StudentBottomNav";
import SubmissionListCard from "../../components/submissions/SubmissionListCard";
import SubmissionPagination from "../../components/submissions/SubmissionPagination";
import { useSubmissions } from "../../hooks/useSubmissions";

export default function StudentTrackerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useSubmissions({ page });
  const submissions = data?.results ?? [];

  return (
    <View className="flex-1 bg-[#F3F3F3]" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <StudentHeader />
        <Text className="text-2xl font-extrabold text-vistaNavy">
          Review Tracker
        </Text>
        <Text className="text-vistaNavy text-sm mb-7">
          Reviewing processing status.
        </Text>
        {isLoading ? (
          <View className="py-10">
            <ActivityIndicator />
          </View>
        ) : isError ? (
          <View className="py-10 items-center">
            <Text className="text-gray-500 mb-3">
              Could not load submissions.
            </Text>
            <TouchableOpacity
              onPress={refetch}
              className="bg-vistaNavy rounded-full px-4 py-2"
            >
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : submissions.length === 0 ? (
          <Text className="text-gray-500 text-center py-10">
            No submissions to track yet.
          </Text>
        ) : (
          <>
            {submissions.map((submission) => (
              <SubmissionListCard
                key={submission.submission_id}
                submission={submission}
                onPress={() =>
                  navigation.navigate("StudentSubmissionDetails", {
                    submission,
                  })
                }
              />
            ))}
            <SubmissionPagination
              currentPage={page}
              totalPages={data?.total_pages ?? 1}
              onPageChange={setPage}
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
