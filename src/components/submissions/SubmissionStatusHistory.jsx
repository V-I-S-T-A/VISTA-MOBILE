import { Text } from "../common/FontText";
import { ActivityIndicator, View, Image } from "react-native";
import { useReviewLogs } from "../../hooks/useReviewLogs";
import { FontAwesome6, Feather } from "@expo/vector-icons";

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
    <View className="bg-white rounded-2xl mb-8 overflow-hidden border border-gray-300 shadow-sm">
      <View className="bg-[#FFE35B] px-5 py-4 flex-row items-center gap-3">
        <FontAwesome6 name="clock-rotate-left" size={22} color="#102D69" />
        <Text className="text-vistaNavy text-md font-extrabold flex-1">
          Status history
        </Text>
        {!isLoading && !isError && logs.length > 0 ? (
          <Text className="text-gray-700 text-sm font-medium">
            {logs.length} {logs.length === 1 ? "update" : "updates"}
          </Text>
        ) : null}
      </View>
      <View className="px-5 py-6">
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
                <View className="w-11 items-center relative">
                  {hasNextLog ? (
                    <View
                      className="absolute w-[2px] bg-gray-300"
                      style={{ top: 30, bottom: -8 }}
                    />
                  ) : null}
                  <View className="w-9 h-9 rounded-full bg-white border-2 border-gray-100 items-center justify-center z-10">
                    <View
                      className="w-5 h-5 rounded-full"
                      style={{
                        backgroundColor: index === 0 ? "#4285F4" : "#94A3B8",
                      }}
                    />
                  </View>
                </View>
                <View className={`flex-1 pl-2 ${hasNextLog ? "pb-8" : ""}`}>
                  <View className="flex-row items-center flex-wrap gap-2">
                    <Text className="text-vistaNavy text-md font-bold leading-7">
                      {formatStatus(log.new_status)}
                    </Text>
                    {index === 0 ? (
                      <View className="bg-blue-50 rounded-full px-3 py-1">
                        <Text className="text-blue-600 text-xs font-bold">Latest</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text className="text-gray-600 text-sm font-medium mt-1">
                    {formatDate(log.changed_at)}
                  </Text>
                  {log.old_status ? (
                    <View className="flex-row items-center gap-2 mt-4">
                      <Text className="text-gray-600 text-base">
                        {formatStatus(log.old_status)}
                      </Text>
                      <Feather name="arrow-right" size={16} color="#94A3B8" />
                      <Text className="text-gray-600 text-base">
                        {formatStatus(log.new_status)}
                      </Text>
                    </View>
                  ) : null}
                  <View className="flex-row items-center mt-4">
                    <View className="w-12 h-12 rounded-xl bg-slate-100 items-center justify-center mr-3">
                      {log.changed_by_image_url ? (
                        <Image
                          source={{ uri: log.changed_by_image_url }}
                          className="w-full h-full rounded-xl"
                        />
                      ) : (
                        <FontAwesome6 name="user" size={19} color="#64748B" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-500 text-sm">Updated by</Text>
                      <Text className="text-vistaNavy text-base font-bold" numberOfLines={2}>
                        {log.changed_by_name || "Staff"}
                      </Text>
                    </View>
                  </View>
                  {log.remarks_text ? (
                    <View className="bg-[#F1F4FC] border border-[#E0E5F2] rounded-xl px-4 py-3 mt-4">
                      <Text className="text-gray-600 text-sm font-semibold mb-1">
                        Remarks &amp; feedback
                      </Text>
                      <Text className="text-vistaNavy text-base leading-6">
                        {log.remarks_text}
                      </Text>
                    </View>
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
