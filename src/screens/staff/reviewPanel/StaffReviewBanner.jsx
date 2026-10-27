import { Text } from "../../../components/common/FontText";
import { View, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { MAIN_BLACK } from "../../../constants/colors";

export default function StaffReviewBanner() {
  const navigation = useNavigation();

  return (
    <View className="mb-4">
      <View className="mb-5">
        <Text className="text-2xl font-extrabold" style={{ color: MAIN_BLACK }}>Submission History</Text>
        <Text className="text-sm mt-1" style={{ color: MAIN_BLACK }}>Review all submissions.</Text>
      </View>
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-[#FFE452] p-[3px] rounded-full mr-3"
        >
          <View className="bg-[#FFF2A8] px-3.5 py-1 flex-row items-center rounded-full">
            <Feather name="chevron-right" size={13} color="#1a1a1a" />
            <Text className="text-[#1a1a1a] font-medium text-[13px] ml-0.5">Back</Text>
          </View>
        </TouchableOpacity>
        <Text className="font-semibold text-sm" style={{ color: MAIN_BLACK }}>Submissions</Text>
      </View>
    </View>
  );
}
