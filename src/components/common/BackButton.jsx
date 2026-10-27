import { TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Text } from "./FontText";

export default function BackButton() {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      className="bg-[#FFE452] p-[3px] rounded-full shadow-sm"
    >
      <View className="bg-[#FFF2A8] px-3.5 py-1 flex-row items-center rounded-full">
        <Text className="text-[#1a1a1a] font-medium text-base mr-1 leading-5">
          ‹
        </Text>
        <Text className="text-[#1a1a1a] font-medium text-[13px]">Back</Text>
      </View>
    </TouchableOpacity>
  );
}
