import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function ReviewDetailsTopSection() {
  const navigation = useNavigation();

  return (
    <View className="mb-6">
      <Text className="text-2xl font-extrabold text-vistaNavy">Review Panel</Text>
      <Text className="text-gray-600 text-sm mt-1 mb-5">Updating of submitted document status.</Text>
      
      <View className="flex-row items-center">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="bg-[#FFE452] p-[3px] rounded-full mr-3 shadow-sm"
        >
          <View className="bg-[#FFF2A8] px-3.5 py-1 flex-row items-center rounded-full">
            <Text className="text-[#1a1a1a] font-medium text-base mr-1 leading-5">›</Text>
            <Text className="text-[#1a1a1a] font-medium text-[13px]">Back</Text>
          </View>
        </TouchableOpacity>
        <Text className="text-vistaNavy font-semibold text-sm">Review Details</Text>
      </View>
    </View>
  );
}
