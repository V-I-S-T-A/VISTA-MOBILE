import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

export default function SubmissionHistorySearch() {
  return (
    <View className="flex-row items-center justify-between mb-6">
      <View className="flex-row items-center bg-[#eef0f3] border border-gray-200 rounded-lg px-3 py-2.5 flex-1 mr-3 h-[42px]">
        <Feather name="search" size={16} color="#9ca3af" className="mr-2" />
        <TextInput 
          placeholder="Search submissions..."
          placeholderTextColor="#9ca3af"
          className="flex-1 text-[13px] text-gray-700 ml-1 h-full p-0"
        />
      </View>
      <TouchableOpacity className="bg-[#FFC342] flex-row items-center justify-center rounded-lg px-4 h-[42px] shadow-sm">
        <Ionicons name="filter" size={16} color="white" className="mr-2 mt-0.5" />
        <Text className="text-white font-bold text-sm ml-0.5">Filter</Text>
      </TouchableOpacity>
    </View>
  );
}
