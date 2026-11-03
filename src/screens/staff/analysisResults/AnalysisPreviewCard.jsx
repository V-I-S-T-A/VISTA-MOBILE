import { Text } from "../../../components/common/FontText";
import { View, Image } from "react-native";

export default function AnalysisPreviewCard() {
  return (
    <View className="rounded-2xl overflow-hidden mb-3">
      <Image
        source={require("../../../assets/analysis-results.webp")}
        className="w-full h-36"
        resizeMode="cover"
      />
      <View className="absolute left-3 bottom-3 bg-[#F5A623]/90 px-3 py-2 rounded-md">
        <Text className="text-[#513600] text-xs font-medium">
          Source: site2026_sarf.pdf
        </Text>
        <Text className="text-[#513600] text-xs font-medium">
          Captured: 10:42 AM, 20 JAN 2026
        </Text>
      </View>
    </View>
  );
}