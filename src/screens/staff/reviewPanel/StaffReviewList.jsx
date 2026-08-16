import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";

function initialsAndColor(orgName = "") {
  const label = orgName.slice(0, 4).toUpperCase() || "N/A";
  const palette = ["#1a5b82", "#ea4335", "#000000", "#fbbc05"];
  const color = palette[label.length % palette.length];
  return { label, color };
}

function LogoPlaceholder({ text, color }) {
  return (
    <View
      className="w-[60px] h-[60px] rounded-full items-center justify-center mr-4"
      style={{ backgroundColor: color + "15" }}
    >
      <Text className="font-extrabold text-sm" style={{ color }}>
        {text}
      </Text>
    </View>
  );
}

export default function StaffReviewList({
  submissions = [],
  isLoading,
  isError,
  onRetry,
  onOpen,
}) {
  if (isLoading) {
    return (
      <View className="py-10 items-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="py-10 items-center">
        <Text className="text-gray-500 mb-3">Could not load submissions.</Text>
        <TouchableOpacity
          onPress={onRetry}
          className="bg-vistaNavy rounded-full px-4 py-2"
        >
          <Text className="text-white font-semibold text-xs">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (submissions.length === 0) {
    return (
      <View className="py-10 items-center">
        <Text className="text-gray-500 font-medium">
          No submissions to review.
        </Text>
      </View>
    );
  }

  return (
    <View className="mb-4">
      {submissions.map((item) => {
        const { label, color } = initialsAndColor(item.org_name);
        return (
          <View
            key={item.submission_id}
            className="bg-white rounded-3xl p-5 mb-4 flex-row items-center"
          >
            <LogoPlaceholder text={label} color={color} />
            <View className="flex-1 justify-center">
              <Text
                className="text-vistaNavy font-bold text-[15px] mb-1"
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text className="text-gray-500 text-xs mb-3" numberOfLines={1}>
                {item.submitted_by_name || item.submitted_by_email}
              </Text>
              <View className="flex-row justify-between items-center mt-1">
                <Text className="text-gray-500 text-xs font-medium">
                  {item.submitted_at
                    ? new Date(item.submitted_at).toLocaleDateString()
                    : "—"}
                </Text>
                <TouchableOpacity onPress={() => onOpen?.(item)}>
                  <Text className="text-[#3b82f6] text-xs font-semibold">
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
