import { ActivityIndicator, Text, View } from "react-native";
import { useReviewLogs } from "../../hooks/useReviewLogs";
import StatusBadge from "./StatusBadge";
import { getStatusMeta } from "../../constants/submissionStatus";

const formatStatus = (status) => getStatusMeta(status).label;

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
        <Text className="text-vistaNavy text-base font-extrabold tracking-wide">
          STATUS HISTORY
        </Text>
      </View>
      <View className="px-6 py-6">
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
            const meta = getStatusMeta(log.new_status);
            return (
              <View key={log.log_id} className="flex-row">
                <View className="w-10 items-center relative">
                  {hasNextLog ? (
                    <View
                      className="absolute w-[2px] bg-gray-200"
                      style={{ top: 24, bottom: -8 }}
                    />
                  ) : null}
                  <View className="w-7 h-7 rounded-full bg-white border border-gray-100 items-center justify-center z-10">
                    <View
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: meta.dot }}
                    />
                  </View>
                </View>

                <View className={`flex-1 ${hasNextLog ? "pb-6" : ""}`}>
                  <StatusBadge status={log.new_status} />
                  <Text className="text-gray-500 text-xs mt-2">
                    {formatDate(log.changed_at)}
                  </Text>
                  {log.old_status ? (
                    <Text className="text-gray-500 text-xs mt-1">
                      Updated from {formatStatus(log.old_status)}
                    </Text>
                  ) : null}
                  {log.remarks_text ? (
                    <Text className="text-vistaNavy text-sm leading-5 mt-2">
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
