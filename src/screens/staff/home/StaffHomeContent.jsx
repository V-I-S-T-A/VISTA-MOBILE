import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useQueries } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import { useSubmissions } from "../../../hooks/useSubmissions";
import { submissionsService } from "../../../services/submissionsService";

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

// Statuses that count as "completed" for the dashboard tile.
const COMPLETED_STATUSES = ["approved", "rejected"];

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
      {
        queryKey: ["submissions", "count", "rejected"],
        queryFn: () =>
          submissionsService.listSubmissions({
            page_size: 1,
            status: "rejected",
          }),
      },
    ],
  });

  const [all, pending, approved, rejected] = results;
  const isLoading = results.some((r) => r.isLoading);

  return {
    isLoading,
    total: all.data?.count ?? 0,
    pending: pending.data?.count ?? 0,
    completed: (approved.data?.count ?? 0) + (rejected.data?.count ?? 0),
  };
}

function SubmissionSummary() {
  const { isLoading, total, pending, completed } = useSubmissionCounts();

  return (
    <>
      <View className="bg-vistaNavy rounded-2xl p-5 flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-white/80 text-sm mb-1">Total Submissions</Text>
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-3xl font-bold">{total}</Text>
          )}
        </View>
        <View className="bg-white/20 rounded-xl p-3">
          <Feather name="folder" size={26} color="white" />
        </View>
      </View>

      <View className="flex-row gap-3 mb-6">
        <View className="flex-1 bg-vistaYellow rounded-2xl p-4 flex-row justify-between items-center">
          <View>
            <Text className="text-white/90 text-sm mb-1">Pending</Text>
            <Text className="text-white text-2xl font-bold">
              {isLoading ? "—" : pending}
            </Text>
          </View>
          <Feather name="clock" size={22} color="white" />
        </View>
        <View className="flex-1 bg-vistaYellow rounded-2xl p-4 flex-row justify-between items-center">
          <View>
            <Text className="text-white/90 text-sm mb-1">Completed</Text>
            <Text className="text-white text-2xl font-bold">
              {isLoading ? "—" : completed}
            </Text>
          </View>
          <Feather name="check-square" size={22} color="white" />
        </View>
      </View>
    </>
  );
}

function RecentSubmissionItem({ item, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl p-4 mb-3 flex-row justify-between items-center"
    >
      <View className="flex-1">
        <Text className="text-gray-800 font-semibold" numberOfLines={1}>
          {item.title}
        </Text>
        {item.submitted_by_email ? (
          <Text className="text-gray-400 text-xs mt-1">
            {item.submitted_by_email}
          </Text>
        ) : null}
        {item.submitted_at ? (
          <Text className="text-gray-400 text-xs">
            {new Date(item.submitted_at).toLocaleDateString(undefined, {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </Text>
        ) : null}
      </View>
      {item.status ? (
        <View className="bg-vistaYellow/90 rounded-full px-3 py-1">
          <Text className="text-white text-xs font-semibold">
            {item.status
              .replace("_", " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function RecentSubmissions() {
  const navigation = useNavigation();
  const { data, isLoading, isError } = useSubmissions({ page_size: 3 });
  const submissions = data?.results ?? [];

  return (
    <>
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-vistaNavy font-bold text-base">
          Recent Submissions
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("StaffSubmissionHistory")}
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
        submissions.map((item) => (
          <RecentSubmissionItem
            key={item.submission_id}
            item={item}
            onPress={() =>
              navigation.navigate("ReviewPanelDetails", { submission: item })
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
      className="flex-1 px-4 pt-4"
      contentContainerStyle={{ paddingBottom: 18 }}
      showsVerticalScrollIndicator={false}
    >
      <StaffHomeHeader />

      <Text className="text-2xl font-bold text-vistaNavy">Staff Dashboard</Text>
      <Text className="text-gray-500 mb-4">Welcome back!</Text>

      <SubmissionSummary />
      <RecentSubmissions />
    </ScrollView>
  );
}
