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
          className="bg-[#FFD740] flex-row items-center px-4 py-1.5 rounded-full mr-4 shadow-sm"
        >
          <Feather name="chevron-left" size={16} color="#4b5563" />
          <Text className="text-gray-700 font-semibold text-sm ml-1">Back</Text>
        </TouchableOpacity>
        <Text className="text-vistaNavy font-semibold text-sm">Submissions</Text>
      </View>
    </View>
  );
}
