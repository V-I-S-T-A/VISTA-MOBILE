import { Image, Text, TouchableOpacity, View } from "react-native";
import SubmissionStatusBadge from "./SubmissionStatusBadge";

export default function SubmissionListCard({
  submission,
  onPress,
  compact = false,
}) {
  const logo = submission.org_image_url
    ? { uri: submission.org_image_url }
    : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-3xl p-4 mb-4 flex-row items-center"
    >
      <View className="w-14 h-14 rounded-2xl bg-[#F3F6FA] items-center justify-center mr-4 overflow-hidden">
        {logo ? (
          <Image source={logo} className="w-11 h-11" resizeMode="contain" />
        ) : (
          <Text className="text-vistaNavy font-extrabold text-xs">
            {(submission.org_name || "N/A").slice(0, 4).toUpperCase()}
          </Text>
        )}
      </View>
      <View className="flex-1 min-w-0">
        <View className="flex-row items-start justify-between">
          <Text
            className="text-vistaNavy font-bold text-[15px] flex-1 min-w-0 mr-2"
            numberOfLines={1}
          >
            {submission.title || "Untitled Submission"}
          </Text>
          {compact ? (
            <SubmissionStatusBadge status={submission.status} size="small" />
          ) : null}
        </View>
        <Text className="text-gray-500 text-xs mt-1" numberOfLines={1} ellipsizeMode="tail">
          {submission.org_name || "Organization unavailable"}
        </Text>
        <View className="flex-row justify-between items-center mt-3">
          <Text className="text-gray-500 text-[11px]">
            {submission.submitted_at
              ? new Date(submission.submitted_at).toLocaleDateString()
              : "—"}
          </Text>
          {!compact ? (
            <Text className="text-[#3B82F6] text-[11px] font-semibold">
              View details
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}
