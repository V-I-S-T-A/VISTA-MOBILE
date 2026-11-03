import UserAvatar from '../common/UserAvatar';
import { Text } from "../common/FontText";
import { ActivityIndicator, View } from "react-native";
import { useReviewLogs } from "../../hooks/useReviewLogs";
import { FontAwesome6, Feather } from "@expo/vector-icons";
import { surfaces, typography } from "../../theme/layout";
import { getSubmissionStatus } from "./SubmissionStatusBadge";
import { TimelineSkeleton } from '../common/Skeleton';

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
    <View className="bg-white rounded-3xl mb-4 overflow-hidden" style={surfaces.card}>
      <View className="bg-[#FFE35B] px-4 py-3 flex-row items-center gap-3">
        <FontAwesome6 name="clock-rotate-left" size={20} color="#102D69" />
        <Text className="text-vistaNavy flex-1" style={typography.section}>
          Status history
        </Text>
        {!isLoading && !isError && logs.length > 0 ? (
          <Text className="text-vistaNavy text-xs font-medium">
            {logs.length} {logs.length === 1 ? "update" : "updates"}
          </Text>
        ) : null}
      </View>
      <View className="px-4 py-4">
        {isLoading ? (
          <TimelineSkeleton />
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
                <View className="w-8 items-center relative">
                  {hasNextLog ? (
                    <View
                      className="absolute w-[2px] bg-[#E7ECF2]"
                      style={{ top: 24, bottom: 0 }}
                    />
                  ) : null}
                  <View className="w-6 h-6 rounded-full bg-white border border-[#E7ECF2] items-center justify-center z-10">
                    <View
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: index === 0 ? getSubmissionStatus(log.new_status).foreground : "#94A3B8",
                      }}
                    />
                  </View>
                </View>
                <View className={`flex-1 min-w-0 pl-2 ${hasNextLog ? "pb-6" : ""}`}>
                  <View className="flex-row items-center flex-wrap gap-2">
                    <Text className="text-vistaNavy text-sm font-bold leading-6 shrink">
                      {formatStatus(log.new_status)}
                    </Text>
                    {index === 0 ? (
                      <View className="bg-blue-50 rounded-full px-2 py-0.5">
                        <Text className="text-[#1A59A5] text-xs font-bold">
                          Latest
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text className="text-gray-500 text-xs leading-5 mt-0.5">
                    {formatDate(log.changed_at)}
                  </Text>
                  {log.old_status ? (
                    <View className="flex-row items-center flex-wrap gap-1.5 mt-2">
                      <View className="flex items-center shrink">
                        <Text className="text-gray-500 text-xs leading-5">{formatStatus(log.old_status)}</Text>
                      </View>
                      <Feather name="arrow-right" size={13} color="#94A3B8" />
                      <View className="flex items-center shrink">
                        <Text className="text-gray-600 text-xs leading-5">
                          {formatStatus(log.new_status)}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                  <View className="flex-row items-center mt-3">
                    <View className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 items-center justify-center mr-2">
                      <UserAvatar uri={log.changed_by_image_url} size={32} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-500 text-xs leading-4">Updated by</Text>
                      <Text
                        className="text-vistaNavy text-[13px] leading-5 font-bold"
                      >
                        {log.changed_by_name || "Staff"}
                      </Text>
                    </View>
                  </View>
                  {log.remarks_text ? (
                    <View className="bg-[#F4F7FB] border border-[#E7ECF2] rounded-2xl px-3 py-3 mt-3">
                      <Text className="text-gray-500 text-xs font-semibold mb-1">
                        Remarks &amp; feedback
                      </Text>
                      <Text className="text-vistaNavy text-[13px] leading-5">
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
