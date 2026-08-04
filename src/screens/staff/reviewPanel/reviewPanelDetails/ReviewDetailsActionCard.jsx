import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function ReviewDetailsActionCard() {
  return (
    <View className="bg-white rounded-3xl p-6 mb-8 shadow-sm">
      <Text className="text-vistaNavy text-xs font-bold tracking-wider mb-2 mt-1">
        DOCUMENT STATUS
      </Text>
      
      <TouchableOpacity className="border border-gray-200 rounded-xl p-3.5 flex-row justify-between items-center mb-6">
        <Text className="text-gray-500 text-sm">Select status..</Text>
        <Feather name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <Text className="text-vistaNavy text-xs font-bold tracking-wider mb-2">
        REVIEWER REMARKS
      </Text>

      <View className="border border-gray-200 rounded-xl p-4 h-32 mb-6">
        <TextInput
          placeholder="Enter detailed notes or revision requirements..."
          placeholderTextColor="#9ca3af"
          multiline
          className="text-sm text-gray-800 h-full"
          style={{ textAlignVertical: 'top' }}
        />
      </View>

      <TouchableOpacity className="bg-[#FFC342] rounded-xl py-3.5 items-center justify-center">
        <Text className="text-white font-extrabold text-[15px]">Update Status</Text>
      </TouchableOpacity>
    </View>
  );
}
