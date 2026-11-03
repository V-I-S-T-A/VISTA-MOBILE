import { Text } from "../../../../components/common/FontText";
import { View } from "react-native";

export default function ReviewDetailsTitleCard({ submission }) {
  return (
    <View className="bg-[#245EA9] rounded-3xl p-4 mb-4">
      <Text
        className="text-white font-bold text-[17px] leading-6"
      >
        {submission?.org_name ? `${submission.org_name}: ` : ""}
        {submission?.title || "Untitled Submission"}
      </Text>
    </View>
  );
}
