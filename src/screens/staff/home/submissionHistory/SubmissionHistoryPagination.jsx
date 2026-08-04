import { View, Text, TouchableOpacity } from "react-native";

export default function SubmissionHistoryPagination() {
  return (
    <View className="mb-8 mt-2">
      <Text className="text-right text-vistaNavy font-bold text-xs mb-3 pr-2">Page 1</Text>
      <View className="bg-[#FFD740] rounded-full py-3 px-5 flex-row justify-between items-center shadow-sm">
        <TouchableOpacity className="bg-white rounded-full px-4 py-1.5 shadow-sm">
          <Text className="text-gray-800 font-semibold text-xs">Previous</Text>
        </TouchableOpacity>
        
        <View className="flex-row items-center space-x-3">
          <Text className="text-vistaNavy font-bold text-[13px]">1</Text>
          <View className="bg-white rounded-full w-7 h-7 items-center justify-center shadow-sm mx-3">
            <Text className="text-gray-800 font-bold text-[13px]">2</Text>
          </View>
          <Text className="text-vistaNavy font-bold text-[13px]">3</Text>
          <Text className="text-vistaNavy font-bold text-[13px] mx-3">...</Text>
          <Text className="text-vistaNavy font-bold text-[13px]">17</Text>
        </View>

        <TouchableOpacity className="bg-white rounded-full px-4 py-1.5 shadow-sm">
          <Text className="text-gray-800 font-semibold text-xs">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
