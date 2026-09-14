import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQueries } from "@tanstack/react-query";
import StudentHeader from "../../components/students/StudentHeader";
import StudentBottomNav from "../../components/student/StudentBottomNav";
import SubmissionListCard from "../../components/submissions/SubmissionListCard";
import { useSubmissions } from "../../hooks/useSubmissions";
import { submissionsService } from "../../services/submissionsService";

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

  return (
    <View className="flex-1 bg-[#F3F3F3]" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <StudentHeader />
        <Text className="text-2xl font-extrabold text-vistaNavy">
          Student Org. Dashboard
        </Text>
        <Text className="text-vistaNavy text-sm mb-5">Welcome back!</Text>

        <View className="bg-[#245EA9] rounded-3xl p-5 flex-row justify-between items-center mb-5">
          <View>
            <Text className="text-white/80 text-sm">Total</Text>
            <Text className="text-white text-5xl font-bold mt-2">
              {counts.loading ? "—" : counts.total}
            </Text>
          </View>
          <View className="bg-[#073D7D] rounded-xl p-3">
            <Feather name="folder" size={30} color="white" />
          </View>
        </View>
        <View className="flex-row gap-4 mb-8">
          <View className="flex-1 bg-[#FFC342] rounded-3xl p-5">
            <Text className="text-white text-sm">Pending</Text>
            <Text className="text-white text-4xl font-bold mt-2">
              {counts.loading ? "—" : counts.pending}
            </Text>
          </View>
          <View className="flex-1 bg-[#FFC342] rounded-3xl p-5">
            <Text className="text-white text-sm">Verified</Text>
            <Text className="text-white text-4xl font-bold mt-2">
              {counts.loading ? "—" : counts.approved}
            </Text>
          </View>
        </View>

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
