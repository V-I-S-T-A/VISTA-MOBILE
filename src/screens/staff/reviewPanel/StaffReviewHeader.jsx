import { View, Image, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function StaffReviewHeader() {
  return (
    <View className="flex-row items-center justify-between mb-6">
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
  );
}
