import { View, Text, TouchableOpacity } from "react-native";

export default function StaffReviewPagination() {
  return (
    <View className="bg-[#FFD740] rounded-full py-3 px-5 flex-row justify-between items-center mb-8">
      <TouchableOpacity className="px-2">
        <Text className="text-gray-700 font-semibold text-sm">Previous</Text>
      </TouchableOpacity>
      
      <View className="flex-row items-center gap-3">
        <TouchableOpacity>
          <Text className="text-gray-700 font-semibold text-sm">1</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="bg-white w-8 h-8 rounded-full items-center justify-center shadow-sm">
          <Text className="text-gray-800 font-bold text-sm">2</Text>
        </TouchableOpacity>
        
        <TouchableOpacity>
          <Text className="text-gray-700 font-semibold text-sm">3</Text>
        </TouchableOpacity>
        
        <Text className="text-gray-700 font-semibold text-sm px-1">..</Text>
        
        <TouchableOpacity>
          <Text className="text-gray-700 font-semibold text-sm">17</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity className="bg-white rounded-full py-1.5 px-4 shadow-sm">
        <Text className="text-gray-800 font-bold text-sm">Next</Text>
      </TouchableOpacity>
    </View>
  );
}
