import { ActivityIndicator, Text, View } from "react-native";
import { useReviewLogs } from "../../hooks/useReviewLogs";

const STATUS_LABELS = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  resubmission_required: "Resubmission Required",
};

const formatStatus = (status) =>
  STATUS_LABELS[status] || status?.replace(/_/g, " ") || "—";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function SubmissionStatusHistory({ submissionId }) {
  const { data, isLoading, isError } = useReviewLogs(submissionId);
  const logs = data?.results ?? [];

  return (
    <View className="bg-white rounded-3xl mb-8 overflow-hidden border border-gray-300 shadow-sm">
      <View className="bg-[#FFE35B] px-6 py-3.5">
        <Text className="text-vistaNavy text-lg font-extrabold tracking-wide">
          STATUS HISTORY
        </Text>
      </View>
      <View className="px-6 py-7">
        {isLoading ? (
          <View className="py-5 items-center">
            <ActivityIndicator />
          </View>
        ) : isError ? (
          <Text className="text-gray-500 text-sm">
            Could not load status history.
          </Text>
        ) : logs.length === 0 ? (
          <Text className="text-gray-500 text-sm">No status history yet.</Text>
        ) : (
          logs.map((log, index) => {
            const hasNextLog = index < logs.length - 1;
            return (
              <View key={log.log_id} className="flex-row">
                <View className="w-12 items-center relative">
                  {hasNextLog ? (
                    <View
                      className="absolute w-[2px] bg-gray-300"
                      style={{ top: 28, bottom: -8 }}
                    />
                  ) : null}
                  <View className="w-8 h-8 rounded-full bg-white border border-gray-100 items-center justify-center z-10">
                    <View
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: index === 0 ? "#4285F4" : "#94A3B8",
                      }}
                    />
                  </View>
                </View>
                <View className={`flex-1 ${hasNextLog ? "pb-7" : ""}`}>
                  <Text className="text-vistaNavy text-lg font-medium leading-6">
                    {formatStatus(log.new_status)}
                  </Text>
                  <Text className="text-gray-600 text-sm font-medium mt-1">
                    {formatDate(log.changed_at)}
                  </Text>
                  {log.old_status ? (
                    <Text className="text-gray-500 text-sm mt-2">
                      Updated from {formatStatus(log.old_status)}
                    </Text>
                  ) : null}
                  {log.remarks_text ? (
                    <Text className="text-gray-600 text-base leading-6 mt-2">
                      {log.remarks_text}
                    </Text>
                  ) : null}
                  {log.changed_by_name ? (
                    <Text className="text-gray-400 text-xs mt-2">
                      Updated by {log.changed_by_name}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}
