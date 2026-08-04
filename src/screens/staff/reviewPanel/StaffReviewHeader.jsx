import { View, Image, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../../context/AuthContext";

export default function StaffReviewHeader() {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const avatarUrl = user?.image_url 
    ? { uri: user.image_url }
    : require("../../../assets/default_user.jpg");

  return (
    <View className="flex-row items-center justify-between mb-6">
      <TouchableOpacity onPress={() => navigation.navigate("StaffProfile")}>
        <Image
          source={avatarUrl}
          className="w-10 h-10 rounded-full bg-gray-200"
        />
      </TouchableOpacity>
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
