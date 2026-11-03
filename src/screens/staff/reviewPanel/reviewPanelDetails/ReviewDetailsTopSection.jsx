import PageHeading from "../../../../components/common/PageHeading";
import { Text } from "../../../../components/common/FontText";
import { View, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function ReviewDetailsTopSection() {
  const navigation = useNavigation();

  return (
    <View className="mb-4">
      <PageHeading title="Track Details" subtitle="Reviewing processing status." />
      
      <View className="flex-row items-center">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="bg-[#FFE452] p-[3px] rounded-full mr-3 shadow-sm"
        >
          <View className="bg-[#FFF2A8] px-3.5 py-1 flex-row items-center rounded-full">
            <Text className="text-[#1a1a1a] font-medium text-base mr-1 leading-5">‹</Text>
            <Text className="text-[#1a1a1a] font-medium text-[13px]">Back</Text>
          </View>
        </TouchableOpacity>
        <Text className="text-vistaNavy font-medium text-sm">Track Details</Text>
      </View>
    </View>
  );
}
