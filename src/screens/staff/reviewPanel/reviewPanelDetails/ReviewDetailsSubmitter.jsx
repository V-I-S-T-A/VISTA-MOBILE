import { View, Text } from "react-native";

export default function ReviewDetailsSubmitter({ submission }) {
  const initials = (submission?.org_name || "N/A").slice(0, 4).toUpperCase();

  return (
    <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
      <View className="flex-row items-center mb-5">
        <View className="w-12 h-12 rounded-full bg-[#1e5aa015] items-center justify-center mr-4">
          <Text className="text-[#1e5aa0] font-extrabold text-xs">
            {initials}
          </Text>
        </View>
        <View>
          <Text className="text-gray-500 text-[10px] font-bold tracking-wider mb-1">
            SUBMITTER DETAILS
          </Text>
          <Text className="text-vistaNavy text-lg font-bold">
            {submission?.submitted_by_name || "Unknown"}
          </Text>
        </View>
      </View>

      <View className="h-[1px] bg-gray-100 w-full mb-5" />

      <View>
        <View className="flex-row justify-between items-center">
          <Text className="text-gray-500 text-sm">Organization</Text>
          <Text className="text-vistaNavy font-bold text-sm">
            {submission?.org_name || "—"}
          </Text>
        </View>
        <View className="flex-row justify-between items-center mt-3">
          <Text className="text-gray-500 text-sm">Email</Text>
          <Text className="text-vistaNavy font-bold text-sm">
            {submission?.submitted_by_email || "—"}
          </Text>
        </View>
        <View className="flex-row justify-between items-center mt-3">
          <Text className="text-gray-500 text-sm">Submitted On</Text>
          <Text className="text-vistaNavy font-bold text-sm">
            {submission?.submitted_at
              ? new Date(submission.submitted_at).toLocaleDateString()
              : "—"}
          </Text>
        </View>
      </View>
    </View>
  );
}
