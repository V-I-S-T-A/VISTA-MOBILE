import { Text } from "../../../components/common/FontText";
import { View, Image, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Feather, FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useQueries } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import { useSubmissions } from "../../../hooks/useSubmissions";
import { submissionsService } from "../../../services/submissionsService";
import AccountHeader from "../../../components/common/AccountHeader";
import SubmissionListCard from "../../../components/submissions/SubmissionListCard";
import SubmissionDashboardCards from "../../../components/submissions/SubmissionDashboardCards";
import { MAIN_BLACK } from "../../../constants/colors";

function StaffHomeHeader() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const avatarUrl = user?.image_url
    ? { uri: user.image_url }
    : require("../../../assets/default_user.jpg");

  return (
    <View className="flex-row items-center justify-between mb-4">
      <TouchableOpacity onPress={() => navigation.navigate("StaffProfile")}>
        <Image
          source={avatarUrl}
          className="w-10 h-10 rounded-full bg-gray-200"
        />
      </TouchableOpacity>
      <Image
        source={require("../../../assets/logo.png")}
        className="w-14 h-14"
        resizeMode="contain"
      />
      <TouchableOpacity>
        <Feather name="sliders" size={23} color="#111827" />
      </TouchableOpacity>
    </View>
  );
}

function useSubmissionCounts() {
  const results = useQueries({
    queries: [
      {
        queryKey: ["submissions", "count", "all"],
        queryFn: () => submissionsService.listSubmissions({ page_size: 1 }),
      },
      {
        queryKey: ["submissions", "count", "pending"],
        queryFn: () =>
          submissionsService.listSubmissions({
            page_size: 1,
            status: "pending",
          }),
      },
      {
        queryKey: ["submissions", "count", "approved"],
        queryFn: () =>
          submissionsService.listSubmissions({
            page_size: 1,
            status: "approved",
          }),
      },
    ],
  });

  const [all, pending, approved] = results;
  const isLoading = results.some((r) => r.isLoading);

  return {
    isLoading,
    total: all.data?.count ?? 0,
    pending: pending.data?.count ?? 0,
    approved: approved.data?.count ?? 0,
  };
}

function SubmissionSummary() {
  const navigation = useNavigation();
  const { isLoading, total, pending, approved } = useSubmissionCounts();

  const openReviews = (statusFilter) =>
    navigation.navigate("StaffReviewPanel", { statusFilter });

  return (
    <SubmissionDashboardCards
      isLoading={isLoading}
      total={total}
      pending={pending}
      approved={approved}
      totalOnPress={() => openReviews("All Status")}
      pendingOnPress={() => openReviews("Pending")}
      approvedOnPress={() => openReviews("Approved")}
      showTotalLoader
    />
  );
}

function RecentSubmissions() {
  const navigation = useNavigation();
  const { data, isLoading, isError } = useSubmissions({ page_size: 3 });
  const submissions = data?.results ?? [];

  return (
    <>
      <View className="flex-row justify-between items-center mb-3">
        <Text className="font-bold text-base" style={{ color: MAIN_BLACK }}>
          Recent Submissions
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("StaffReviewPanel")}
        >
          <Text className="text-vistaNavy text-sm">View All</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : isError ? (
        <Text className="text-gray-500 text-sm">
          Could not load recent submissions.
        </Text>
      ) : submissions.length === 0 ? (
        <Text className="text-gray-500 text-sm">No submissions yet.</Text>
      ) : (
        submissions.map((submission) => (
          <SubmissionListCard
            key={submission.submission_id}
            submission={submission}
            compact
            showSubmitterEmail
            onPress={() =>
              navigation.navigate("ReviewPanelDetails", { submission })
            }
          />
        ))
      )}
    </>
  );
}

export default function StaffHomeContent() {
  return (
    <ScrollView
      className="flex-1 pt-4"
      contentContainerStyle={{ paddingBottom: 18 }}
      showsVerticalScrollIndicator={false}
    >
      <AccountHeader profileRoute="StaffProfile" />

      <Text className="text-2xl font-bold" style={{ color: MAIN_BLACK }}>Staff Dashboard</Text>
      <Text className="mb-6" style={{ color: MAIN_BLACK }}>Welcome back!</Text>

      <SubmissionSummary />
      <RecentSubmissions />
    </ScrollView>
  );
}
