import { Image, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import StudentNotificationBell from "../student/StudentNotificationBell";

export default function AccountHeader({ profileRoute, showSettings = false }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const avatar = user?.image_url
    ? { uri: user.image_url }
    : require("../../assets/default_user.jpg");

  return (
    <View className="flex-row items-center justify-between mb-6">
      <TouchableOpacity onPress={() => navigation.navigate(profileRoute)}>
        <Image
          source={avatar}
          className="rounded-full bg-gray-200"
          style={{ width: 40, height: 40 }}
        />
      </TouchableOpacity>
      <Image
        source={require("../../assets/logo.png")}
        style={{ width: 80, height: 80 }}
        resizeMode="contain"
      />
      <StudentNotificationBell />
    </View>
  );
}
