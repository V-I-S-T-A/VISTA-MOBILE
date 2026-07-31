import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function SubmissionHistoryTop() {
  const navigation = useNavigation();

  return (
    <View className="mb-6">
      <Text className="text-2xl font-extrabold text-vistaNavy">Submission History</Text>
      <Text className="text-gray-600 text-[13px] mt-1 mb-5">Review all submissions.</Text>
      
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
        <Text className="text-vistaNavy font-semibold text-sm">Submissions</Text>
      </View>
    </View>
  );
}
