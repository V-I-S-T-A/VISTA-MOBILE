import { View, Text } from "react-native";

export default function ReviewDetailsSubmitter() {
  return (
    <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
      <View className="flex-row items-center mb-5">
        <View className="w-12 h-12 rounded-full bg-[#1e5aa015] items-center justify-center mr-4">
          <Text className="text-[#1e5aa0] font-extrabold text-xs">SITE</Text>
        </View>
        <View>
          <Text className="text-gray-500 text-[10px] font-bold tracking-wider mb-1">
            SUBMITTER DETAILS
          </Text>
          <Text className="text-vistaNavy text-lg font-bold">
            Angelo Binonggo
          </Text>
        </View>
      </View>

      <View className="h-[1px] bg-gray-100 w-full mb-5" />

      <View className="space-y-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-gray-500 text-sm">Organization</Text>
          <Text className="text-vistaNavy font-bold text-sm">SITE: Society of Inf...</Text>
        </View>
        <View className="flex-row justify-between items-center mt-3">
          <Text className="text-gray-500 text-sm">Email</Text>
          <Text className="text-vistaNavy font-bold text-sm">angelo.SITE@gm...</Text>
        </View>
        <View className="flex-row justify-between items-center mt-3">
          <Text className="text-gray-500 text-sm">Submitted On</Text>
          <Text className="text-vistaNavy font-bold text-sm">Apr 24, 2026</Text>
        </View>
      </View>
    </View>
  );
}
