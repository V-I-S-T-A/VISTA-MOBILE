import { Text } from "../common/FontText";
import { ActivityIndicator, Image, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useReviewLogs } from "../../hooks/useReviewLogs";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function SubmissionDetailsRemarks({ submissionId }) {
  const { data, isLoading, isError } = useReviewLogs(submissionId);
  const remarks = (data?.results ?? []).filter(
    (log) => log.remarks_text?.trim(),
  );

  return (
    <View className="bg-white rounded-xl mb-5 overflow-hidden border border-gray-300 shadow-sm">
      <View className="bg-[#245EA9] px-4 py-3 flex-row items-center justify-between">
        <Text className="text-white text-sm font-extrabold tracking-wider flex-1 mr-2">
          STAFF REMARKS & FEEDBACKS
        </Text>
        <View className="bg-[#FFD400] rounded-xl px-3 py-2">
          <Text className="text-vistaNavy text-[10px] font-extrabold">
            {remarks.length} {remarks.length === 1 ? "UPDATE" : "UPDATES"}
          </Text>
        </View>
      </View>
      <View className="p-4">
        {isLoading ? (
          <View className="py-5 items-center">
            <ActivityIndicator />
          </View>
        ) : isError ? (
          <Text className="text-gray-500 text-sm">
            Could not load staff remarks.
          </Text>
        ) : remarks.length === 0 ? (
          <View className="py-2 flex-row items-center">
            <Feather name="message-square" size={18} color="#94A3B8" />
            <Text className="text-gray-500 text-sm ml-3">
              No staff remarks yet.
            </Text>
          </View>
        ) : (
          remarks.map((log, index) => (
            <View
              key={log.log_id}
              className={`flex-row ${index < remarks.length - 1 ? "mb-4" : ""}`}
            >
              <View className="w-10 h-10 rounded-lg bg-[#EAF0FA] items-center justify-center mr-3 overflow-hidden">
                {log.changed_by_image_url ? (
                  <Image
                    source={{ uri: log.changed_by_image_url }}
                    className="w-10 h-10"
                    resizeMode="cover"
                  />
                ) : (
                  <Feather name="user" size={18} color="#245EA9" />
                )}
              </View>
              <View className="flex-1 min-w-0">
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 min-w-0 mr-2">
                    <Text
                      className="text-vistaNavy text-sm font-semibold"
                      numberOfLines={1}
                    >
                      {log.changed_by_name || "Staff member"}
                    </Text>
                    <Text className="text-gray-600 text-[10px]">
                      {log.new_status?.replace(/_/g, " ") || "Status update"}
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-[9px]">
                    {formatDate(log.changed_at)}
                  </Text>
                </View>
                <View className="bg-[#F0F3FF] border border-gray-300 rounded-md p-3">
                  <Text className="text-gray-700 text-sm leading-6">
                    {log.remarks_text}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
