import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSubmissions } from "../../../../hooks/useSubmissions";

const STATUS_TO_PARAM = {
  Pending: "pending",
  "Under Review": "under_review",
  Approved: "approved",
  Rejected: "rejected",
  "Resubmission Required": "resubmission_required",
};

function initialsAndColor(orgName = "") {
  const label = orgName.slice(0, 4).toUpperCase() || "N/A";
  const palette = ["#1a5b82", "#ea4335", "#000000", "#fbbc05"];
  const color = palette[label.length % palette.length];
  return { label, color };
}

export default function SubmissionHistoryList({
  searchQuery = "",
  statusFilter = "All Status",
}) {
  const navigation = useNavigation();

  const params = {};
  if (searchQuery.trim()) params.search = searchQuery.trim();
  if (statusFilter !== "All Status")
    params.status = STATUS_TO_PARAM[statusFilter];

  const { data, isLoading, isError, refetch } = useSubmissions(params);
  const submissions = data?.results ?? [];

  if (isLoading) {
    return (
      <View className="py-10 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="py-10 items-center justify-center">
        <Text className="text-gray-500 mb-3">
          Could not load submission history.
        </Text>
        <TouchableOpacity
          onPress={refetch}
          className="bg-vistaNavy rounded-full px-4 py-2"
        >
          <Text className="text-white font-semibold text-xs">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (submissions.length === 0) {
    return (
      <View className="py-10 items-center justify-center">
        <Text className="text-gray-500 font-medium">No submissions found.</Text>
      </View>
    );
  }

  return (
    <View className="mb-2">
      {submissions.map((item) => {
        const { label, color } = initialsAndColor(item.org_name);
        return (
          <View
            key={item.submission_id}
            className="bg-white rounded-3xl p-5 mb-4 flex-row items-center shadow-sm"
          >
            <View
              className="w-14 h-14 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: color + "15" }}
            >
              <Text className="font-extrabold text-[13px]" style={{ color }}>
                {label}
              </Text>
            </View>

            <View className="flex-1 justify-center">
              <Text
                className="text-vistaNavy font-bold text-[15px] mb-1"
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                className="text-gray-500 text-[11px] mb-1"
                numberOfLines={1}
              >
                {item.submitted_by_email || item.submitted_by_name || "—"}
              </Text>

              <View className="flex-row justify-between items-center mt-3">
                <Text className="text-gray-500 text-[11px] font-medium">
                  {item.submitted_at
                    ? new Date(item.submitted_at).toLocaleDateString(
                        undefined,
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )
                    : "—"}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("ReviewPanelDetails", {
                      submission: item,
                    })
                  }
                >
                  <Text className="text-[#3b82f6] text-[11px] font-semibold">
                    View details
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
