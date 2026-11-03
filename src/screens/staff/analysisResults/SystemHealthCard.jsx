import { Text } from "../../../components/common/FontText";
import { View } from "react-native";

export default function SystemHealthCard() {
  return (
    <View className="bg-[#FFC342] rounded-2xl p-3 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-vistaNavy text-xs font-medium">
          System Health
        </Text>
        <View className="bg-white rounded-full px-3 py-1">
          <Text className="text-[#15803D] text-xs font-medium">
            Active engine
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-[#513600] text-[14px] font-medium">
          OCR extraction
        </Text>
        <Text className="text-[#513600] text-[14px] font-medium">100%</Text>
      </View>

      <View className="h-3 bg-[#F6A318] rounded-full" />
    </View>
  );
}