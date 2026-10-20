import { View, Text } from "react-native";

export default function ReviewDetailsTitleCard({ submission }) {
  return (
    <View className="bg-[#245EA9] rounded-2xl p-5 mb-4">
      <Text
        className="text-white font-extrabold text-[22px] leading-8"
        numberOfLines={3}
        ellipsizeMode="tail"
      >
        {submission?.org_name ? `${submission.org_name}: ` : ""}
        {submission?.title || "Untitled Submission"}
      </Text>
    </View>
  );
}
