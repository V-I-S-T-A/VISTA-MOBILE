import { Text } from "../../components/common/FontText";
import { ActivityIndicator, TouchableOpacity, View, ScrollView, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueries } from "@tanstack/react-query";
import StudentHeader from "../../components/students/StudentHeader";
import StudentBottomNav from "../../components/student/StudentBottomNav";
import SubmissionListCard from "../../components/submissions/SubmissionListCard";
import SubmissionDashboardCards from "../../components/submissions/SubmissionDashboardCards";
import { useSubmissions } from "../../hooks/useSubmissions";
import { submissionsService } from "../../services/submissionsService";
import { PADDING_HORIZONTAL } from "../../constants/spacing";
import { useScreenRefresh } from "../../hooks/useScreenRefresh";

function useSubmissionCounts() {
  const results = useQueries({
    queries: [
      {
        queryKey: ["student-submissions", "count", "all"],
        queryFn: () => submissionsService.listSubmissions({ page_size: 1 }),
      },
      {
        queryKey: ["student-submissions", "count", "pending"],
        queryFn: () =>
          submissionsService.listSubmissions({
            page_size: 1,
            status: "pending",
          }),
      },
      {
        queryKey: ["student-submissions", "count", "approved"],
        queryFn: () =>
          submissionsService.listSubmissions({
            page_size: 1,
            status: "approved",
          }),
      },
    ],
  });
  return {
    loading: results.some((result) => result.isLoading),
    total: results[0].data?.count ?? 0,
    pending: results[1].data?.count ?? 0,
    approved: results[2].data?.count ?? 0,
  };
}

export default function StudentHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const counts = useSubmissionCounts();
  const { data, isLoading, isError } = useSubmissions({ page_size: 3 });
  const submissions = data?.results ?? [];
  const { refreshing, onRefresh } = useScreenRefresh([["student-submissions"], ["submissions"]]);

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
        <Text className="text-2xl font-extrabold text-vistaNavy">
          Student Org. Dashboard
        </Text>
        <Text className="text-vistaNavy text-sm mb-5">Welcome back!</Text>

        <SubmissionDashboardCards
          isLoading={counts.loading}
          total={counts.total}
          pending={counts.pending}
          approved={counts.approved}
          totalLabel="Total"
          approvedLabel="Approved"
        />

        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-vistaNavy text-lg font-bold">
            Recent Submissions
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("StudentTracker")}
          >
            <Text className="text-vistaNavy text-sm">View All</Text>
          </TouchableOpacity>
        </View>
        {isLoading ? (
          <View className="py-6">
            <ActivityIndicator />
          </View>
        ) : isError ? (
          <Text className="text-gray-500">Could not load submissions.</Text>
        ) : submissions.length === 0 ? (
          <Text className="text-gray-500">No submissions yet.</Text>
        ) : (
          submissions.map((submission) => (
            <SubmissionListCard
              key={submission.submission_id}
              submission={submission}
              compact
              showSubmitterEmail
              onPress={() =>
                navigation.navigate("StudentSubmissionDetails", { submission })
              }
            />
          ))
        )}
      </ScrollView>
      <StudentBottomNav
        activeTab="home"
        onHomePress={() => navigation.navigate("StudentHome")}
        onTrackerPress={() => navigation.navigate("StudentTracker")}
      />
    </View>
  );
}
