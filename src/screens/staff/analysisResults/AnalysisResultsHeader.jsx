import { View, Text, Image, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function AnalysisResultsHeader({ onBackPress }) {
  return (
    <>
      <View className="flex-row items-center justify-between mb-4">
        <Image
          source={require("../../../assets/default_user.jpg")}
          className="w-10 h-10 rounded-full"
        />
        <Image
          source={require("../../../assets/logo.png")}
          className="w-14 h-14"
          resizeMode="contain"
        />
        <TouchableOpacity>
          <Feather name="sliders" size={23} color="#111827" />
        </TouchableOpacity>
      </View>

      <Text className="text-2xl font-extrabold text-vistaNavy">
        Analysis Results
      </Text>
      <Text className="text-vistaNavy text-sm font-semibold leading-4 mb-4">
        Reviewing extracted entities and document classification metrics.
      </Text>

      <TouchableOpacity
        onPress={onBackPress}
        className="self-start bg-[#FFE45C] rounded-full px-3 py-1 mb-4 flex-row items-center"
      >
        <Feather name="chevron-left" size={13} color="#8A7A1C" />
        <Text className="text-[#8A7A1C] text-xs font-bold">Back</Text>
      </TouchableOpacity>
    </>
  );
}