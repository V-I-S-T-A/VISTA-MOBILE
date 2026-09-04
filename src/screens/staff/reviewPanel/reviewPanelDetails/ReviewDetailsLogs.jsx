import { ActivityIndicator, Text, View } from "react-native";
import { useReviewLogs } from "../../../../hooks/useReviewLogs";
import Ionicons from "@expo/vector-icons/Ionicons";

const STATUS_LABELS = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  resubmission_required: "Resubmission Required",
};

function formatStatus(status) {
  return STATUS_LABELS[status] || status?.replace(/_/g, " ") || "—";
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ReviewDetailsLogs({ submissionId }) {
  const { data, isLoading, isError } = useReviewLogs(submissionId);
  const logs = data?.results ?? [];

  return (
    <View className="bg-white rounded-3xl p-6 mb-8 shadow-sm">
      <Text className="text-vistaNavy text-xs font-bold tracking-wider mb-5">
        REVIEW LOGS
      </Text>

      {isLoading ? (
        <View className="py-5 items-center">
          <ActivityIndicator />
        </View>
      ) : isError ? (
        <Text className="text-gray-500 text-sm">
          Could not load review logs.
        </Text>
      ) : logs.length === 0 ? (
        <Text className="text-gray-500 text-sm">No review logs yet.</Text>
      ) : (
        logs.map((log, index) => (
          <View
            key={log.log_id}
            className={index < logs.length - 1 ? "border-b border-gray-100 pb-4 mb-4" : ""}
          >
            <View className="flex-row justify-between items-start mb-2">
              <Text className="text-vistaNavy font-bold text-sm flex-1 mr-3">
                {log.changed_by_name || "Unknown reviewer"}
              </Text>
              <Text className="text-gray-400 text-[11px]">
                {formatDate(log.changed_at)}
              </Text>
            </View>
            <Text className="text-gray-600 text-sm">
              {formatStatus(log.old_status)} <Ionicons name="arrow-forward" size={16} color="gray" /> {formatStatus(log.new_status)}
            </Text>
            {log.remarks_text ? (
              <Text className="text-gray-500 text-sm mt-2">
                {log.remarks_text}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}
