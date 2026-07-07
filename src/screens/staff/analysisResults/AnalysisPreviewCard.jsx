import { View, Text, Image } from "react-native";

export default function AnalysisPreviewCard() {
  return (
    <View className="rounded-2xl overflow-hidden mb-6">
      <Image
        source={require("../../../assets/analysis-results.png")}
        className="w-full h-36"
        resizeMode="cover"
      />
      <View className="absolute left-5 bottom-5 bg-[#F5A623]/90 px-3 py-2 rounded-md">
        <Text className="text-white text-[10px] font-extrabold">
          Source: site2026_sarf.pdf
        </Text>
        <Text className="text-white text-[10px] font-extrabold">
          Captured: 10:42 AM, 20 JAN 2026
        </Text>
      </View>
    </View>
  );
}