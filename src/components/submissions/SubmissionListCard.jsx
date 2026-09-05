import { Image, Text, TouchableOpacity, View } from "react-native";

const STATUS_LABELS = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  resubmission_required: "Resubmission Required",
};

const STATUS_CLASSES = {
  pending: "bg-[#FFF0C2] text-[#A66500]",
  under_review: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  resubmission_required: "bg-orange-100 text-orange-700",
};

export default function SubmissionListCard({
  submission,
  onPress,
  compact = false,
}) {
  const logo = submission.org_image_url
    ? { uri: submission.org_image_url }
    : null;
  const statusClass =
    STATUS_CLASSES[submission.status] || "bg-gray-100 text-gray-700";

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
      <View className="flex-1">
        <View className="flex-row items-start justify-between">
          <Text
            className="text-vistaNavy font-bold text-[15px] flex-1 mr-2"
            numberOfLines={1}
          >
            {submission.title || "Untitled Submission"}
          </Text>
          {compact ? (
            <View
              className={`rounded-full px-2.5 py-1 ${statusClass.split(" ")[0]}`}
            >
              <Text
                className={`text-xs font-semibold ${statusClass.split(" ")[1]}`}
              >
                {STATUS_LABELS[submission.status] || submission.status || "—"}
              </Text>
            </View>
          ) : null}
        </View>
        <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>
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
