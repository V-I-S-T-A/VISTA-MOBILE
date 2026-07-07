import { View, Text } from "react-native";

export default function SystemHealthCard() {
  return (
    <View className="bg-[#FFC342] rounded-2xl px-4 py-4 mb-5">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-vistaNavy text-xs font-extrabold">
          System Health
        </Text>
        <View className="bg-white rounded-full px-3 py-1">
          <Text className="text-[#73C668] text-[9px] font-extrabold">
            ACTIVE ENGINE
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white text-xl font-extrabold">
          OCR EXTRACTION
        </Text>
        <Text className="text-[#F6A318] text-xl font-extrabold">100%</Text>
      </View>

      <View className="h-3 bg-[#F6A318] rounded-full" />
    </View>
  );
}