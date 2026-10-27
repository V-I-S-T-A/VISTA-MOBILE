import { Text } from "../../../../components/common/FontText";
import { View } from "react-native";
import BackButton from "../../../../components/common/BackButton";
import { MAIN_BLACK } from "../../../../constants/colors";

export default function SubmissionHistoryTop() {
  return (
    <View className="mb-6">
      <Text className="text-2xl font-extrabold" style={{ color: MAIN_BLACK }}>Submission History</Text>
      <Text className="text-gray-600 text-[13px] mt-1 mb-5">Review all submissions.</Text>
      
      <View className="flex-row items-center">
        <View className="mr-3">
          <BackButton />
        </View>
        <Text className="font-semibold text-sm" style={{ color: MAIN_BLACK }}>Submissions</Text>
      </View>
    </View>
  );
}
