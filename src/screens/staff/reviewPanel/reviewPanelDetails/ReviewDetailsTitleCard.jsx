import { View, Text } from "react-native";

export default function ReviewDetailsTitleCard({ submission }) {
  return (
    <View className="bg-[#1e5aa0] rounded-2xl p-6 mb-6 shadow-sm">
      <Text className="text-white font-extrabold text-[22px] leading-8">
        {submission?.org_name ? `${submission.org_name}: ` : ""}
        {submission?.title || "Untitled Submission"}
      </Text>
    </View>
  );
}
